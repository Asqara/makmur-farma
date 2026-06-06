import "server-only";

import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { AUDIT_ACTIONS, type UserRole } from "@/constants/auth";
import { canTransitionOrder } from "@/constants/domain";
import type {
  OrderChannel,
  OrderStatus,
  PaymentStatus,
  PrescriptionStatus,
} from "@/constants/domain";
import {
  auditLogs,
  medicines,
  notifications,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  paymentEvents,
  prescriptionReviews,
  prescriptions,
  users,
} from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import { NotFoundAppError, ValidationAppError } from "@/lib/errors";
import type { RequestContext } from "@/lib/request";
import type { PrescriptionReviewInput } from "@/zod-schemas";

import {
  buildPagination,
  buildTextSearch,
  combineConditions,
  countSql,
  getListFilters,
  toString,
  type ListResponse,
} from "./list-utils";
import { InventoryWorkflowClient } from "./inventory";
import { assertOrderTransition, calculateOrderTotals } from "./order-rules";

const inventoryWorkflow = new InventoryWorkflowClient();

const ORDER_SORT_FIELDS = {
  createdAt: orders.createdAt,
  grandTotal: orders.grandTotal,
  orderNumber: orders.orderNumber,
  status: orders.status,
} as const;

const PAYMENT_SORT_FIELDS = {
  amount: payments.amount,
  createdAt: payments.createdAt,
  status: payments.status,
} as const;

const PRESCRIPTION_SORT_FIELDS = {
  createdAt: prescriptions.createdAt,
  submittedAt: prescriptions.submittedAt,
  status: prescriptions.status,
} as const;

export type OrderListItem = {
  channel: OrderChannel;
  createdAt: Date;
  customer: {
    email: string | null;
    id: string | null;
    name: string | null;
  };
  grandTotal: string;
  id: string;
  itemCount: number;
  orderNumber: string;
  prescriptionRequired: boolean;
  status: OrderStatus;
};

export type PaymentListItem = {
  amount: string;
  createdAt: Date;
  id: string;
  method: string;
  order: {
    id: string;
    orderNumber: string;
  };
  provider: string;
  providerReference: string | null;
  status: PaymentStatus;
};

export type PrescriptionListItem = {
  createdAt: Date;
  customer: {
    email: string | null;
    id: string;
    name: string | null;
  };
  id: string;
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
  };
  latestNote: string | null;
  originalFileName: string;
  status: PrescriptionStatus;
  submittedAt: Date;
};

export type TransitionOrderInput = {
  actorRole: UserRole;
  actorUserId: string;
  nextStatus: OrderStatus;
  note?: string;
  orderId: string;
  requestContext: RequestContext;
};

export type ReviewPrescriptionServiceInput = {
  actorRole: UserRole;
  actorUserId: string;
  input: PrescriptionReviewInput;
  prescriptionId: string;
  requestContext: RequestContext;
};

export type OrderDetail = OrderListItem & {
  items: Array<{
    id: string;
    medicine: {
      code: string;
      id: string;
      name: string;
    };
    prescriptionRequired: boolean;
    quantity: number;
    subtotal: string;
    unitPrice: string;
  }>;
  payments: PaymentListItem[];
  prescriptions: PrescriptionListItem[];
  statusHistory: Array<{
    actorName: string | null;
    createdAt: Date;
    fromStatus: OrderStatus | null;
    id: string;
    note: string | null;
    toStatus: OrderStatus;
  }>;
};

/**
 * Order, prescription, and payment workflow service.
 */
export class OrdersClient {
  async listOrders(
    searchParams: Record<string, unknown>,
  ): Promise<ListResponse<OrderListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const id = toString(filters.where.id);
    const status = toString(filters.where.status) as OrderStatus | undefined;
    const channel = toString(filters.where.channel) as OrderChannel | undefined;
    const customerUserId = toString(filters.where.customerUserId);
    const dateFrom = toString(filters.where.dateFrom);
    const dateTo = toString(filters.where.dateTo);
    const searchCondition = buildTextSearch(filters.search, [
      orders.orderNumber,
      users.fullName,
      users.email,
    ]);

