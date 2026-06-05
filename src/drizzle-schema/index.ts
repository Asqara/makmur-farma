import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  inet,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  AUDIT_RESULT_VALUES,
  USER_ROLE_VALUES,
  USER_STATUS_VALUES,
} from "@/constants/auth";

const timestampz = (name: string) =>
  timestamp(name, { mode: "date", withTimezone: true });

export const userRoleEnum = pgEnum("user_role", USER_ROLE_VALUES);
export const userStatusEnum = pgEnum("user_status", USER_STATUS_VALUES);
export const auditResultEnum = pgEnum("audit_result", AUDIT_RESULT_VALUES);
export const notificationSeverityEnum = pgEnum("notification_severity", [
  "critical",
  "warning",
  "info",
  "success",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "LOW_STOCK",
  "EXPIRING_MEDICINE",
  "NEW_ORDER",
  "PRESCRIPTION_REVIEW",
  "PRESCRIPTION_APPROVED",
  "PRESCRIPTION_REJECTED",
  "PAYMENT_STATUS",
  "ORDER_PROCESSING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "COMPLETED",
  "APPLICATION_ERROR",
  "SYSTEM_ERROR",
  "RESPONSE_TIME_ALERT",
  "UPTIME_ALERT",
  "IMPORT_COMPLETED",
  "IMPORT_FAILED",
  "REPORT_COMPLETED",
  "REPORT_FAILED",
  "JOB_FAILED",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("name").notNull(),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("CUSTOMER").notNull(),
    status: userStatusEnum("status").default("PENDING_VERIFICATION").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    emailVerifiedAt: timestampz("email_verified_at"),
    lastLoginAt: timestampz("last_login_at"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    isActiveIdx: index("users_is_active_idx").on(table.isActive),
    normalizedEmailIdx: uniqueIndex("users_normalized_email_idx").on(
      table.normalizedEmail,
    ),
    roleIdx: index("users_role_idx").on(table.role),
    statusIdx: index("users_status_idx").on(table.status),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("session_token_hash").notNull(),
    csrfTokenHash: text("csrf_token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: inet("ip_address"),
    lastActivityAt: timestampz("last_activity_at").defaultNow().notNull(),
    idleExpiresAt: timestampz("idle_expires_at").notNull(),
    absoluteExpiresAt: timestampz("expires_at").notNull(),
    revokedAt: timestampz("revoked_at"),
    revokedReason: text("revoked_reason"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    absoluteExpiresAtIdx: index("sessions_expires_at_idx").on(
      table.absoluteExpiresAt,
    ),
    idleExpiresAtIdx: index("sessions_idle_expires_at_idx").on(
      table.idleExpiresAt,
    ),
    revokedAtIdx: index("sessions_revoked_at_idx").on(table.revokedAt),
    tokenHashIdx: uniqueIndex("sessions_session_token_hash_idx").on(
      table.tokenHash,
    ),
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestampz("expires_at").notNull(),
    usedAt: timestampz("used_at"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    expiresAtIdx: index("email_verification_tokens_expires_at_idx").on(
      table.expiresAt,
    ),
    tokenHashIdx: uniqueIndex("email_verification_tokens_token_hash_idx").on(
      table.tokenHash,
    ),
    userIdIdx: index("email_verification_tokens_user_id_idx").on(table.userId),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorRole: userRoleEnum("actor_role"),
    action: text("action").notNull(),
    targetType: text("entity_type").notNull(),
    targetId: text("entity_id"),
    result: auditResultEnum("result").notNull(),
    description: text("description").notNull(),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    correlationId: text("correlation_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    actionIdx: index("audit_logs_action_idx").on(table.action),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    entityIdx: index("audit_logs_entity_idx").on(
      table.targetType,
      table.targetId,
    ),
    userIdIdx: index("audit_logs_user_id_idx").on(table.actorUserId),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    roleTarget: userRoleEnum("role_target"),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    severity: notificationSeverityEnum("severity").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestampz("read_at"),
    actionHref: text("action_href"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    roleTargetIdx: index("notifications_role_target_idx").on(table.roleTarget),
    severityIdx: index("notifications_severity_idx").on(table.severity),
    typeIdx: index("notifications_type_idx").on(table.type),
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
  }),
);

export type AuditLogRow = typeof auditLogs.$inferSelect;
export type EmailVerificationTokenRow =
  typeof emailVerificationTokens.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type UserRow = typeof users.$inferSelect;
