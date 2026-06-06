import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { AUDIT_ACTIONS, type UserRole } from "@/constants/auth";
import { auditLogs, jobRuns, reportRuns } from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import { QUEUE_NAMES } from "@/lib/queue";
import { deletePrivateObject } from "@/lib/object-storage";
import type { RequestContext } from "@/lib/request";
import { NotFoundAppError, ValidationAppError } from "@/lib/errors";
import { generateReportPdf } from "@/client/report-pdf";

import {
  buildPagination,
  combineConditions,
  countSql,
  getListFilters,
  toString,
  type ListResponse,
} from "./list-utils";

export type ReportRunListItem = {
  completedAt: Date | null;
  createdAt: Date;
  fileSizeBytes: number | null;
  filters: Record<string, unknown>;
  filename: string | null;
  id: string;
  progress: number;
  safeError: string | null;
  startedAt: Date | null;
  status: string;
  type: string;
};

export type RequestReportInput = {
  actorRole: UserRole;
  requesterUserId: string;
  requestContext: RequestContext;
  type: string;
  filters: Record<string, unknown>;
};

/**
 * Report history and background report request service.
 */
export class ReportsClient {
  async list(searchParams: Record<string, unknown>): Promise<ListResponse<ReportRunListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const status = toString(filters.where.status);
    const type = toString(filters.where.type);

    if (status) conditions.push(eq(reportRuns.status, status as never));
    if (type) conditions.push(eq(reportRuns.type, type));

    const whereClause = combineConditions(conditions);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb.select({ total: countSql() }).from(reportRuns).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    const loadRows = async () => {
      let listQuery = readDb
        .select()
        .from(reportRuns)
        .orderBy(desc(reportRuns.createdAt))
        .limit(filters.limit)
        .offset(offset)
        .$dynamic();
      if (whereClause) listQuery = listQuery.where(whereClause);

      return listQuery;
    };

    let rows = await loadRows();
    const activeRows = rows.filter((row) =>
      row.status === "QUEUED" || row.status === "PROCESSING"
    );

    for (const row of activeRows) {
      await this.completeReportRun(row.id, { throwOnError: false });
    }

    if (activeRows.length > 0) {
      rows = await loadRows();
    }

