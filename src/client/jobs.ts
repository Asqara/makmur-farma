import "server-only";

import IORedis from "ioredis";
import { asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { AUDIT_ACTIONS, type UserRole } from "@/constants/auth";
import type { JobStatus, JobType } from "@/constants/domain";
import {
  applicationErrors,
  auditLogs,
  jobRuns,
  notifications,
} from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import { NotFoundAppError } from "@/lib/errors";
import type { RequestContext } from "@/lib/request";
import type { ErrorLogRecordInput, ErrorLogResolutionInput } from "@/zod-schemas";
import { ENV } from "@/constants/config";

import {
  buildPagination,
  buildTextSearch,
  combineConditions,
  countSql,
  getListFilters,
  toBooleanString,
  toString,
  type ListResponse,
} from "./list-utils";

const JOB_SORT_FIELDS = {
  createdAt: jobRuns.createdAt,
  jobType: jobRuns.jobType,
  queueName: jobRuns.queueName,
  status: jobRuns.status,
} as const;

const WORKER_HEARTBEAT_KEY = "makmur-farma:worker:heartbeat";
const WORKER_HEARTBEAT_STALE_MS = 45_000;

export type JobListItem = {
  attempt: number;
  completedAt: Date | null;
  createdAt: Date;
  entityId: string | null;
  entityType: string | null;
  id: string;
  jobKey: string;
  jobType: JobType;
  maxAttempts: number;
  progress: number;
  queueName: string;
  safeError: string | null;
  startedAt: Date | null;
  status: JobStatus;
};

export type ServiceHealth = {
  description: string;
  lastChecked: string;
  metric: string;
  serviceName: string;
  status: "degraded" | "down" | "healthy" | "unknown";
};

export type MonitoringOverview = {
  errors: {
    critical: number;
    info: number;
    warning: number;
  };
  queues: Array<{
    active: number;
    completed: number;
    failed: number;
    queueName: string;
    waiting: number;
  }>;
  services: ServiceHealth[];
};

export type ApplicationErrorListItem = {
  correlationId: string | null;
  createdAt: Date;
  id: string;
  resolvedAt: Date | null;
  safeMessage: string;
  severity: "critical" | "info" | "warning";
  source: string;
};

type ErrorMutationActor = {
  actorRole: UserRole;
  actorUserId: string;
  requestContext: RequestContext;
};

/**
 * Background job and monitoring query service.
 */
export class JobsClient {
  async list(searchParams: Record<string, unknown>): Promise<ListResponse<JobListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const status = toString(filters.where.status) as JobStatus | undefined;
    const jobType = toString(filters.where.jobType) as JobType | undefined;
    const queueName = toString(filters.where.queueName);
    const searchCondition = buildTextSearch(filters.search, [
      jobRuns.jobKey,
      jobRuns.entityId,
      jobRuns.correlationId,
    ]);

    if (status) conditions.push(eq(jobRuns.status, status));
    if (jobType) conditions.push(eq(jobRuns.jobType, jobType));
    if (queueName) conditions.push(eq(jobRuns.queueName, queueName));
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in JOB_SORT_FIELDS
        ? filters.sortBy
        : "createdAt";
    const sortColumn = JOB_SORT_FIELDS[sortBy as keyof typeof JOB_SORT_FIELDS];
    const orderBy = filters.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb.select({ total: countSql() }).from(jobRuns).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select()
      .from(jobRuns)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        attempt: row.attempt,
        completedAt: row.completedAt ?? null,
        createdAt: row.createdAt,
        entityId: row.entityId ?? null,
        entityType: row.entityType ?? null,
        id: row.id,
        jobKey: row.jobKey,
        jobType: row.jobType,
        maxAttempts: row.maxAttempts,
        progress: row.progress,
        queueName: row.queueName,
        safeError: row.safeError ?? null,
        startedAt: row.startedAt ?? null,
        status: row.status,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async getMonitoringOverview(): Promise<MonitoringOverview> {
    const checkedAt = new Date().toISOString();

    // ── PostgreSQL health check ──────────────────────────────────────────────
    let postgresStatus: ServiceHealth["status"] = "healthy";
    let postgresLatencyMs = 0;
    let postgresMetric = "Query berhasil";

    const pgStart = Date.now();
    try {
      await readDb.execute(sql`SELECT 1`);
      postgresLatencyMs = Date.now() - pgStart;
      postgresMetric = `${postgresLatencyMs} ms`;
    } catch {
      postgresStatus = "degraded";
      postgresMetric = "Koneksi gagal";
    }

    // ── Redis health check ───────────────────────────────────────────────────
    let redisStatus: ServiceHealth["status"] = "unknown";
    let redisMetric = "Tidak dikonfigurasi";
    let workerHeartbeat: { timestamp?: string } | null = null;

    if (ENV.redisUrl) {
      const redisClient = new IORedis(ENV.redisUrl, {
        connectTimeout: 2000,
        lazyConnect: true,
        maxRetriesPerRequest: 0,
      });

      const redisStart = Date.now();
      try {
        await redisClient.connect();
        await redisClient.ping();
        const heartbeatText = await redisClient.get(WORKER_HEARTBEAT_KEY);
        if (heartbeatText) {
          workerHeartbeat = JSON.parse(heartbeatText) as { timestamp?: string };
        }
        const latency = Date.now() - redisStart;
        redisStatus = "healthy";
        redisMetric = `${latency} ms`;
      } catch {
        redisStatus = "degraded";
        redisMetric = "Koneksi gagal";
      } finally {
        redisClient.disconnect();
      }
    }

    // ── Worker / queue health check ──────────────────────────────────────────
    let workerStatus: ServiceHealth["status"] = "unknown";
    let workerMetric = "Heartbeat belum tersedia";

    if (workerHeartbeat?.timestamp) {
      const heartbeatAge = Date.now() - new Date(workerHeartbeat.timestamp).getTime();
      workerStatus =
        heartbeatAge <= WORKER_HEARTBEAT_STALE_MS ? "healthy" : "degraded";
      workerMetric =
        heartbeatAge <= WORKER_HEARTBEAT_STALE_MS
          ? `Heartbeat ${Math.max(0, Math.round(heartbeatAge / 1000))} detik lalu`
          : "Heartbeat stale";
    } else if (ENV.redisUrl && redisStatus !== "healthy") {
      workerStatus = "unknown";
      workerMetric = "Redis tidak dapat dibaca";
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    let stalledCount = 0;
    let queueRows: Array<{
      active: number;
      completed: number;
      failed: number;
      queueName: string;
      waiting: number;
    }> = [];
    let errorRows: Array<{ critical: number; info: number; warning: number }> = [];

    try {
      const [stalledResult, queuesResult, errorsResult] = await Promise.all([
        readDb
          .select({ count: countSql() })
          .from(jobRuns)
          .where(
            sql`${jobRuns.status} = 'PROCESSING' AND ${jobRuns.lockedAt} < ${tenMinutesAgo}`,
          ),
        readDb
          .select({
            active: countFiltered("PROCESSING"),
            completed: countFiltered("COMPLETED"),
            failed: countFiltered("FAILED"),
            queueName: jobRuns.queueName,
            waiting: countFiltered("QUEUED"),
          })
          .from(jobRuns)
          .groupBy(jobRuns.queueName),
        readDb
          .select({
            critical: countErrorSeverity("critical"),
            info: countErrorSeverity("info"),
            warning: countErrorSeverity("warning"),
          })
          .from(applicationErrors),
      ]);

      stalledCount = Number(stalledResult[0]?.count ?? 0);
      queueRows = queuesResult.map((row) => ({
        active: Number(row.active ?? 0),
        completed: Number(row.completed ?? 0),
        failed: Number(row.failed ?? 0),
        queueName: row.queueName,
        waiting: Number(row.waiting ?? 0),
      }));
      errorRows = errorsResult;

      if (stalledCount > 0) {
        workerStatus = "degraded";
        workerMetric = `${stalledCount} job stalled`;
      }
    } catch {
      workerStatus = "degraded";
      workerMetric = "Gagal memeriksa worker";
    }

    const criticalErrors = Number(errorRows[0]?.critical ?? 0);

    return {
      errors: {
        critical: criticalErrors,
        info: Number(errorRows[0]?.info ?? 0),
        warning: Number(errorRows[0]?.warning ?? 0),
      },
      queues: queueRows,
      services: [
        {
          description: "PostgreSQL menjadi sumber data operasional.",
          lastChecked: checkedAt,
          metric: postgresMetric,
          serviceName: "PostgreSQL",
          status: postgresStatus,
        },
        {
          description: "Redis digunakan untuk antrian background job.",
          lastChecked: checkedAt,
          metric: redisMetric,
          serviceName: "Redis",
          status: redisStatus,
        },
        {
          description: "Dilihat dari job PROCESSING yang terkunci >10 menit.",
          lastChecked: checkedAt,
          metric: workerMetric,
          serviceName: "Worker",
          status: workerStatus,
        },
      ],
    };
  }

  async listErrors(
    searchParams: Record<string, unknown>,
  ): Promise<ListResponse<ApplicationErrorListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const severity = toString(filters.where.severity) as
      | ApplicationErrorListItem["severity"]
      | undefined;
    const source = toString(filters.where.source);
    const resolved = toBooleanString(filters.where.resolved);
    const searchCondition = buildTextSearch(filters.search, [
      applicationErrors.safeMessage,
      applicationErrors.source,
      applicationErrors.correlationId,
    ]);

    if (severity) conditions.push(eq(applicationErrors.severity, severity));
    if (source) conditions.push(eq(applicationErrors.source, source));
    if (resolved === true) conditions.push(isNotNull(applicationErrors.resolvedAt));
    if (resolved === false) conditions.push(isNull(applicationErrors.resolvedAt));
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb
      .select({ total: countSql() })
      .from(applicationErrors)
      .$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select({
        correlationId: applicationErrors.correlationId,
        createdAt: applicationErrors.createdAt,
        id: applicationErrors.id,
        resolvedAt: applicationErrors.resolvedAt,
        safeMessage: applicationErrors.safeMessage,
        severity: applicationErrors.severity,
        source: applicationErrors.source,
      })
      .from(applicationErrors)
      .orderBy(desc(applicationErrors.createdAt))
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        correlationId: row.correlationId ?? null,
        createdAt: row.createdAt,
        id: row.id,
        resolvedAt: row.resolvedAt ?? null,
        safeMessage: row.safeMessage,
        severity: row.severity,
        source: row.source,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async recordError(input: ErrorLogRecordInput, actor: ErrorMutationActor) {
    try {
      return await db.transaction(async (tx) => {
        const [error] = await tx
          .insert(applicationErrors)
          .values({
            correlationId: input.correlationId ?? actor.requestContext.correlationId,
            diagnosticDetail: input.diagnosticDetail ?? null,
            safeMessage: input.safeMessage,
            severity: input.severity,
            source: input.source,
            userId: actor.actorUserId,
          })
          .returning();

        if (input.severity !== "info") {
          await tx.insert(notifications).values({
            actionHref: "/error-logs",
            dedupeKey: `application-error:${error.id}:admin`,
            message: input.safeMessage,
            roleTarget: "ADMIN",
            severity: input.severity,
            title: "Application Error",
            type: "APPLICATION_ERROR",
          });
        }

        await tx.insert(auditLogs).values({
          action: AUDIT_ACTIONS.APPLICATION_ERROR_RECORDED,
          actorRole: actor.actorRole,
          actorUserId: actor.actorUserId,
          correlationId: actor.requestContext.correlationId,
          description: "Application error dicatat dengan pesan aman.",
          ipAddress: actor.requestContext.ipAddress,
          metadata: {
            errorId: error.id,
            severity: input.severity,
            source: input.source,
          },
          result: "SUCCESS",
          targetId: error.id,
          targetType: "application_error",
          userAgent: actor.requestContext.userAgent,
        });

        return error;
      });
    } catch (err) {
      console.error("[recordError] Gagal menyimpan application error ke database:", err);
      return null;
    }
  }

  async resolveError(
    id: string,
    input: ErrorLogResolutionInput,
    actor: ErrorMutationActor,
  ) {
    return this.closeError(id, input, actor, false);
  }

  async ignoreError(
    id: string,
    input: ErrorLogResolutionInput,
    actor: ErrorMutationActor,
  ) {
    return this.closeError(id, input, actor, true);
  }

  private async closeError(
    id: string,
    input: ErrorLogResolutionInput,
    actor: ErrorMutationActor,
    ignored: boolean,
  ) {
    const [current] = await readDb
      .select({ id: applicationErrors.id })
      .from(applicationErrors)
      .where(eq(applicationErrors.id, id))
      .limit(1);

    if (!current) {
      throw new NotFoundAppError("Error log tidak ditemukan.");
    }

    const [updated] = await db
      .update(applicationErrors)
      .set({
        resolutionNote: ignored ? `Diabaikan: ${input.note}` : input.note,
        resolvedAt: new Date(),
        resolvedByUserId: actor.actorUserId,
        updatedAt: new Date(),
      })
      .where(eq(applicationErrors.id, id))
      .returning();

    await db.insert(auditLogs).values({
      action: ignored
        ? AUDIT_ACTIONS.APPLICATION_ERROR_IGNORED
        : AUDIT_ACTIONS.APPLICATION_ERROR_RESOLVED,
      actorRole: actor.actorRole,
      actorUserId: actor.actorUserId,
      correlationId: actor.requestContext.correlationId,
      description: ignored
        ? "Application error ditandai diabaikan."
        : "Application error ditandai selesai.",
      ipAddress: actor.requestContext.ipAddress,
      metadata: {
        ignored,
        note: input.note,
      },
      result: "SUCCESS",
      targetId: id,
      targetType: "application_error",
      userAgent: actor.requestContext.userAgent,
    });

    return updated;
  }
}

function countFiltered(status: JobStatus) {
  return sql<number>`count(*) filter (where ${jobRuns.status} = ${status})`;
}

function countErrorSeverity(severity: "critical" | "info" | "warning") {
  return sql<number>`count(*) filter (where ${applicationErrors.severity} = ${severity})`;
}