    if (id) conditions.push(eq(orders.id, id));
    if (status) conditions.push(eq(orders.status, status));
    if (channel) conditions.push(eq(orders.channel, channel));
    if (customerUserId) conditions.push(eq(orders.customerUserId, customerUserId));
    if (dateFrom) conditions.push(gte(orders.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(orders.createdAt, new Date(dateTo)));
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in ORDER_SORT_FIELDS
        ? filters.sortBy
        : "createdAt";
    const sortColumn =
      ORDER_SORT_FIELDS[sortBy as keyof typeof ORDER_SORT_FIELDS];
    const orderBy = filters.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb
      .select({ total: countSql() })
      .from(orders)
      .leftJoin(users, eq(orders.customerUserId, users.id))
      .$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select({
        channel: orders.channel,
        createdAt: orders.createdAt,
        customerEmail: users.email,
        customerId: users.id,
        customerName: users.fullName,
        grandTotal: orders.grandTotal,
        id: orders.id,
        itemCount: sql<number>`coalesce((
          select count(*)
          from order_items oi
          where oi.order_id = ${orders.id}
        ), 0)`,
        orderNumber: orders.orderNumber,
        prescriptionRequired: orders.prescriptionRequired,
        status: orders.status,
      })
      .from(orders)
      .leftJoin(users, eq(orders.customerUserId, users.id))
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        channel: row.channel,
        createdAt: row.createdAt,
        customer: {
          email: row.customerEmail ?? null,
          id: row.customerId ?? null,
          name: row.customerName ?? null,
        },
        grandTotal: row.grandTotal,
        id: row.id,
        itemCount: Number(row.itemCount ?? 0),
        orderNumber: row.orderNumber,
        prescriptionRequired: row.prescriptionRequired,
        status: row.status,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async getOrderDetail(id: string): Promise<OrderDetail> {
    const orderResult = await this.listOrders({ id, limit: "1", page: "1" });
    const order = orderResult.data.find((item) => item.id === id);

    if (!order) {
      throw new NotFoundAppError("Pesanan tidak ditemukan.");
    }

    const [items, paymentResult, prescriptionResult, history] = await Promise.all([
      readDb
        .select({
          id: orderItems.id,
          medicineCode: medicines.code,
          medicineId: medicines.id,
          medicineName: medicines.name,
          prescriptionRequired: orderItems.prescriptionRequired,
          quantity: orderItems.quantity,
          subtotal: orderItems.subtotal,
          unitPrice: orderItems.unitPrice,
        })
        .from(orderItems)
        .innerJoin(medicines, eq(orderItems.medicineId, medicines.id))
        .where(eq(orderItems.orderId, id)),
      this.listPayments({ orderId: id, limit: "50", page: "1" }),
      this.listPrescriptions({ orderId: id, limit: "50", page: "1" }),
      readDb
        .select({
          actorName: users.fullName,
          createdAt: orderStatusHistory.createdAt,
          fromStatus: orderStatusHistory.fromStatus,
          id: orderStatusHistory.id,
          note: orderStatusHistory.note,
          toStatus: orderStatusHistory.toStatus,
        })
        .from(orderStatusHistory)
        .leftJoin(users, eq(orderStatusHistory.actorUserId, users.id))
        .where(eq(orderStatusHistory.orderId, id))
        .orderBy(asc(orderStatusHistory.createdAt)),
    ]);

    return {
      ...order,
      items: items.map((item) => ({
        id: item.id,
        medicine: {
          code: item.medicineCode,
          id: item.medicineId,
          name: item.medicineName,
        },
        prescriptionRequired: item.prescriptionRequired,
        quantity: item.quantity,
        subtotal: item.subtotal,
        unitPrice: item.unitPrice,
      })),
      payments: paymentResult.data,
      prescriptions: prescriptionResult.data,
      statusHistory: history.map((item) => ({
        actorName: item.actorName ?? null,
        createdAt: item.createdAt,
        fromStatus: item.fromStatus ?? null,
        id: item.id,
        note: item.note ?? null,
        toStatus: item.toStatus,
      })),
    };
  }

  async listPayments(
    searchParams: Record<string, unknown>,
  ): Promise<ListResponse<PaymentListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const orderId = toString(filters.where.orderId);
    const customerUserId = toString(filters.where.customerUserId);
    const status = toString(filters.where.status) as PaymentStatus | undefined;
    const searchCondition = buildTextSearch(filters.search, [
      orders.orderNumber,
      payments.provider,
      payments.providerReference,
    ]);

    if (orderId) conditions.push(eq(payments.orderId, orderId));
    if (customerUserId) conditions.push(eq(orders.customerUserId, customerUserId));
    if (status) conditions.push(eq(payments.status, status));
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in PAYMENT_SORT_FIELDS
        ? filters.sortBy
        : "createdAt";
    const sortColumn =
      PAYMENT_SORT_FIELDS[sortBy as keyof typeof PAYMENT_SORT_FIELDS];
    const orderBy = filters.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb
      .select({ total: countSql() })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select({
        amount: payments.amount,
        createdAt: payments.createdAt,
        id: payments.id,
        method: payments.method,
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        provider: payments.provider,
        providerReference: payments.providerReference,
        status: payments.status,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        amount: row.amount,
        createdAt: row.createdAt,
        id: row.id,
        method: row.method,
        order: {
          id: row.orderId,
          orderNumber: row.orderNumber,
        },
        provider: row.provider,
        providerReference: row.providerReference ?? null,
        status: row.status,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async listPrescriptions(
    searchParams: Record<string, unknown>,
  ): Promise<ListResponse<PrescriptionListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const orderId = toString(filters.where.orderId);
    const customerUserId = toString(filters.where.customerUserId);
    const id = toString(filters.where.id);
    const status = toString(filters.where.status) as
      | PrescriptionStatus
      | undefined;
    const searchCondition = buildTextSearch(filters.search, [
      prescriptions.originalFileName,
      orders.orderNumber,
      users.fullName,
      users.email,
    ]);

    if (id) conditions.push(eq(prescriptions.id, id));
    if (orderId) conditions.push(eq(prescriptions.orderId, orderId));
    if (customerUserId) {
      conditions.push(eq(prescriptions.customerUserId, customerUserId));
    }
    if (status) conditions.push(eq(prescriptions.status, status));
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in PRESCRIPTION_SORT_FIELDS
        ? filters.sortBy
        : "submittedAt";
    const sortColumn =
      PRESCRIPTION_SORT_FIELDS[
        sortBy as keyof typeof PRESCRIPTION_SORT_FIELDS
      ];
    const orderBy = filters.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb
      .select({ total: countSql() })
      .from(prescriptions)
      .innerJoin(orders, eq(prescriptions.orderId, orders.id))
      .innerJoin(users, eq(prescriptions.customerUserId, users.id))
      .$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select({
        createdAt: prescriptions.createdAt,
        customerEmail: users.email,
        customerId: users.id,
        customerName: users.fullName,
        id: prescriptions.id,
        latestNote: sql<string | null>`(
          select pr.notes
          from prescription_reviews pr
          where pr.prescription_id = ${prescriptions.id}
          order by pr.reviewed_at desc
          limit 1
        )`,
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        orderStatus: orders.status,
        originalFileName: prescriptions.originalFileName,
        status: prescriptions.status,
        submittedAt: prescriptions.submittedAt,
      })
      .from(prescriptions)
      .innerJoin(orders, eq(prescriptions.orderId, orders.id))
      .innerJoin(users, eq(prescriptions.customerUserId, users.id))
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        createdAt: row.createdAt,
        customer: {
          email: row.customerEmail ?? null,
          id: row.customerId,
          name: row.customerName ?? null,
        },
        id: row.id,
        latestNote: row.latestNote ?? null,
        order: {
          id: row.orderId,
          orderNumber: row.orderNumber,
          status: row.orderStatus,
        },
        originalFileName: row.originalFileName,
        status: row.status,
        submittedAt: row.submittedAt,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async reviewPrescription(input: ReviewPrescriptionServiceInput) {
    const now = new Date();
    const finalStatuses = new Set<PrescriptionStatus>([
      "APPROVED",
      "REJECTED",
      "NEEDS_REVISION",
    ]);
    const notes =
      input.input.notes.trim() ||
      (input.input.decision === "APPROVED"
        ? "Resep disetujui oleh apoteker."
        : "Keputusan resep dicatat oleh apoteker.");

    return db.transaction(async (tx) => {
      const [prescription] = await tx
        .select({
          customerUserId: prescriptions.customerUserId,
          id: prescriptions.id,
          orderId: prescriptions.orderId,
          status: prescriptions.status,
        })
        .from(prescriptions)
        .where(eq(prescriptions.id, input.prescriptionId))
        .limit(1);

      if (!prescription) {
        throw new NotFoundAppError("Resep tidak ditemukan.");
      }

      if (finalStatuses.has(prescription.status)) {
        throw new ValidationAppError("Keputusan resep sudah final.");
      }

      const [order] = await tx
        .select({
          channel: orders.channel,
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
        })
        .from(orders)
        .where(eq(orders.id, prescription.orderId))
        .limit(1);

      if (!order) {
        throw new NotFoundAppError("Pesanan resep tidak ditemukan.");
      }

      await tx.insert(prescriptionReviews).values({
        approvedItems: input.input.approvedItems,
        decision: input.input.decision,
        notes,
        pharmacistUserId: input.actorUserId,
        prescriptionId: prescription.id,
      });

      const [updatedPrescription] = await tx
        .update(prescriptions)
        .set({
          status: input.input.decision,
          updatedAt: now,
        })
        .where(eq(prescriptions.id, prescription.id))
        .returning();

      const nextOrderStatus =
        input.input.decision === "APPROVED"
          ? "AWAITING_PAYMENT"
          : input.input.decision === "REJECTED"
            ? "PRESCRIPTION_REJECTED"
            : null;

      if (nextOrderStatus && !canTransitionOrder(order.status, nextOrderStatus)) {
        throw new ValidationAppError(
          "Status pesanan tidak sesuai untuk keputusan resep ini.",
        );
      }

      if (nextOrderStatus) {
        if (nextOrderStatus === "AWAITING_PAYMENT") {
          await inventoryWorkflow.reserveOrderStockTx(tx, order.id, {
            actorUserId: input.actorUserId,
          });

          // Extend or reactivate the payment so the customer can pay.
          // The payment was created at checkout with a 24h window; prescription
          // review can take longer, leaving the payment expired by the time the
          // order reaches AWAITING_PAYMENT.
          const newExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          await tx
            .update(payments)
            .set({ expiresAt: newExpiresAt, status: "PENDING", updatedAt: now })
            .where(
              and(
                eq(payments.orderId, order.id),
                inArray(payments.status, ["PENDING", "EXPIRED"]),
              ),
            );
        }

        await tx
          .update(orders)
          .set({
            status: nextOrderStatus,
            updatedAt: now,
          })
          .where(eq(orders.id, order.id));

        await tx.insert(orderStatusHistory).values({
          actorUserId: input.actorUserId,
          fromStatus: order.status,
          metadata: {
            prescriptionDecision: input.input.decision,
          },
          note: notes,
          orderId: order.id,
          toStatus: nextOrderStatus,
        });
      }

      const notificationType =
        input.input.decision === "APPROVED"
          ? "PRESCRIPTION_APPROVED"
          : "PRESCRIPTION_REJECTED";
      const notificationTitle =
        input.input.decision === "APPROVED"
          ? "Resep Disetujui"
          : input.input.decision === "REJECTED"
            ? "Resep Ditolak"
            : "Resep Perlu Perbaikan";

      await tx.insert(notifications).values({
        actionHref: `/orders/${order.id}`,
        dedupeKey: `prescription:${prescription.id}:decision:${input.input.decision}`,
        message: `Hasil verifikasi resep untuk pesanan ${order.orderNumber} sudah tersedia.`,
        severity: input.input.decision === "APPROVED" ? "success" : "warning",
        title: notificationTitle,
        type: notificationType,
        userId: prescription.customerUserId,
      });

      await tx.insert(auditLogs).values({
        action: AUDIT_ACTIONS.PRESCRIPTION_REVIEWED,
        actorRole: input.actorRole,
        actorUserId: input.actorUserId,
        correlationId: input.requestContext.correlationId,
        description: "Resep diverifikasi dan keputusan dicatat terpisah dari file asli.",
        ipAddress: input.requestContext.ipAddress,
        metadata: {
          approvedItemCount: input.input.approvedItems.length,
          decision: input.input.decision,
          orderNumber: order.orderNumber,
        },
        result: "SUCCESS",
        targetId: prescription.id,
        targetType: "prescription",
        userAgent: input.requestContext.userAgent,
      });

      return updatedPrescription;
    });
  }

  async transitionOrder(input: TransitionOrderInput) {
    const now = new Date();

    return db.transaction(async (tx) => {
      const [currentOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!currentOrder) {
        throw new NotFoundAppError("Pesanan tidak ditemukan.");
      }

      // Counter orders skip electronic prescription review — the cashier
      // verifies in person. Only online orders require an approved prescription
      // record before fulfilment can begin.
      if (
        currentOrder.channel !== "COUNTER" &&
        currentOrder.prescriptionRequired &&
        ["PROCESSING", "READY_FOR_PICKUP", "SHIPPED", "COMPLETED"].includes(
          input.nextStatus,
        )
      ) {
        const [approvedPrescription] = await tx
          .select({ id: prescriptions.id })
          .from(prescriptions)
          .where(
            and(
              eq(prescriptions.orderId, currentOrder.id),
              eq(prescriptions.status, "APPROVED"),
            ),
          )
          .limit(1);

        if (!approvedPrescription) {
          throw new ValidationAppError(
            "Pesanan obat resep belum dapat diproses atau diambil sebelum resep disetujui.",
          );
        }
      }

      assertOrderTransition(currentOrder.status, input.nextStatus);

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: input.nextStatus,
          updatedAt: now,
        })
        .where(eq(orders.id, currentOrder.id))
        .returning();

      await tx.insert(orderStatusHistory).values({
        actorUserId: input.actorUserId,
        fromStatus: currentOrder.status,
        metadata: {
          channel: currentOrder.channel,
        },
        note: input.note ?? null,
        orderId: currentOrder.id,
        toStatus: input.nextStatus,
      });

      await tx.insert(auditLogs).values({
        action: AUDIT_ACTIONS.ORDER_STATUS_CHANGED,
        actorRole: input.actorRole,
        actorUserId: input.actorUserId,
        correlationId: input.requestContext.correlationId,
        description: "Status pesanan diubah melalui workflow server-side.",
        ipAddress: input.requestContext.ipAddress,
        metadata: {
          fromStatus: currentOrder.status,
          note: input.note ?? null,
          orderNumber: currentOrder.orderNumber,
          toStatus: input.nextStatus,
        },
        result: "SUCCESS",
        targetId: currentOrder.id,
        targetType: "order",
        userAgent: input.requestContext.userAgent,
      });

      if (currentOrder.customerUserId) {
        await tx.insert(notifications).values({
          actionHref: `/orders/${currentOrder.id}`,
          dedupeKey: `order:${currentOrder.id}:status:${input.nextStatus}`,
          message: `Status pesanan ${currentOrder.orderNumber} diperbarui.`,
          severity: "info",
          title: "Status Pesanan Diperbarui",
          type: "ORDER_PROCESSING",
          userId: currentOrder.customerUserId,
        });
      }

      return updatedOrder;
    });
  }

  /**
   * Admin manual override for a payment status.
   * Only Admin role may call this. Idempotent when the payment is already in
   * the requested terminal state. Produces a paymentEvent, audit log, and
   * Admin-targeted in-app notification.
   */
  async adminOverridePayment(
    paymentId: string,
    overrideStatus: "PAID" | "CANCELLED" | "REFUNDED",
    reason: string,
    actorUserId: string,
  ): Promise<{ ok: true }> {
    const now = new Date();

    return db.transaction(async (tx) => {
      const [payment] = await tx
        .select({
          amount: payments.amount,
          id: payments.id,
          orderId: payments.orderId,
          status: payments.status,
        })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!payment) {
        throw new NotFoundAppError("Pembayaran tidak ditemukan.");
      }

      // Idempotency: already in the requested state.
      if (payment.status === overrideStatus) {
        return { ok: true as const };
      }

      // Guard: cannot mark PAID if already cancelled/failed/expired/refunded.
      if (
        overrideStatus === "PAID" &&
        (payment.status === "CANCELLED" ||
          payment.status === "FAILED" ||
          payment.status === "EXPIRED" ||
          payment.status === "REFUNDED")
      ) {
        throw new ValidationAppError(
          "Tidak dapat menandai lunas pembayaran yang sudah dibatalkan atau gagal.",
        );
      }

      // Guard: cannot cancel/refund an already-paid payment without REFUNDED path.
      if (overrideStatus === "CANCELLED" && payment.status === "PAID") {
        throw new ValidationAppError(
          "Pembayaran yang sudah lunas tidak dapat dibatalkan. Gunakan opsi Refund.",
        );
      }

      const [order] = await tx
        .select({
          customerUserId: orders.customerUserId,
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
        })
        .from(orders)
        .where(eq(orders.id, payment.orderId))
        .limit(1);

      if (!order) {
        throw new NotFoundAppError("Pesanan untuk pembayaran ini tidak ditemukan.");
      }

      // 1. Insert payment event.
      await tx.insert(paymentEvents).values({
        eventType: "admin.override",
        paymentId,
        safePayload: {
          actorId: actorUserId,
          note: "Admin manual override",
          previousStatus: payment.status,
          reason,
        },
        status: overrideStatus,
      });

      // 2. Update payment record.
      await tx
        .update(payments)
        .set({
          paidAt: overrideStatus === "PAID" ? now : undefined,
          status: overrideStatus,
          updatedAt: now,
        })
        .where(eq(payments.id, paymentId));

      // 3. Transition order status.
      // Payment confirmed → move to PAID (not directly to PROCESSING).
      // AWAITING_PAYMENT → PAID is valid; AWAITING_PAYMENT → PROCESSING is not.
      const nextOrderStatus: OrderStatus =
        overrideStatus === "PAID"
          ? "PAID"
          : overrideStatus === "CANCELLED"
            ? "CANCELLED"
            : "REFUNDED";

      if (canTransitionOrder(order.status, nextOrderStatus)) {
        await tx
          .update(orders)
          .set({ status: nextOrderStatus, updatedAt: now })
          .where(eq(orders.id, order.id));

        await tx.insert(orderStatusHistory).values({
          actorUserId,
          fromStatus: order.status,
          metadata: {
            adminOverride: true,
            overrideStatus,
            reason,
          },
          note: `Override admin: ${reason}`,
          orderId: order.id,
          toStatus: nextOrderStatus,
        });
      }

      // 4. Notify customer if applicable.
      if (order.customerUserId) {
        const notificationTitle =
          overrideStatus === "PAID"
            ? "Pembayaran Dikonfirmasi Admin"
            : overrideStatus === "CANCELLED"
              ? "Pembayaran Dibatalkan Admin"
              : "Pembayaran Direfund Admin";
        const notificationMessage =
          overrideStatus === "PAID"
            ? `Pembayaran untuk pesanan ${order.orderNumber} dikonfirmasi oleh admin.`
            : overrideStatus === "CANCELLED"
              ? `Pembayaran untuk pesanan ${order.orderNumber} dibatalkan oleh admin.`
              : `Pembayaran untuk pesanan ${order.orderNumber} direfund oleh admin.`;

        await tx.insert(notifications).values({
          actionHref: `/orders/${order.id}`,
          dedupeKey: `payment:${paymentId}:override:${overrideStatus}`,
          message: notificationMessage,
          severity: overrideStatus === "PAID" ? "success" : "warning",
          title: notificationTitle,
          type: "PAYMENT_STATUS",
          userId: order.customerUserId,
        });
      }

      // 5. Notify Admin role about the override for traceability.
      await tx.insert(notifications).values({
        actionHref: `/payments/${paymentId}`,
        dedupeKey: `payment:${paymentId}:override:admin:${overrideStatus}:${actorUserId}`,
        message: `Admin melakukan override pembayaran pesanan ${order.orderNumber} ke status ${overrideStatus}. Alasan: ${reason}`,
        roleTarget: "ADMIN",
        severity: "warning",
        title: "Override Pembayaran oleh Admin",
        type: "PAYMENT_STATUS",
      });

      // 6. Audit log.
      await tx.insert(auditLogs).values({
        action: AUDIT_ACTIONS.PAYMENT_OVERRIDE,
        actorRole: "ADMIN",
        actorUserId,
        description: `Admin override pembayaran ke ${overrideStatus}. Alasan: ${reason}`,
        metadata: {
          orderNumber: order.orderNumber,
          overrideStatus,
          paymentId,
          reason,
        },
        result: "SUCCESS",
        targetId: paymentId,
        targetType: "payment",
      });

      return { ok: true as const };
    });
  }