    return {
      data: rows.map((row) => ({
        completedAt: row.completedAt ?? null,
        createdAt: row.createdAt,
        fileSizeBytes: row.fileSizeBytes ?? null,
        filters: row.filters,
        filename: row.filename ?? null,
        id: row.id,
        progress: row.progress,
        safeError: row.safeError ?? null,
        startedAt: row.startedAt ?? null,
        status: row.status,
        type: row.type,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async requestReport(input: RequestReportInput) {
    const { report } = await db.transaction(async (tx) => {
      const [createdReport] = await tx
        .insert(reportRuns)
        .values({
          filters: input.filters,
          progress: 25,
          requesterUserId: input.requesterUserId,
          startedAt: new Date(),
          status: "PROCESSING",
          type: input.type,
        })
        .returning();

      const [createdJobRun] = await tx
        .insert(jobRuns)
        .values({
          correlationId: input.requestContext.correlationId,
          entityId: createdReport.id,
          entityType: "report",
          jobKey: `report:${createdReport.id}`,
          jobType: "REPORT_GENERATION",
          queueName: QUEUE_NAMES.reports,
          lockedAt: new Date(),
          progress: 25,
          startedAt: new Date(),
          status: "PROCESSING",
        })
        .returning();

      await tx.insert(auditLogs).values({
        action: AUDIT_ACTIONS.REPORT_GENERATED,
        actorRole: input.actorRole,
        actorUserId: input.requesterUserId,
        correlationId: input.requestContext.correlationId,
        description: "Permintaan laporan dibuat dan PDF dirender di memori saat download.",
        ipAddress: input.requestContext.ipAddress,
        metadata: {
          filters: input.filters,
          jobRunId: createdJobRun.id,
          reportId: createdReport.id,
          type: input.type,
        },
        result: "SUCCESS",
        targetId: createdReport.id,
        targetType: "report",
        userAgent: input.requestContext.userAgent,
      });

      return { report: createdReport };
    });

    return this.completeReportRun(report.id, { throwOnError: true });
  }

  async getDownload(id: string) {
    const [report] = await readDb
      .select({
        fileObjectKey: reportRuns.fileObjectKey,
        filename: reportRuns.filename,
        filters: reportRuns.filters,
        status: reportRuns.status,
        type: reportRuns.type,
      })
      .from(reportRuns)
      .where(eq(reportRuns.id, id))
      .limit(1);

    if (!report) {
      throw new NotFoundAppError("Laporan tidak ditemukan.");
    }

    if (report.status !== "COMPLETED") {
      await this.completeReportRun(id, { throwOnError: true });
    }

    const { bytes } = await generateReportPdf(report.type, report.filters);
    const filename = report.filename ?? `laporan-${report.type}-${id.slice(0, 8)}.pdf`;

    if (report.fileObjectKey) {
      try {
        await deletePrivateObject(report.fileObjectKey);
      } catch (error) {
        console.warn("File laporan lama gagal dihapus.", error);
      }

      await db
        .update(reportRuns)
        .set({
          fileObjectKey: null,
          fileSizeBytes: bytes.byteLength,
          filename,
          updatedAt: new Date(),
        })
        .where(eq(reportRuns.id, id));
    }

    return {
      bytes,
      contentType: "application/pdf",
      filename,
    };
  }

  private async completeReportRun(
    id: string,
    options: { throwOnError: boolean },
  ) {
    const [report] = await readDb
      .select()
      .from(reportRuns)
      .where(eq(reportRuns.id, id))
      .limit(1);

    if (!report) {
      throw new NotFoundAppError("Laporan tidak ditemukan.");
    }

    if (report.status === "COMPLETED") {
      return report;
    }

    const startedAt = report.startedAt ?? new Date();

    await db
      .update(reportRuns)
      .set({
        progress: 50,
        safeError: null,
        startedAt,
        status: "PROCESSING",
        updatedAt: new Date(),
      })
      .where(eq(reportRuns.id, id));

    await db
      .update(jobRuns)
      .set({
        lockedAt: new Date(),
        progress: 50,
        safeError: null,
        startedAt,
        status: "PROCESSING",
        updatedAt: new Date(),
      })
      .where(
        and(eq(jobRuns.entityType, "report"), eq(jobRuns.entityId, id)),
      );

    try {
      const { bytes } = await generateReportPdf(report.type, report.filters);
      const filename =
        report.filename ?? `laporan-${report.type}-${id.slice(0, 8)}.pdf`;

      if (report.fileObjectKey) {
        try {
          await deletePrivateObject(report.fileObjectKey);
        } catch (error) {
          console.warn("File laporan lama gagal dihapus.", error);
        }
      }

      const completedAt = new Date();

      const [completedReport] = await db
        .update(reportRuns)
        .set({
          completedAt,
          fileObjectKey: null,
          fileSizeBytes: bytes.byteLength,
          filename,
          progress: 100,
          safeError: null,
          status: "COMPLETED",
          updatedAt: completedAt,
        })
        .where(eq(reportRuns.id, id))
        .returning();

      await db
        .update(jobRuns)
        .set({
          completedAt,
          lockedAt: null,
          progress: 100,
          safeError: null,
          status: "COMPLETED",
          updatedAt: completedAt,
        })
        .where(
          and(eq(jobRuns.entityType, "report"), eq(jobRuns.entityId, id)),
        );

      return completedReport;
    } catch (error) {
      const safeError =
        error instanceof Error ? error.message : "Laporan gagal dibuat.";
      const completedAt = new Date();

      await db
        .update(reportRuns)
        .set({
          completedAt,
          progress: 100,
          safeError,
          status: "FAILED",
          updatedAt: completedAt,
        })
        .where(eq(reportRuns.id, id));

      await db
        .update(jobRuns)
        .set({
          completedAt,
          lockedAt: null,
          safeError,
          status: "FAILED",
          updatedAt: completedAt,
        })
        .where(
          and(eq(jobRuns.entityType, "report"), eq(jobRuns.entityId, id)),
        );

      if (options.throwOnError) {
        throw new ValidationAppError("Laporan gagal dibuat.");
      }

      return report;
    }
  }
}
