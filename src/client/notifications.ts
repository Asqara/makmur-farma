import "server-only";

import { and, desc, eq, lte, or, sql, type SQL } from "drizzle-orm";

import { AUDIT_ACTIONS, type UserRole } from "@/constants/auth";
import {
  auditLogs,
  medicineBatches,
  medicines,
  notifications,
  type NotificationRow,
} from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import { NotFoundAppError } from "@/lib/errors";
import type { RequestContext } from "@/lib/request";
import type { NotificationScanAlertsInput } from "@/zod-schemas";

import { getStockLevelStatus } from "./inventory-rules";
import {
  buildPagination,
  combineConditions,
  countSql,
  getListFilters,
  toBooleanString,
  toString,
  type ListResponse,
} from "./list-utils";

export type NotificationListItem = {
  actionHref: string | null;
  createdAt: Date;
  id: string;
  isRead: boolean;
  message: string;
  readAt: Date | null;
  severity: "critical" | "info" | "success" | "warning";
  title: string;
  type: string;
};

export type NotificationAudience = {
  role: UserRole;
  userId: string;
};

type NotificationActor = NotificationAudience & {
  requestContext: RequestContext;
};

type InventoryAlertScanResult = {
  expiryAlertsCreated: number;
  lowStockAlertsCreated: number;
};

const INVENTORY_ALERT_ROLES: readonly UserRole[] = ["ADMIN", "PHARMACIST"];
const MS_PER_DAY = 24 * 60 * 60 * 1_000;

function reminderDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function canReceiveInventoryAlerts(role: UserRole) {
  return INVENTORY_ALERT_ROLES.includes(role);
}

function audienceCondition(audience: NotificationAudience) {
  return or(
    eq(notifications.userId, audience.userId),
    eq(notifications.roleTarget, audience.role),
  );
}

/**
 * In-app notification service backed by PostgreSQL.
 */
