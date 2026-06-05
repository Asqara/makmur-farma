import "server-only";

import { desc, eq } from "drizzle-orm";

import { AUDIT_ACTIONS, type UserRole } from "@/constants/auth";
import { auditLogs, reportRuns } from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import type { RequestContext } from "@/lib/request";

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
    const [report] = await db
      .insert(reportRuns)
      .values({
        filters: input.filters,
        progress: 0,
        requesterUserId: input.requesterUserId,
        status: "QUEUED",
        type: input.type,
      })
      .returning();

    await db.insert(auditLogs).values({
      action: AUDIT_ACTIONS.REPORT_GENERATED,
      actorRole: input.actorRole,
      actorUserId: input.requesterUserId,
      correlationId: input.requestContext.correlationId,
      description: "Permintaan laporan dibuat dan masuk antrean background job.",
      ipAddress: input.requestContext.ipAddress,
      metadata: {
        filters: input.filters,
        reportId: report.id,
        type: input.type,
      },
      result: "SUCCESS",
      targetId: report.id,
      targetType: "report",
      userAgent: input.requestContext.userAgent,
    });

    return report;
  }
}