  async getOrderItemCount(orderId: string) {
    const [row] = await readDb
      .select({ total: countSql() })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return Number(row?.total ?? 0);
  }

  /**
   * Creates a counter sale (OFFLINE channel) with immediate payment confirmation.
   * This mimics the cashier workflow where items are selected, payment is taken,
   * and the order is immediately marked as PAID/PROCESSING.
   */
  async createCashierOrder(
    input: {
      items: Array<{ medicineId: string; quantity: number }>;
      paymentMethod: string;
      customerUserId?: string | null;
    },
    actor: { actorUserId: string; actorRole: UserRole; requestContext: RequestContext },
  ): Promise<{ orderId: string; orderNumber: string }> {
    const now = new Date();

    if (input.items.length === 0) {
      throw new ValidationAppError("Daftar belanja tidak boleh kosong.");
    }

    return db.transaction(async (tx) => {
      // 1. Fetch medicine details and validate status.
      const medicineIds = input.items.map((i) => i.medicineId);
      const medicineDetails = await tx
        .select({
          id: medicines.id,
          name: medicines.name,
          prescriptionRequired: medicines.prescriptionRequired,
          sellingPrice: medicines.sellingPrice,
          status: medicines.status,
        })
        .from(medicines)
        .where(sql`${medicines.id} in ${medicineIds}`);

      const medicineMap = new Map(medicineDetails.map((m) => [m.id, m]));

      for (const item of input.items) {
        const detail = medicineMap.get(item.medicineId);
        if (!detail || detail.status !== "ACTIVE") {
          throw new ValidationAppError(
            `Obat "${detail?.name || item.medicineId}" tidak tersedia.`,
          );
        }
      }

      // 2. Calculate totals.
      const lines = input.items.map((item) => {
        const detail = medicineMap.get(item.medicineId)!;
        return {
          prescriptionRequired: detail.prescriptionRequired,
          quantity: item.quantity,
          unitPrice: detail.sellingPrice,
        };
      });

      const totals = calculateOrderTotals(lines);

      // 3. Create order.
      const orderNumber = `OFL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const [order] = await tx
        .insert(orders)
        .values({
          cashierUserId: actor.actorUserId,
          channel: "COUNTER",
          customerUserId: input.customerUserId ?? null,
          discountTotal: totals.discountTotal,
          grandTotal: totals.grandTotal,
          orderNumber,
          prescriptionRequired: totals.prescriptionRequired,
          status: "PAID",
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
        })
        .returning();

      // 4. Create order items.
      await tx.insert(orderItems).values(
        input.items.map((item) => {
          const detail = medicineMap.get(item.medicineId)!;
          return {
            medicineId: item.medicineId,
            orderId: order.id,
            prescriptionRequired: detail.prescriptionRequired,
            quantity: item.quantity,
            subtotal: (
              Math.round(Number(detail.sellingPrice) * 100 * item.quantity) / 100
            ).toFixed(2),
            unitPrice: detail.sellingPrice,
          };
        }),
      );

      await inventoryWorkflow.recordCounterSaleTx(tx, order.id, {
        actorUserId: actor.actorUserId,
      });

      // 5. Create payment (immediately PAID).
      const [payment] = await tx
        .insert(payments)
        .values({
          amount: totals.grandTotal,
          method: input.paymentMethod as any,
          orderId: order.id,
          paidAt: now,
          provider: "cashier",
          status: "PAID",
        })
        .returning();

      // 6. Record status history.
      await tx.insert(orderStatusHistory).values({
        actorUserId: actor.actorUserId,
        fromStatus: null,
        metadata: { cashierId: actor.actorUserId, channel: "COUNTER" },
        note: "Penjualan langsung di kasir.",
        orderId: order.id,
        toStatus: "PAID",
      });

      // 7. Transition to PROCESSING.
      await tx
        .update(orders)
        .set({ status: "PROCESSING", updatedAt: now })
        .where(eq(orders.id, order.id));

      await tx.insert(orderStatusHistory).values({
        actorUserId: actor.actorUserId,
        fromStatus: "PAID",
        metadata: { channel: "COUNTER" },
        note: "Pesanan otomatis diproses setelah pembayaran kasir.",
        orderId: order.id,
        toStatus: "PROCESSING",
      });

      // 8. Audit log.
      await tx.insert(auditLogs).values({
        action: AUDIT_ACTIONS.ORDER_STATUS_CHANGED,
        actorRole: actor.actorRole,
        actorUserId: actor.actorUserId,
        correlationId: actor.requestContext.correlationId,
        description: `Transaksi kasir berhasil: ${orderNumber}`,
        ipAddress: actor.requestContext.ipAddress,
        metadata: {
          grandTotal: totals.grandTotal,
          orderNumber,
          paymentMethod: input.paymentMethod,
        },
        result: "SUCCESS",
        targetId: order.id,
        targetType: "order",
        userAgent: actor.requestContext.userAgent,
      });

      return {
        orderId: order.id,
        orderNumber,
      };
    });
  }

  /**
   * Returns the first PENDING payment for each of the given order IDs,
   * filtered to orders owned by the specified customer.
   * Used to surface a "Pay Now" link after prescription approval.
   */
  async getOrderPendingPayments(
    orderIds: string[],
    customerUserId: string,
  ): Promise<Array<{ id: string; method: string; orderId: string }>> {
    if (orderIds.length === 0) return [];

    const rows = await readDb
      .select({
        id: payments.id,
        method: payments.method,
        orderId: payments.orderId,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(
        and(
          inArray(payments.orderId, orderIds),
          eq(orders.customerUserId, customerUserId),
          eq(payments.status, "PENDING"),
        ),
      );

    // Keep only the first payment per order
    const seen = new Set<string>();
    return rows.filter((row) => {
      if (seen.has(row.orderId)) return false;
      seen.add(row.orderId);
      return true;
    });
  }
}