export class NotificationsClient {
  async list(
    searchParams: Record<string, unknown>,
    audience: NotificationAudience,
  ): Promise<ListResponse<NotificationListItem>> {
    await this.ensureInventoryReminderAlerts(audience);

    const filters = getListFilters(searchParams);
    const audienceSql = audienceCondition(audience);
    const conditions: SQL<unknown>[] = audienceSql ? [audienceSql] : [];
    const isRead = toBooleanString(filters.where.isRead);
    const type = toString(filters.where.type) as NotificationRow["type"] | undefined;
    const severity = toString(filters.where.severity) as
      | NotificationListItem["severity"]
      | undefined;

    if (typeof isRead === "boolean") {
      conditions.push(eq(notifications.isRead, isRead));
    }
    if (type) conditions.push(eq(notifications.type, type));
    if (severity) conditions.push(eq(notifications.severity, severity));

    const whereClause = combineConditions(conditions);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb.select({ total: countSql() }).from(notifications).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select({
        actionHref: notifications.actionHref,
        createdAt: notifications.createdAt,
        id: notifications.id,
        isRead: notifications.isRead,
        message: notifications.message,
        readAt: notifications.readAt,
        severity: notifications.severity,
        title: notifications.title,
        type: notifications.type,
      })
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        actionHref: row.actionHref ?? null,
        createdAt: row.createdAt,
        id: row.id,
        isRead: row.isRead,
        message: row.message,
        readAt: row.readAt ?? null,
        severity: row.severity,
        title: row.title,
        type: row.type,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async getUnreadCount(audience: NotificationAudience): Promise<number> {
    await this.ensureInventoryReminderAlerts(audience);

    const [row] = await readDb
      .select({ total: countSql() })
      .from(notifications)
      .where(and(audienceCondition(audience), eq(notifications.isRead, false)));

    return Number(row?.total ?? 0);
  }

  async markRead(id: string, audience: NotificationAudience) {
    const [notification] = await readDb
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), audienceCondition(audience)))
      .limit(1);

    if (!notification) {
      throw new NotFoundAppError("Notifikasi tidak ditemukan.");
    }

    if (notification.isRead) {
      return { status: "already_read" as const };
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, id));

    return { status: "read" as const };
  }

  async markAllRead(audience: NotificationAudience, actor: NotificationActor) {
    const updated = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(audienceCondition(audience), eq(notifications.isRead, false)))
      .returning({ id: notifications.id });

    if (updated.length > 0) {
      await db.insert(auditLogs).values({
        action: AUDIT_ACTIONS.NOTIFICATION_READ_ALL,
        actorRole: actor.role,
        actorUserId: actor.userId,
        correlationId: actor.requestContext.correlationId,
        description: "Semua notifikasi yang terlihat untuk user ditandai dibaca.",
        ipAddress: actor.requestContext.ipAddress,
        metadata: {
          count: updated.length,
        },
        result: "SUCCESS",
        targetId: actor.userId,
        targetType: "notification",
        userAgent: actor.requestContext.userAgent,
      });
    }

    return { count: updated.length, status: "read_all" as const };
  }

  async scanInventoryAlerts(
    input: NotificationScanAlertsInput,
    actor: NotificationActor,
  ): Promise<InventoryAlertScanResult> {
    const now = new Date();
    let lowStockAlertsCreated = 0;
    let expiryAlertsCreated = 0;

    if (input.includeLowStock) {
      lowStockAlertsCreated = await this.createLowStockAlerts(now);
    }

    if (input.includeExpiry) {
      expiryAlertsCreated = await this.createExpiryAlerts(now, input.expiryWindows);
    }

    if (lowStockAlertsCreated > 0 || expiryAlertsCreated > 0) {
      await db.insert(auditLogs).values({
        action: AUDIT_ACTIONS.LOW_STOCK_ALERT_CREATED,
        actorRole: actor.role,
        actorUserId: actor.userId,
        correlationId: actor.requestContext.correlationId,
        description: "Scanner alert stok dan kedaluwarsa dijalankan.",
        ipAddress: actor.requestContext.ipAddress,
        metadata: {
          expiryAlertsCreated,
          lowStockAlertsCreated,
        },
        result: "SUCCESS",
        targetId: actor.userId,
        targetType: "notification",
        userAgent: actor.requestContext.userAgent,
      });
    }

    return {
      expiryAlertsCreated,
      lowStockAlertsCreated,
    };
  }

  private async createLowStockAlerts(now: Date) {
    const dateKey = reminderDateKey(now);
    const rows = await readDb
      .select({
        availableQuantity: sql<number>`coalesce((
          select sum(mb.available_quantity)
          from medicine_batches mb
          where mb.medicine_id = ${medicines.id}
        ), 0)`,
        criticalStockThreshold: medicines.criticalStockThreshold,
        id: medicines.id,
        lowStockThreshold: medicines.lowStockThreshold,
        name: medicines.name,
        unit: medicines.unit,
      })
      .from(medicines)
      .where(eq(medicines.status, "ACTIVE"));

    let created = 0;

    for (const row of rows) {
      const availableQuantity = Number(row.availableQuantity ?? 0);
      const level = getStockLevelStatus({
        availableQuantity,
        criticalThreshold: row.criticalStockThreshold,
        lowThreshold: row.lowStockThreshold,
      });

      if (level === "available") continue;

      const severity = level === "low" ? "warning" : "critical";
      const title = level === "low" ? "Stok Rendah" : "Stok Kritis";

      for (const role of INVENTORY_ALERT_ROLES) {
        const inserted = await db
          .insert(notifications)
          .values({
            actionHref: `/medicines`,
            dedupeKey: `low-stock:${row.id}:${role}:${dateKey}`,
            message: `${row.name} tersisa ${availableQuantity} ${row.unit}.`,
            roleTarget: role,
            severity,
            title,
            type: "LOW_STOCK",
            updatedAt: now,
          })
          .onConflictDoNothing({ target: notifications.dedupeKey })
          .returning({ id: notifications.id });

        created += inserted.length;
      }
    }

    return created;
  }

  private async createExpiryAlerts(now: Date, windows: Array<"30" | "60" | "90">) {
    const dateKey = reminderDateKey(now);
    const maxWindow = Math.max(...windows.map((window) => Number(window)));
    const maxDate = new Date(now.getTime() + maxWindow * MS_PER_DAY);
    const sortedWindows = windows
      .map((window) => Number(window))
      .sort((left, right) => left - right);
    const rows = await readDb
      .select({
        batchNumber: medicineBatches.batchNumber,
        expiryDate: medicineBatches.expiryDate,
        id: medicineBatches.id,
        medicineName: medicines.name,
      })
      .from(medicineBatches)
      .innerJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
      .where(
        and(
          eq(medicineBatches.status, "AVAILABLE"),
          lte(medicineBatches.expiryDate, maxDate),
        ),
      );

    let created = 0;

    for (const row of rows) {
      const daysUntilExpiry = Math.ceil(
        (row.expiryDate.getTime() - now.getTime()) / MS_PER_DAY,
      );

      if (daysUntilExpiry <= 0) continue;

      const window = sortedWindows.find((candidate) => daysUntilExpiry <= candidate);
      if (!window) continue;

      const severity = window <= 30 ? "critical" : "warning";

      for (const role of INVENTORY_ALERT_ROLES) {
        const inserted = await db
          .insert(notifications)
          .values({
            actionHref: `/batches`,
            dedupeKey: `expiry:${row.id}:${window}:${role}:${dateKey}`,
            message: `Batch ${row.batchNumber} untuk ${row.medicineName} kedaluwarsa dalam ${daysUntilExpiry} hari.`,
            roleTarget: role,
            severity,
            title: `Batch Kedaluwarsa <= ${window} Hari`,
            type: "EXPIRING_MEDICINE",
            updatedAt: now,
          })
          .onConflictDoNothing({ target: notifications.dedupeKey })
          .returning({ id: notifications.id });

        created += inserted.length;
      }
    }

    return created;
  }

  private async ensureInventoryReminderAlerts(audience: NotificationAudience) {
    if (!canReceiveInventoryAlerts(audience.role)) return;

    const now = new Date();
    await this.createLowStockAlerts(now);
    await this.createExpiryAlerts(now, ["30", "60", "90"]);
  }
}
