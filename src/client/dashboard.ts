import "server-only";

import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import type { OrderStatus } from "@/constants/domain";
import {
  applicationErrors,
  jobRuns,
  medicineBatches,
  medicines,
  orders,
  payments,
  prescriptions,
} from "@/drizzle-schema";
import { ENV } from "@/constants/config";
import { readDb } from "@/lib/db";

import { toString } from "./list-utils";

const REVENUE_ORDER_STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "COMPLETED",
];

export type DashboardMetric = {
  helperText?: string;
  key: string;
  tone: "danger" | "info" | "neutral" | "primary" | "success" | "warning";
  title: string;
  value: number | string;
};

export type DashboardTrendPoint = {
  date: string;
  orderCount: number;
  revenue: string;
};

export type DashboardOverview = {
  dateRange: {
    from: string;
    to: string;
  };
  metrics: DashboardMetric[];
  orderStatus: Array<{
    count: number;
    status: OrderStatus;
  }>;
  recent: {
    failedPayments: Array<{
      amount: string;
      createdAt: Date;
      id: string;
      orderId: string;
      orderNumber: string;
    }>;
    recentOrders: Array<{
      channel: string;
      createdAt: Date;
      grandTotal: string;
      id: string;
      orderNumber: string;
      status: OrderStatus;
    }>;
    systemErrors: Array<{
      createdAt: Date;
      id: string;
      safeMessage: string;
      severity: string;
      source: string;
    }>;
  };
  salesTrend: DashboardTrendPoint[];
};

