import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { createId } from "@paralleldrive/cuid2";
import { parse as parseCsv } from "csv-parse/sync";
import { and, asc, desc, eq, gte, isNull, lte, ne, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import IORedis from "ioredis";

import { ENV } from "@/constants/config";
import {
  auditLogs,
  importRowResults,
  importRuns,
  jobRuns,
  medicineBatches,
  medicineCategories,
  medicines,
  orderStatusHistory,
  orders,
  paymentEvents,
  payments,
  reportRuns,
  stockReservations,
  stockMovements,
  suppliers,
} from "@/drizzle-schema";
import { db } from "@/lib/db";
import {
  QUEUE_NAMES,
  createQueueWorker,
  type QueueJobEnvelope,
} from "@/lib/queue";
import { InventoryWorkflowClient } from "@/client/inventory";

type WorkerPayload = QueueJobEnvelope<Record<string, unknown>>;
type ImportRecord = Record<string, string>;

const PRIVATE_STORAGE_ROOT = path.join(process.cwd(), ".makmur-storage");
const WORKER_HEARTBEAT_KEY = "makmur-farma:worker:heartbeat";
const MAINTENANCE_INTERVAL_MS = 60_000;
const inventoryWorkflow = new InventoryWorkflowClient();

function toText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeCode(prefix: string, value: string) {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized || `${prefix}-${createId().slice(0, 8).toUpperCase()}`;
}

function parseBoolean(value: string) {
  return ["true", "ya", "y", "1", "perlu", "resep", "yes"].includes(
    value.trim().toLowerCase(),
  );
}

function parsePositiveInt(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed.toFixed(2) : null;
}

function parseDateText(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

async function markJobProcessing(jobId: string | undefined) {
  if (!jobId) return;

  await db
    .update(jobRuns)
    .set({
      attempt: sql`${jobRuns.attempt} + 1`,
      lockedAt: new Date(),
      startedAt: new Date(),
      status: "PROCESSING",
      updatedAt: new Date(),
    })
    .where(eq(jobRuns.id, jobId));
}

async function markJobCompleted(jobId: string | undefined) {
  if (!jobId) return;

  await db
    .update(jobRuns)
    .set({
      completedAt: new Date(),
      lockedAt: null,
      progress: 100,
      status: "COMPLETED",
      updatedAt: new Date(),
    })
    .where(eq(jobRuns.id, jobId));
}

async function markJobFailed(jobId: string | undefined, safeError: string) {
  if (!jobId) return;

  await db
    .update(jobRuns)
    .set({
      completedAt: new Date(),
      lockedAt: null,
      safeError,
      status: "FAILED",
      updatedAt: new Date(),
    })
    .where(eq(jobRuns.id, jobId));
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createSimplePdf(lines: string[]) {
  const content = [
    "BT",
    "/F1 11 Tf",
    "50 780 Td",
    ...lines.flatMap((line, index) => [
      index === 0 ? "" : "0 -16 Td",
      `(${escapePdfText(line).slice(0, 110)}) Tj`,
    ]),
    "ET",
  ]
    .filter(Boolean)
    .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let body = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body);
}

async function processReportJob(payload: WorkerPayload) {
  await markJobProcessing(payload.jobId);
  const reportRunId = toText(payload.payload.reportRunId);

  try {
    const [report] = await db
      .select()
      .from(reportRuns)
      .where(eq(reportRuns.id, reportRunId))
      .limit(1);

    if (!report) throw new Error("Report run tidak ditemukan.");

    const from = toText(report.filters.from);
    const to = toText(report.filters.to);
    const conditions = [
      eq(payments.status, "PAID"),
      ne(orders.status, "CANCELLED"),
      ne(orders.status, "EXPIRED"),
      ne(orders.status, "REFUNDED"),
    ];

    if (from) conditions.push(gte(orders.createdAt, new Date(from)));
    if (to) conditions.push(lte(orders.createdAt, new Date(to)));

    await db
      .update(reportRuns)
      .set({ progress: 25, startedAt: new Date(), status: "PROCESSING", updatedAt: new Date() })
      .where(eq(reportRuns.id, report.id));

    const rows = await db
      .select({
        createdAt: orders.createdAt,
        grandTotal: orders.grandTotal,
        orderNumber: orders.orderNumber,
        paymentMethod: payments.method,
        status: orders.status,
      })
      .from(orders)
      .innerJoin(payments, eq(payments.orderId, orders.id))
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(200);

    const totalRevenue = rows.reduce(
      (sum, row) => sum + Number(row.grandTotal),
      0,
    );
    const generatedAt = new Date();
    const lines = [
      "Makmur Farma - Klinik Makmur Jaya",
      `Laporan: ${report.type}`,
      `Periode: ${from || "awal"} sampai ${to || "sekarang"}`,
      `Dibuat: ${generatedAt.toISOString()}`,
      `Total order dibayar: ${rows.length}`,
      `Total revenue: Rp ${totalRevenue.toLocaleString("id-ID")}`,
      "",
      "Daftar transaksi:",
      ...rows.slice(0, 35).map(
        (row) =>
          `${row.orderNumber} | ${row.createdAt.toISOString()} | ${row.paymentMethod} | Rp ${Number(row.grandTotal).toLocaleString("id-ID")}`,
      ),
      rows.length === 0 ? "Tidak ada transaksi pada periode ini." : "",
    ];

    const pdf = createSimplePdf(lines);
    const relativeObjectKey = `private/reports/${report.id}.pdf`;
    const targetPath = path.join(PRIVATE_STORAGE_ROOT, relativeObjectKey);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, pdf);

    await db
      .update(reportRuns)
      .set({
        completedAt: new Date(),
        fileObjectKey: relativeObjectKey,
        fileSizeBytes: pdf.byteLength,
        filename: `laporan-${report.type}-${report.id.slice(0, 8)}.pdf`,
        progress: 100,
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(eq(reportRuns.id, report.id));

    await markJobCompleted(payload.jobId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Laporan gagal dibuat.";
    await db
      .update(reportRuns)
      .set({
        completedAt: new Date(),
        safeError: message,
        status: "FAILED",
        updatedAt: new Date(),
      })
      .where(eq(reportRuns.id, reportRunId));
    await markJobFailed(payload.jobId, message);
  }
}

async function resolveImportPath(objectKey: string) {
  const candidates = [
    path.isAbsolute(objectKey) ? objectKey : "",
    path.join(process.cwd(), objectKey),
    path.join(PRIVATE_STORAGE_ROOT, objectKey),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await stat(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  throw new Error("File import tidak ditemukan di storage lokal.");
}

async function readImportRows(filePath: string): Promise<ImportRecord[]> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".csv") {
    const content = await readFile(filePath, "utf8");
    return parseCsv(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ImportRecord[];
  }

  if (ext === ".xlsx" || ext === ".xls") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    const headers = (sheet.getRow(1).values as unknown[])
      .slice(1)
      .map((value) => toText(value));
    const rows: ImportRecord[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = (row.values as unknown[]).slice(1);
      const record: ImportRecord = {};
      headers.forEach((header, index) => {
        if (header) record[header] = toText(values[index]);
      });
      if (Object.values(record).some(Boolean)) rows.push(record);
    });

    return rows;
  }

  throw new Error("Format import harus CSV atau Excel.");
}

function getMapped(record: ImportRecord, mapping: Record<string, string>, field: string) {
  return toText(record[mapping[field] ?? field] ?? record[field]);
}

async function ensureCategory(name: string) {
  if (!name) return null;
  const [existing] = await db
    .select({ id: medicineCategories.id })
    .from(medicineCategories)
    .where(eq(medicineCategories.name, name))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(medicineCategories)
    .values({
      code: normalizeCode("CAT", name),
      name,
      slug: toSlug(name) || `kategori-${createId()}`,
    })
    .returning({ id: medicineCategories.id });

  return created.id;
}

async function ensureSupplier(name: string) {
  if (!name) return null;
  const [existing] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(eq(suppliers.name, name))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(suppliers)
    .values({
      code: normalizeCode("SUP", name),
      name,
    })
    .returning({ id: suppliers.id });

  return created.id;
}

async function processImportRow(
  importRunId: string,
  rowNumber: number,
  record: ImportRecord,
  mapping: Record<string, string>,
) {
  const code = normalizeCode("MED", getMapped(record, mapping, "medicineCode"));
  const name = getMapped(record, mapping, "medicineName");
  const sellingPrice = parseMoney(getMapped(record, mapping, "sellingPrice"));
  const batchNumber = getMapped(record, mapping, "batchNumber");
  const receivedDate = parseDateText(getMapped(record, mapping, "receivedDate"));
  const expiryDate = parseDateText(getMapped(record, mapping, "expiryDate"));
  const purchaseCost = parseMoney(getMapped(record, mapping, "purchaseCost"));
  const openingQuantity = parsePositiveInt(
    getMapped(record, mapping, "openingQuantity"),
  );

  if (!name || !sellingPrice) {
    throw new Error("Nama obat dan harga jual wajib valid.");
  }

  await db.transaction(async (tx) => {
    const categoryId = await ensureCategory(getMapped(record, mapping, "category"));
    const supplierId = await ensureSupplier(getMapped(record, mapping, "supplier"));
    const [existingMedicine] = await tx
      .select({ id: medicines.id })
      .from(medicines)
      .where(eq(medicines.code, code))
      .limit(1);

    const medicineId =
      existingMedicine?.id ??
      (
        await tx
          .insert(medicines)
          .values({
            categoryId,
            code,
            criticalStockThreshold:
              parsePositiveInt(getMapped(record, mapping, "criticalStockThreshold")) ??
              3,
            description: getMapped(record, mapping, "description") || null,
            lowStockThreshold:
              parsePositiveInt(getMapped(record, mapping, "lowStockThreshold")) ?? 10,
            name,
            prescriptionRequired: parseBoolean(
              getMapped(record, mapping, "prescriptionRequired"),
            ),
            sellingPrice,
            slug: toSlug(name) || `obat-${createId()}`,
            unit: getMapped(record, mapping, "unit") || "unit",
          })
          .returning({ id: medicines.id })
      )[0].id;

    if (batchNumber && openingQuantity && receivedDate && expiryDate && purchaseCost) {
      const [batch] = await tx
        .insert(medicineBatches)
        .values({
          availableQuantity: openingQuantity,
          batchNumber,
          expiryDate,
          medicineId,
          purchaseCost,
          receivedDate,
          reservedQuantity: 0,
          status: "AVAILABLE",
          supplierId,
        })
        .returning();

      await tx.insert(stockMovements).values({
        availableAfter: openingQuantity,
        availableBefore: 0,
        batchId: batch.id,
        medicineId,
        quantityDelta: openingQuantity,
        reason: "Stok awal dari import.",
        referenceId: importRunId,
        referenceType: "IMPORT",
        reservedAfter: 0,
        reservedBefore: 0,
        type: "IMPORT_OPENING",
      });
    }

    await tx.insert(importRowResults).values({
      importRunId,
      message: "Row berhasil diimport.",
      payload: record,
      rowNumber,
      status: "IMPORTED",
    });
  });
}

async function processImportJob(payload: WorkerPayload) {
  await markJobProcessing(payload.jobId);
  const importRunId = toText(payload.payload.importRunId);

  try {
    const [run] = await db
      .select()
      .from(importRuns)
      .where(eq(importRuns.id, importRunId))
      .limit(1);

    if (!run) throw new Error("Import run tidak ditemukan.");

    await db
      .update(importRuns)
      .set({ startedAt: new Date(), status: "PROCESSING", updatedAt: new Date() })
      .where(eq(importRuns.id, run.id));

    const filePath = await resolveImportPath(run.sourceFileObjectKey);
    const rows = await readImportRows(filePath);
    let success = 0;
    let failed = 0;

    await db
      .update(importRuns)
      .set({ totalRows: rows.length, updatedAt: new Date() })
      .where(eq(importRuns.id, run.id));

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      try {
        await processImportRow(run.id, rowNumber, row, run.mapping);
        success += 1;
      } catch (error) {
        failed += 1;
        await db.insert(importRowResults).values({
          importRunId: run.id,
          message: error instanceof Error ? error.message : "Row gagal diimport.",
          payload: row,
          rowNumber,
          status: "FAILED",
        });
      }

      await db
        .update(importRuns)
        .set({
          failedRows: failed,
          processedRows: success + failed,
          validRows: success,
          updatedAt: new Date(),
        })
        .where(eq(importRuns.id, run.id));
    }

    await db
      .update(importRuns)
      .set({
        completedAt: new Date(),
        failedRows: failed,
        processedRows: success + failed,
        status: failed > 0 ? "PARTIALLY_COMPLETED" : "COMPLETED",
        updatedAt: new Date(),
        validRows: success,
      })
      .where(eq(importRuns.id, run.id));

    if (failed > 0) {
      await db
        .update(jobRuns)
        .set({
          completedAt: new Date(),
          lockedAt: null,
          progress: 100,
          status: "PARTIALLY_COMPLETED",
          updatedAt: new Date(),
        })
        .where(eq(jobRuns.id, payload.jobId));
    } else {
      await markJobCompleted(payload.jobId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import gagal.";
    await db
      .update(importRuns)
      .set({
        completedAt: new Date(),
        safeError: message,
        status: "FAILED",
        updatedAt: new Date(),
      })
      .where(eq(importRuns.id, importRunId));
    await markJobFailed(payload.jobId, message);
  }
}

async function unsupportedHandler(payload: WorkerPayload, queueName: string) {
  await markJobProcessing(payload.jobId);
  await markJobFailed(
    payload.jobId,
    `Handler worker ${queueName} belum dikonfigurasi untuk efek bisnis final.`,
  );
}

async function processExpiredPaymentsAndReservations() {
  const now = new Date();
  const expiredPayments = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      status: payments.status,
    })
    .from(payments)
    .where(
      and(
        lte(payments.expiresAt, now),
        ne(payments.status, "PAID"),
        ne(payments.status, "FAILED"),
        ne(payments.status, "EXPIRED"),
        ne(payments.status, "CANCELLED"),
        ne(payments.status, "REFUNDED"),
      ),
    )
    .limit(50);

  for (const payment of expiredPayments) {
    await db.transaction(async (tx) => {
      const [order] = await tx
        .select({ id: orders.id, status: orders.status })
        .from(orders)
        .where(eq(orders.id, payment.orderId))
        .limit(1);

      await tx
        .update(payments)
        .set({
          callbackVerifiedAt: now,
          status: "EXPIRED",
          updatedAt: now,
        })
        .where(eq(payments.id, payment.id));

      await tx.insert(paymentEvents).values({
        eventType: "worker.payment_expired",
        paymentId: payment.id,
        safePayload: {
          previousStatus: payment.status,
          worker: true,
        },
        status: "EXPIRED",
      });

      if (order) {
        await inventoryWorkflow.releaseOrderReservationsTx(
          tx,
          order.id,
          "Reservasi dilepas karena pembayaran kedaluwarsa.",
        );

        if (order.status !== "EXPIRED" && order.status !== "CANCELLED") {
          await tx
            .update(orders)
            .set({ status: "EXPIRED", updatedAt: now })
            .where(eq(orders.id, order.id));

          await tx.insert(orderStatusHistory).values({
            fromStatus: order.status,
            metadata: { worker: true, paymentId: payment.id },
            note: "Pesanan otomatis expired karena pembayaran kedaluwarsa.",
            orderId: order.id,
            toStatus: "EXPIRED",
          });
        }
      }
    });
  }

  const expiredReservationOrders = await db
    .select({ orderId: stockReservations.orderId })
    .from(stockReservations)
    .where(
      and(
        lte(stockReservations.expiresAt, now),
        isNull(stockReservations.releasedAt),
        isNull(stockReservations.fulfilledAt),
      ),
    )
    .groupBy(stockReservations.orderId)
    .limit(50);

  for (const reservation of expiredReservationOrders) {
    await inventoryWorkflow.releaseOrderReservations(
      reservation.orderId,
      "Reservasi stok otomatis expired.",
    );
  }
}

async function startHeartbeat() {
  if (!ENV.redisUrl) return null;
  const redis = new IORedis(ENV.redisUrl, {
    maxRetriesPerRequest: null,
  });

  const writeHeartbeat = async () => {
    await redis.set(
      WORKER_HEARTBEAT_KEY,
      JSON.stringify({
        pid: process.pid,
        queues: Object.values(QUEUE_NAMES),
        timestamp: new Date().toISOString(),
      }),
      "EX",
      60,
    );
  };

  await writeHeartbeat();
  return setInterval(() => {
    writeHeartbeat().catch((error) => {
      console.error("Worker heartbeat gagal.", error);
    });
  }, 15_000);
}

function startMaintenanceLoop() {
  const run = () => {
    processExpiredPaymentsAndReservations().catch((error) => {
      console.error("Maintenance payment/reservation gagal.", error);
    });
  };

  run();
  return setInterval(run, MAINTENANCE_INTERVAL_MS);
}

async function main() {
  await mkdir(PRIVATE_STORAGE_ROOT, { recursive: true });
  const heartbeat = await startHeartbeat();
  const maintenance = startMaintenanceLoop();
  const workers = [
    createQueueWorker<WorkerPayload>(QUEUE_NAMES.reports, (job) =>
      processReportJob(job.data),
    ),
    createQueueWorker<WorkerPayload>(QUEUE_NAMES.imports, (job) =>
      processImportJob(job.data),
    ),
    createQueueWorker<WorkerPayload>(QUEUE_NAMES.notifications, (job) =>
      unsupportedHandler(job.data, QUEUE_NAMES.notifications),
    ),
    createQueueWorker<WorkerPayload>(QUEUE_NAMES.maintenance, (job) =>
      unsupportedHandler(job.data, QUEUE_NAMES.maintenance),
    ),
  ];

  console.info(
    `Worker aktif untuk queue: ${workers.map((worker) => worker.name).join(", ")}`,
  );

  return { heartbeat, maintenance };
}

main().catch((error) => {
  console.error("Worker gagal dimulai.", error);
  process.exitCode = 1;
});
