import "server-only";

import { desc, eq } from "drizzle-orm";

import { AUDIT_ACTIONS, type UserRole } from "@/constants/auth";
import type { ImportRowStatus } from "@/constants/domain";
import { auditLogs, importRowResults, importRuns } from "@/drizzle-schema";
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

export type ImportRunListItem = {
  completedAt: Date | null;
  createdAt: Date;
  failedRows: number;
  id: string;
  originalFileName: string;
  processedRows: number;
  safeError: string | null;
  startedAt: Date | null;
  status: string;
  totalRows: number;
  type: string;
  validRows: number;
};

export type ImportRowResultListItem = {
  createdAt: Date;
  id: string;
  message: string | null;
  rowNumber: number;
  status: ImportRowStatus;
};

export type RequestImportInput = {
  actorRole: UserRole;
  fileSizeBytes: number;
  mapping: Record<string, string>;
  originalFileName: string;
  requestContext: RequestContext;
  requesterUserId: string;
  sourceFileObjectKey: string;
  type?: string;
};

/**
 * CSV/Excel import run service. Actual row processing is handled by workers.
 */
export class ImportsClient {
  async list(searchParams: Record<string, unknown>): Promise<ListResponse<ImportRunListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const status = toString(filters.where.status);

    if (status) conditions.push(eq(importRuns.status, status as never));

    const whereClause = combineConditions(conditions);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb.select({ total: countSql() }).from(importRuns).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select()
      .from(importRuns)
      .orderBy(desc(importRuns.createdAt))
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        completedAt: row.completedAt ?? null,
        createdAt: row.createdAt,
        failedRows: row.failedRows,
        id: row.id,
        originalFileName: row.originalFileName,
        processedRows: row.processedRows,
        safeError: row.safeError ?? null,
        startedAt: row.startedAt ?? null,
        status: row.status,
        totalRows: row.totalRows,
        type: row.type,
        validRows: row.validRows,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async listRows(
    importRunId: string,
    searchParams: Record<string, unknown>,
  ): Promise<ListResponse<ImportRowResultListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [eq(importRowResults.importRunId, importRunId)];
    const status = toString(filters.where.status) as ImportRowStatus | undefined;

    if (status) conditions.push(eq(importRowResults.status, status));

    const whereClause = combineConditions(conditions);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb.select({ total: countSql() }).from(importRowResults).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select({
        createdAt: importRowResults.createdAt,
        id: importRowResults.id,
        message: importRowResults.message,
        rowNumber: importRowResults.rowNumber,
        status: importRowResults.status,
      })
      .from(importRowResults)
      .orderBy(importRowResults.rowNumber)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        createdAt: row.createdAt,
        id: row.id,
        message: row.message ?? null,
        rowNumber: row.rowNumber,
        status: row.status,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async requestImport(input: RequestImportInput) {
    const [importRun] = await db
      .insert(importRuns)
      .values({
        fileSizeBytes: input.fileSizeBytes,
        mapping: input.mapping,
        originalFileName: input.originalFileName,
        requesterUserId: input.requesterUserId,
        sourceFileObjectKey: input.sourceFileObjectKey,
        status: "QUEUED",
        type: input.type ?? "MEDICINE",
      })
      .returning();

    await db.insert(auditLogs).values({
      action: AUDIT_ACTIONS.IMPORT_RUN,
      actorRole: input.actorRole,
      actorUserId: input.requesterUserId,
      correlationId: input.requestContext.correlationId,
      description: "Import obat dibuat dan masuk antrean background job.",
      ipAddress: input.requestContext.ipAddress,
      metadata: {
        importRunId: importRun.id,
        originalFileName: input.originalFileName,
        type: importRun.type,
      },
      result: "SUCCESS",
      targetId: importRun.id,
      targetType: "import",
      userAgent: input.requestContext.userAgent,
    });

    return importRun;
  }
}
