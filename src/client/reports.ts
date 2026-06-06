import "server-only";

import { desc, eq } from "drizzle-orm";

import { AUDIT_ACTIONS, type UserRole } from "@/constants/auth";
import { auditLogs, jobRuns, reportRuns } from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import {
  QUEUE_NAMES,
  createQueue,
  type QueueJobEnvelope,
} from "@/lib/queue";
import { getPrivateObject } from "@/lib/object-storage";
import type { RequestContext } from "@/lib/request";
import { NotFoundAppError, ValidationAppError } from "@/lib/errors";

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

    let listQuery = readDb
      .select()
      .from(reportRuns)
      .orderBy(desc(reportRuns.createdAt))
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        completedAt: row.completedAt ?? null,
        createdAt: row.createdAt,
        fileSizeBytes: row.fileSizeBytes ?? null,
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
    const { jobRun, report } = await db.transaction(async (tx) => {
      const [createdReport] = await tx
        .insert(reportRuns)
        .values({
          filters: input.filters,
          progress: 0,
          requesterUserId: input.requesterUserId,
          status: "QUEUED",
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
          status: "QUEUED",
        })
        .returning();

      await tx.insert(auditLogs).values({
        action: AUDIT_ACTIONS.REPORT_GENERATED,
        actorRole: input.actorRole,
        actorUserId: input.requesterUserId,
        correlationId: input.requestContext.correlationId,
        description: "Permintaan laporan dibuat dan masuk antrean background job.",
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

      return { jobRun: createdJobRun, report: createdReport };
    });

    const queue = createQueue(QUEUE_NAMES.reports);
    const payload: QueueJobEnvelope<{ reportRunId: string }> = {
      actorUserId: input.requesterUserId,
      correlationId: input.requestContext.correlationId,
      entityId: report.id,
      entityType: "report",
      idempotencyKey: jobRun.jobKey,
      jobId: jobRun.id,
      jobType: "REPORT_GENERATION",
      payload: {
        reportRunId: report.id,
      },
      requestedAt: report.createdAt.toISOString(),
    };

    await queue.add("REPORT_GENERATION", payload, {
      jobId: jobRun.id,
    });

    return report;
  }

  async getDownload(id: string) {
    const [report] = await readDb
      .select({
        fileObjectKey: reportRuns.fileObjectKey,
        filename: reportRuns.filename,
        status: reportRuns.status,
      })
      .from(reportRuns)
      .where(eq(reportRuns.id, id))
      .limit(1);

    if (!report) {
      throw new NotFoundAppError("Laporan tidak ditemukan.");
    }

    if (report.status !== "COMPLETED" || !report.fileObjectKey) {
      throw new ValidationAppError("File laporan belum tersedia.");
    }

    const file = await getPrivateObject(report.fileObjectKey);

    return {
      bytes: file.bytes,
      contentType: file.contentType,
      filename: report.filename ?? `laporan-${id}.pdf`,
    };
  }
}
