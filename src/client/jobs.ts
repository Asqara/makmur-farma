import "server-only";

import { asc, desc, eq, sql } from "drizzle-orm";

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

import {
  buildPagination,
  buildTextSearch,
  combineConditions,
  countSql,
  getListFilters,
  toString,
  type ListResponse,
} from "./list-utils";

const JOB_SORT_FIELDS = {
  createdAt: jobRuns.createdAt,
  jobType: jobRuns.jobType,
  queueName: jobRuns.queueName,
  status: jobRuns.status,
} as const;

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
  services: Array<{
    description: string;
    lastChecked: string;
    metric: string;
    serviceName: string;
    status: "degraded" | "down" | "healthy" | "unknown";
  }>;
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
    const [queueRows, errorRows] = await Promise.all([
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

    const failedJobs = queueRows.reduce((sum, row) => sum + Number(row.failed), 0);
    const criticalErrors = Number(errorRows[0]?.critical ?? 0);
    const hasProblems = failedJobs > 0 || criticalErrors > 0;

    return {
      errors: {
        critical: criticalErrors,
        info: Number(errorRows[0]?.info ?? 0),
        warning: Number(errorRows[0]?.warning ?? 0),
      },
      queues: queueRows.map((row) => ({
        active: Number(row.active ?? 0),
        completed: Number(row.completed ?? 0),
        failed: Number(row.failed ?? 0),
        queueName: row.queueName,
        waiting: Number(row.waiting ?? 0),
      })),
      services: [
        {
          description: "API Elysia merespons request internal.",
          lastChecked: new Date().toISOString(),
          metric: "HTTP aktif",
          serviceName: "API",
          status: "healthy",
        },
        {
          description: "PostgreSQL menjadi sumber data operasional.",
          lastChecked: new Date().toISOString(),
          metric: "Query berhasil",
          serviceName: "PostgreSQL",
          status: "healthy",
        },
        {
          description: "Status Redis membutuhkan worker runtime aktif.",
          lastChecked: new Date().toISOString(),
          metric: "Belum diperiksa",
          serviceName: "Redis",
          status: "unknown",
        },
        {
          description: "Dilihat dari job run yang tersimpan di PostgreSQL.",
          lastChecked: new Date().toISOString(),
          metric: `${failedJobs} job gagal`,
          serviceName: "Worker",
          status: hasProblems ? "degraded" : "healthy",
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
    const searchCondition = buildTextSearch(filters.search, [
      applicationErrors.safeMessage,
      applicationErrors.source,
      applicationErrors.correlationId,
    ]);

    if (severity) conditions.push(eq(applicationErrors.severity, severity));
    if (source) conditions.push(eq(applicationErrors.source, source));
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
    return db.transaction(async (tx) => {
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