function toDateRange(searchParams: Record<string, unknown>) {
  const now = new Date();
  const fallbackFrom = new Date(now);
  fallbackFrom.setDate(now.getDate() - 29);

  const fromText = toString(searchParams.from) ?? toString(searchParams.dateFrom);
  const toText = toString(searchParams.to) ?? toString(searchParams.dateTo);
  const from = fromText ? new Date(fromText) : fallbackFrom;
  const to = toText ? new Date(toText) : now;

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function withinCreatedAt(from: Date, to: Date) {
  return and(gte(orders.createdAt, from), lte(orders.createdAt, to));
}

/**
 * Dashboard query service with server-side date range filtering.
 */
export class DashboardClient {
  async getOverview(
    searchParams: Record<string, unknown>,
  ): Promise<DashboardOverview> {
    const range = toDateRange(searchParams);
    const createdAtRange = withinCreatedAt(range.from, range.to);

    const [
      revenueRow,
      orderCountRow,
      onlineOrderRow,
      counterOrderRow,
      prescriptionPendingRow,
      processingRow,
      failedPaymentRow,
      failedJobRow,
      criticalStockRows,
      expiryRows,
      orderStatusRows,
      trendRows,
      recentOrders,
      failedPayments,
      systemErrors,
    ] = await Promise.all([
      readDb
        .select({
          total: sql<string>`coalesce(sum(${orders.grandTotal}), 0)`,
        })
        .from(orders)
        .where(
          and(
            createdAtRange,
            inArray(orders.status, REVENUE_ORDER_STATUSES),
          ),
        ),
      readDb
        .select({ total: sql<number>`count(*)` })
        .from(orders)
        .where(createdAtRange),
      readDb
        .select({ total: sql<number>`count(*)` })
        .from(orders)
        .where(and(createdAtRange, eq(orders.channel, "ONLINE"))),
      readDb
        .select({ total: sql<number>`count(*)` })
        .from(orders)
        .where(and(createdAtRange, eq(orders.channel, "COUNTER"))),
      readDb
        .select({ total: sql<number>`count(*)` })
        .from(prescriptions)
        .where(inArray(prescriptions.status, ["PENDING", "IN_REVIEW"])),
      readDb
        .select({ total: sql<number>`count(*)` })
        .from(orders)
        .where(
          and(
            createdAtRange,
            inArray(orders.status, ["PAID", "PROCESSING", "READY_FOR_PICKUP"]),
          ),
        ),
      readDb
        .select({ total: sql<number>`count(*)` })
        .from(payments)
        .where(eq(payments.status, "FAILED")),
      readDb
        .select({ total: sql<number>`count(*)` })
        .from(jobRuns)
        .where(eq(jobRuns.status, "FAILED")),
      readDb
        .select({
          critical: sql<number>`count(*) filter (
            where coalesce(stock.available_quantity, 0) <= ${medicines.criticalStockThreshold}
              and coalesce(stock.available_quantity, 0) > 0
          )`,
          low: sql<number>`count(*) filter (
            where coalesce(stock.available_quantity, 0) <= ${medicines.lowStockThreshold}
              and coalesce(stock.available_quantity, 0) > ${medicines.criticalStockThreshold}
          )`,
          out: sql<number>`count(*) filter (
            where coalesce(stock.available_quantity, 0) <= 0
          )`,
        })
        .from(medicines)
        .leftJoin(
          sql`(
            select medicine_id, sum(available_quantity) as available_quantity
            from medicine_batches
            group by medicine_id
          ) stock`,
          sql`stock.medicine_id = ${medicines.id}`,
        ),
      readDb
        .select({
          expiry30: sql<number>`count(*) filter (
            where ${medicineBatches.expiryDate} <= current_date + interval '30 days'
              and ${medicineBatches.expiryDate} >= current_date
          )`,
          expiry60: sql<number>`count(*) filter (
            where ${medicineBatches.expiryDate} <= current_date + interval '60 days'
              and ${medicineBatches.expiryDate} >= current_date
          )`,
          expiry90: sql<number>`count(*) filter (
            where ${medicineBatches.expiryDate} <= current_date + interval '90 days'
              and ${medicineBatches.expiryDate} >= current_date
          )`,
        })
        .from(medicineBatches),
      readDb
        .select({
          count: sql<number>`count(*)`,
          status: orders.status,
        })
        .from(orders)
        .where(createdAtRange)
        .groupBy(orders.status),
      readDb
        .select({
          date: sql<string>`to_char(${orders.createdAt} at time zone ${ENV.appTimezone}, 'YYYY-MM-DD')`,
          orderCount: sql<number>`count(*)`,
          revenue: sql<string>`coalesce(sum(case when ${orders.status} in ('PAID','PROCESSING','READY_FOR_PICKUP','SHIPPED','COMPLETED') then ${orders.grandTotal} else 0 end), 0)`,
        })
        .from(orders)
        .where(createdAtRange)
        .groupBy(sql`1`)
        .orderBy(sql`1`),
      readDb
        .select({
          channel: orders.channel,
          createdAt: orders.createdAt,
          grandTotal: orders.grandTotal,
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(5),
      readDb
        .select({
          amount: payments.amount,
          createdAt: payments.createdAt,
          id: payments.id,
          orderId: orders.id,
          orderNumber: orders.orderNumber,
        })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .where(eq(payments.status, "FAILED"))
        .orderBy(desc(payments.createdAt))
        .limit(5),
      readDb
        .select({
          createdAt: applicationErrors.createdAt,
          id: applicationErrors.id,
          safeMessage: applicationErrors.safeMessage,
          severity: applicationErrors.severity,
          source: applicationErrors.source,
        })
        .from(applicationErrors)
        .orderBy(desc(applicationErrors.createdAt))
        .limit(5),
    ]);

    const revenue = revenueRow[0]?.total ?? "0";
    const stockRisk = criticalStockRows[0];
    const expiry = expiryRows[0];

    return {
      dateRange: {
        from: isoDate(range.from),
        to: isoDate(range.to),
      },
      metrics: [
        {
          key: "revenue",
          tone: "success",
          title: "Pendapatan",
          value: revenue,
        },
        {
          key: "orders",
          tone: "primary",
          title: "Jumlah Pesanan",
          value: Number(orderCountRow[0]?.total ?? 0),
        },
        {
          key: "counter-orders",
          tone: "info",
          title: "Transaksi Kasir",
          value: Number(counterOrderRow[0]?.total ?? 0),
        },
        {
          key: "online-orders",
          tone: "info",
          title: "Order Online",
          value: Number(onlineOrderRow[0]?.total ?? 0),
        },
        {
          key: "prescriptions",
          tone: "warning",
          title: "Resep Perlu Ditinjau",
          value: Number(prescriptionPendingRow[0]?.total ?? 0),
        },
        {
          key: "processing",
          tone: "primary",
          title: "Perlu Diproses",
          value: Number(processingRow[0]?.total ?? 0),
        },
        {
          key: "low-stock",
          tone: "warning",
          title: "Stok Rendah",
          value: Number(stockRisk?.low ?? 0),
        },
        {
          key: "critical-stock",
          tone: "danger",
          title: "Stok Kritis",
          value: Number(stockRisk?.critical ?? 0),
        },
        {
          key: "expiry-30",
          tone: "warning",
          title: "Batch 30 Hari",
          value: Number(expiry?.expiry30 ?? 0),
        },
        {
          key: "failed-payments",
          tone: "danger",
          title: "Payment Gagal",
          value: Number(failedPaymentRow[0]?.total ?? 0),
        },
        {
          key: "failed-jobs",
          tone: "danger",
          title: "Job Gagal",
          value: Number(failedJobRow[0]?.total ?? 0),
        },
        {
          key: "out-stock",
          tone: "danger",
          title: "Stok Habis",
          value: Number(stockRisk?.out ?? 0),
        },
      ],
      orderStatus: orderStatusRows.map((row) => ({
        count: Number(row.count ?? 0),
        status: row.status,
      })),
      recent: {
        failedPayments,
        recentOrders,
        systemErrors,
      },
      salesTrend: trendRows.map((row) => ({
        date: row.date,
        orderCount: Number(row.orderCount ?? 0),
        revenue: row.revenue ?? "0",
      })),
    };
  }
}
