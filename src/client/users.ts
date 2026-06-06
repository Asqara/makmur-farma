import "server-only";

import { and, asc, desc, eq, isNull } from "drizzle-orm";

import {
  AUDIT_ACTIONS,
  type UserRole,
  type UserStatus,
} from "@/constants/auth";
import { auditLogs, sessions, users } from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import { ConflictAppError, NotFoundAppError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import type { RequestContext } from "@/lib/request";
import type { UserCreateInput, UserUpdateInput } from "@/zod-schemas";

import {
  buildPagination,
  buildTextSearch,
  combineConditions,
  countSql,
  getListFilters,
  toString,
  type ListResponse,
} from "./list-utils";

const USER_SORT_FIELDS = {
  createdAt: users.createdAt,
  email: users.email,
  name: users.fullName,
  role: users.role,
  status: users.status,
} as const;

type UserMutationActor = {
  actorRole: UserRole;
  actorUserId: string;
  requestContext: RequestContext;
};

export type UserListItem = {
  createdAt: Date;
  email: string;
  emailVerifiedAt: Date | null;
  id: string;
  isActive: boolean;
  name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Admin user-management service.
 */
export class UsersClient {
  async list(searchParams: Record<string, unknown>): Promise<ListResponse<UserListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const role = toString(filters.where.role) as UserRole | undefined;
    const status = toString(filters.where.status) as UserStatus | undefined;
    const searchCondition = buildTextSearch(filters.search, [
      users.fullName,
      users.email,
      users.phone,
    ]);

    if (role) conditions.push(eq(users.role, role));
    if (status) conditions.push(eq(users.status, status));
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in USER_SORT_FIELDS
        ? filters.sortBy
        : "createdAt";
    const orderBy =
      filters.sortDir === "asc"
        ? asc(USER_SORT_FIELDS[sortBy as keyof typeof USER_SORT_FIELDS])
        : desc(USER_SORT_FIELDS[sortBy as keyof typeof USER_SORT_FIELDS]);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb.select({ total: countSql() }).from(users).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;

    let listQuery = readDb
      .select({
        createdAt: users.createdAt,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        id: users.id,
        isActive: users.isActive,
        name: users.fullName,
        phone: users.phone,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);

    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        createdAt: row.createdAt,
        email: row.email,
        emailVerifiedAt: row.emailVerifiedAt ?? null,
        id: row.id,
        isActive: row.isActive,
        name: row.name,
        phone: row.phone ?? null,
        role: row.role,
        status: row.status,
      })),
      pagination: buildPagination(Number(countRow?.total ?? 0), filters.page, filters.limit),
    };
  }

  async create(input: UserCreateInput, actor: UserMutationActor) {
    const normalizedEmail = normalizeEmail(input.email);
    const passwordHash = await hashPassword(input.password);
    const now = new Date();

    const [existing] = await readDb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.normalizedEmail, normalizedEmail))
      .limit(1);

    if (existing) {
      throw new ConflictAppError("Email sudah digunakan.");
    }

    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          email: input.email.trim(),
          emailVerifiedAt: input.markEmailVerified ? now : null,
          fullName: input.fullName.trim(),
          isActive: input.status === "ACTIVE",
          normalizedEmail,
          passwordHash,
          phone: input.phone?.trim() || null,
          role: input.role,
          status: input.status,
        })
        .returning();

      await tx.insert(auditLogs).values({
        action: AUDIT_ACTIONS.USER_CREATED,
        actorRole: actor.actorRole,
        actorUserId: actor.actorUserId,
        correlationId: actor.requestContext.correlationId,
        description: "Admin membuat pengguna baru.",
        ipAddress: actor.requestContext.ipAddress,
        metadata: {
          role: created.role,
          status: created.status,
        },
        result: "SUCCESS",
        targetId: created.id,
        targetType: "user",
        userAgent: actor.requestContext.userAgent,
      });

      return created;
    });
  }

  async update(id: string, input: UserUpdateInput, actor: UserMutationActor) {
    const [current] = await readDb
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!current) {
      throw new NotFoundAppError("Pengguna tidak ditemukan.");
    }

    const nextStatus = input.status ?? current.status;
    const shouldRevokeSessions =
      nextStatus === "DISABLED" || nextStatus === "SUSPENDED";

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({
          fullName: input.fullName?.trim() ?? current.fullName,
          isActive: nextStatus === "ACTIVE",
          phone: input.phone !== undefined ? input.phone?.trim() || null : current.phone,
          role: input.role ?? current.role,
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (shouldRevokeSessions) {
        await tx
          .update(sessions)
          .set({
            revokedAt: new Date(),
            revokedReason: `admin:${nextStatus.toLowerCase()}`,
            updatedAt: new Date(),
          })
          .where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)));
      }

      await tx.insert(auditLogs).values({
        action: AUDIT_ACTIONS.USER_UPDATED,
        actorRole: actor.actorRole,
        actorUserId: actor.actorUserId,
        correlationId: actor.requestContext.correlationId,
        description: "Admin memperbarui data pengguna.",
        ipAddress: actor.requestContext.ipAddress,
        metadata: {
          role: updated.role,
          status: updated.status,
        },
        result: "SUCCESS",
        targetId: updated.id,
        targetType: "user",
        userAgent: actor.requestContext.userAgent,
      });

      return updated;
    });
  }
}
