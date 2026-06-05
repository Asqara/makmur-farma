import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import {
  AUDIT_RESULT_VALUES,
  type AuditResult,
  type UserRole,
} from "@/constants/auth";
import { auditLogs, users } from "@/drizzle-schema";
import { readDb } from "@/lib/db";
import { getFilters } from "@/utils/getFilters";

const AUDIT_RESULT_SET = new Set(AUDIT_RESULT_VALUES);

const AUDIT_LOG_SORT_FIELDS = {
  action: auditLogs.action,
  createdAt: auditLogs.createdAt,
  result: auditLogs.result,
  targetType: auditLogs.targetType,
} as const;

type AuditLogActor = {
  email: string | null;
  id: string | null;
  name: string | null;
  role: UserRole | null;
};

export type AuditLogListItem = {
  action: string;
  actor: AuditLogActor;
  correlationId: string | null;
  createdAt: Date;
  description: string;
  id: string;
  ipAddress: string | null;
  result: AuditResult;
  targetId: string | null;
  targetType: string;
  userAgent: string | null;
};

export type AuditLogListResponse = {
  data: AuditLogListItem[];
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

function toString(value: unknown) {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function toAuditResult(value: unknown): AuditResult | undefined {
  const result = toString(value);

  if (!result) return undefined;
  if (AUDIT_RESULT_SET.has(result as AuditResult)) {
    return result as AuditResult;
  }

  return undefined;
}

function escapeLike(value: string) {
  return value.replace(/[%_]/g, "\\$&");
}

/**
 * Audit log list and filter service.
 */
export class AuditLogsClient {
  async list(searchParams: Record<string, unknown>): Promise<AuditLogListResponse> {
    const filters = getFilters(searchParams);
    const search = toString(filters.search);
    const resultFilter = toAuditResult(filters.where.result);
    const actionFilter = toString(filters.where.action);
    const targetTypeFilter = toString(filters.where.targetType);

    const conditions = [];

    if (resultFilter) {
      conditions.push(eq(auditLogs.result, resultFilter));
    }

    if (actionFilter) {
      conditions.push(eq(auditLogs.action, actionFilter));
    }

    if (targetTypeFilter) {
      conditions.push(eq(auditLogs.targetType, targetTypeFilter));
    }

    if (search) {
      const likeQuery = `%${escapeLike(search)}%`;

      conditions.push(
        or(
          ilike(auditLogs.description, likeQuery),
          ilike(auditLogs.action, likeQuery),
          ilike(auditLogs.targetType, likeQuery),
          ilike(auditLogs.targetId, likeQuery),
        ),
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const sortBy =
      filters.sortBy && filters.sortBy in AUDIT_LOG_SORT_FIELDS
        ? (filters.sortBy as keyof typeof AUDIT_LOG_SORT_FIELDS)
        : "createdAt";
    const sortColumn = AUDIT_LOG_SORT_FIELDS[sortBy];
    const sortDirection = filters.sortDir === "asc" ? "asc" : "desc";
    const orderBy = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb
      .select({ total: sql<number>`count(*)` })
      .from(auditLogs)
      .$dynamic();

    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }

    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / filters.limit);

    let listQuery = readDb
      .select({
        action: auditLogs.action,
        actorEmail: users.email,
        actorName: users.fullName,
        actorRole: auditLogs.actorRole,
        actorUserId: auditLogs.actorUserId,
        correlationId: auditLogs.correlationId,
        createdAt: auditLogs.createdAt,
        description: auditLogs.description,
        id: auditLogs.id,
        ipAddress: auditLogs.ipAddress,
        result: auditLogs.result,
        targetId: auditLogs.targetId,
        targetType: auditLogs.targetType,
        userAgent: auditLogs.userAgent,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();

    if (whereClause) {
      listQuery = listQuery.where(whereClause);
    }

    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        action: row.action,
        actor: {
          email: row.actorEmail ?? null,
          id: row.actorUserId ?? null,
          name: row.actorName ?? null,
          role: row.actorRole ?? null,
        },
        correlationId: row.correlationId ?? null,
        createdAt: row.createdAt,
        description: row.description,
        id: row.id,
        ipAddress: row.ipAddress ?? null,
        result: row.result,
        targetId: row.targetId ?? null,
        targetType: row.targetType,
        userAgent: row.userAgent ?? null,
      })),
      pagination: {
        limit: filters.limit,
        page: filters.page,
        total,
        totalPages,
      },
    };
  }
}
