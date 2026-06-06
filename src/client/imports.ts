import "server-only";

import { createId } from "@paralleldrive/cuid2";
import { desc, eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";

import { AUDIT_ACTIONS, type UserRole } from "@/constants/auth";
import type { ImportRowStatus } from "@/constants/domain";
import { auditLogs, importRowResults, importRuns, jobRuns } from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import { ValidationAppError } from "@/lib/errors";
import { putPrivateObject } from "@/lib/object-storage";
import {
  QUEUE_NAMES,
  createQueue,
  type QueueJobEnvelope,
} from "@/lib/queue";
import type { RequestContext } from "@/lib/request";

const IMPORT_FILE_MAX_BYTES = 10 * 1024 * 1024;

function sanitizeImportFileName(fileName: string) {
  return (
    fileName
      .trim()
      .replace(/[/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 120) || "import"
  );
}

async function detectFileHeaders(
  bytes: Uint8Array,
  ext: string,
): Promise<string[]> {
  if (ext === "csv") {
    const text = Buffer.from(bytes).toString("utf8");
    const rows = parseCsv(text, { to_line: 1, trim: true, relax_quotes: true }) as unknown[][];
    return (rows[0] ?? []).map(String).filter(Boolean);
  }

  if (ext === "xlsx" || ext === "xls") {
    const workbook = new ExcelJS.Workbook();
    const workbookReader = workbook.xlsx as unknown as {
      load(buffer: Uint8Array): Promise<ExcelJS.Workbook>;
    };
    await workbookReader.load(bytes);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    return (sheet.getRow(1).values as unknown[])
      .slice(1)
      .map(String)
      .filter((v) => v && v !== "undefined");
  }

  return [];
}

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

  async uploadFile(input: {
    bytes: Uint8Array;
    contentType: string;
    fileName: string;
    sizeBytes: number;
  }) {
    const ext = input.fileName.split(".").pop()?.toLowerCase() ?? "";

    if (!["xlsx", "xls", "csv"].includes(ext)) {
      throw new ValidationAppError("Format file harus CSV, XLS, atau XLSX.");
    }

    if (input.sizeBytes > IMPORT_FILE_MAX_BYTES) {
      throw new ValidationAppError("Ukuran file melebihi batas 10 MB.");
    }

    const objectKey = `imports/${createId()}-${sanitizeImportFileName(input.fileName)}`;
    await putPrivateObject(objectKey, input.bytes, input.contentType);

    const headers = await detectFileHeaders(input.bytes, ext);

    return {
      fileName: input.fileName,
      headers,
      objectKey,
      sizeBytes: input.sizeBytes,
    };
  }

  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Template Obat");

    const headers = [
      "medicineName",
      "sellingPrice",
      "medicineCode",
      "category",
      "unit",
      "description",
      "prescriptionRequired",
      "lowStockThreshold",
      "criticalStockThreshold",
      "batchNumber",
      "receivedDate",
      "expiryDate",
      "purchaseCost",
      "openingQuantity",
      "supplier",
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      fgColor: { argb: "FFE2EFDA" },
      pattern: "solid",
      type: "pattern",
    };

    sheet.addRow([
      "Paracetamol 500mg",
      5000,
      "MED-0001",
      "Analgesik",
      "tablet",
      "Obat pereda nyeri dan demam",
      "tidak",
      20,
      5,
      "BATCH-2024-001",
      "2024-01-15",
      "2026-01-15",
      3500,
      100,
      "PT Kimia Farma",
    ]);

    sheet.addRow([
      "Amoxicillin 500mg",
      8500,
      "MED-0002",
      "Antibiotik",
      "kapsul",
      "Antibiotik spektrum luas",
      "ya",
      15,
      5,
      "BATCH-2024-002",
      "2024-02-01",
      "2025-12-31",
      6000,
      50,
      "PT Phapros",
    ]);

    sheet.columns.forEach((col) => {
      col.width = 22;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer as ArrayBuffer);
  }

  async requestImport(input: RequestImportInput) {
    const { importRun, jobRun } = await db.transaction(async (tx) => {
      const [createdImportRun] = await tx
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

      const [createdJobRun] = await tx
        .insert(jobRuns)
        .values({
          correlationId: input.requestContext.correlationId,
          entityId: createdImportRun.id,
          entityType: "import",
          jobKey: `import:${createdImportRun.id}`,
          jobType: "MEDICINE_IMPORT",
          queueName: QUEUE_NAMES.imports,
          status: "QUEUED",
        })
        .returning();

      await tx.insert(auditLogs).values({
        action: AUDIT_ACTIONS.IMPORT_RUN,
        actorRole: input.actorRole,
        actorUserId: input.requesterUserId,
        correlationId: input.requestContext.correlationId,
        description: "Import obat dibuat dan masuk antrean background job.",
        ipAddress: input.requestContext.ipAddress,
        metadata: {
          importRunId: createdImportRun.id,
          jobRunId: createdJobRun.id,
          originalFileName: input.originalFileName,
          type: createdImportRun.type,
        },
        result: "SUCCESS",
        targetId: createdImportRun.id,
        targetType: "import",
        userAgent: input.requestContext.userAgent,
      });

      return { importRun: createdImportRun, jobRun: createdJobRun };
    });

    const queue = createQueue(QUEUE_NAMES.imports);
    const payload: QueueJobEnvelope<{ importRunId: string }> = {
      actorUserId: input.requesterUserId,
      correlationId: input.requestContext.correlationId,
      entityId: importRun.id,
      entityType: "import",
      idempotencyKey: jobRun.jobKey,
      jobId: jobRun.id,
      jobType: "MEDICINE_IMPORT",
      payload: {
        importRunId: importRun.id,
      },
      requestedAt: importRun.createdAt.toISOString(),
    };

    await queue.add("MEDICINE_IMPORT", payload, {
      jobId: jobRun.id,
    });

    return importRun;
  }
}
