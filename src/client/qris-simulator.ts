import "server-only";

import { createId } from "@paralleldrive/cuid2";
import { asc, desc, eq } from "drizzle-orm";

import { AUDIT_ACTIONS } from "@/constants/auth";
import { TERMINAL_PAYMENT_STATUSES } from "@/constants/domain";
import type { PaymentStatus } from "@/constants/domain";
import {
  auditLogs,
  notifications,
  orderStatusHistory,
  orders,
  paymentEvents,
  payments,
} from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import { ForbiddenError, NotFoundAppError, ValidationAppError } from "@/lib/errors";
import type { RequestContext } from "@/lib/request";
import type { UserRole } from "@/constants/auth";
import { InventoryWorkflowClient } from "./inventory";

export type SimulateOutcome = "PAID" | "FAILED" | "EXPIRED";

const inventoryWorkflow = new InventoryWorkflowClient();

export type InitializeQrisResult = {
  qrPayload: string;
  simReference: string;
};

export type SimulatorStatusResult = {
  latestEvent: {
    eventType: string;
    id: string;
    receivedAt: Date;
    safePayload: Record<string, unknown>;
    status: PaymentStatus;
  } | null;
  payment: {
    amount: string;
    createdAt: Date;
    expiresAt: Date | null;
    id: string;
    method: string;
    orderId: string;
    orderNumber: string;
    paidAt: Date | null;
    provider: string;
    providerReference: string | null;
    status: PaymentStatus;
    updatedAt: Date;
  };
};

/**
 * QRIS payment simulation service.
 * Used only when ENABLE_PAYMENT_SIMULATOR=true (development/demo environments).
 * This is not a real payment provider integration.
 */
export class QrisSimulatorClient {
  /**
   * Initialize a QRIS payment for simulation.
   * Generates a simulator reference and fake QR payload for display.
   */
  async initializeQrisPayment(
    paymentId: string,
    amount: string,
  ): Promise<InitializeQrisResult> {
    const [payment] = await readDb
      .select({
        id: payments.id,
        method: payments.method,
        provider: payments.provider,
        providerReference: payments.providerReference,
        status: payments.status,
      })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      throw new NotFoundAppError("Pembayaran tidak ditemukan.");
    }

    if (payment.method !== "QRIS") {
      throw new ValidationAppError("Pembayaran ini bukan metode QRIS.");
    }

    if (TERMINAL_PAYMENT_STATUSES.has(payment.status)) {
      throw new ValidationAppError("Pembayaran sudah dalam status final.");
    }

    // Re-use existing simReference if already initialized.
    if (
      payment.provider === "qris-simulator" &&
      payment.providerReference?.startsWith("SIM-")
    ) {
      return {
        qrPayload: `DEMO-QR-${payment.providerReference}`,
        simReference: payment.providerReference,
      };
    }

    const simReference = `SIM-${createId()}`;
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          provider: "qris-simulator",
          providerReference: simReference,
          updatedAt: now,
        })
        .where(eq(payments.id, paymentId));

      await tx.insert(paymentEvents).values({
        eventType: "qris.initialized",
        paymentId,
        safePayload: {
          amount,
          simReference,
          simulatorNote: "Demo payment — not a real transaction",
        },
        status: "PENDING",
      });
    });

    return {
      qrPayload: `DEMO-QR-${simReference}`,
      simReference,
    };
  }

  /**
   * Simulate a QRIS payment callback (PAID / FAILED / EXPIRED).
   * Idempotent: if the payment is already in a terminal state the call returns early.
   *
   * TODO: Full production flow requires the worker to:
   *   - Deduct reservedQuantity and create SALE stock movement records per order item.
   *   - Release reserved stock on FAILED/EXPIRED and transition order to CANCELLED/EXPIRED.
   *   - Send email receipts and push notifications.
   * This implementation updates the payment and order status only.
   */
  async simulateCallback(
    paymentId: string,
    outcome: SimulateOutcome,
    actor: { actorRole: UserRole; actorUserId: string; requestContext: RequestContext },
  ): Promise<void> {
    const now = new Date();

    const [payment] = await readDb
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

    // Idempotency check — do not process again if already terminal.
    if (TERMINAL_PAYMENT_STATUSES.has(payment.status)) {
      return;
    }

    const [order] = await readDb
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
      throw new NotFoundAppError("Pesanan tidak ditemukan.");
    }

    const newPaymentStatus: PaymentStatus =
      outcome === "PAID" ? "PAID" : outcome === "FAILED" ? "FAILED" : "EXPIRED";

    await db.transaction(async (tx) => {
      // 1. Create payment event.
      await tx.insert(paymentEvents).values({
        eventType: "qris.callback",
        paymentId,
        providerEventId: `SIM-EVT-${createId()}`,
        safePayload: {
          outcome,
          simulatorNote: "Simulated callback — not a real payment event",
        },
        status: newPaymentStatus,
      });

      // 2. Update payment status.
      await tx
        .update(payments)
        .set({
          callbackVerifiedAt: now,
          paidAt: outcome === "PAID" ? now : null,
          status: newPaymentStatus,
          updatedAt: now,
        })
        .where(eq(payments.id, paymentId));

      // 3. Transition order status on PAID: AWAITING_PAYMENT / PAYMENT_PENDING → PAID → PROCESSING.
      if (outcome === "PAID") {
        const paidStatus = "PAID";

        await inventoryWorkflow.fulfillOrderReservationsTx(tx, order.id, {
          actorUserId: actor.actorUserId,
        });

        await tx
          .update(orders)
          .set({ status: paidStatus, updatedAt: now })
          .where(eq(orders.id, order.id));

        await tx.insert(orderStatusHistory).values({
          actorUserId: actor.actorUserId,
          fromStatus: order.status,
          metadata: { simulatedPayment: true },
          note: "Pembayaran QRIS berhasil (simulasi).",
          orderId: order.id,
          toStatus: paidStatus,
        });

        // Transition PAID → PROCESSING immediately in the simulator.
        await tx
          .update(orders)
          .set({ status: "PROCESSING", updatedAt: now })
          .where(eq(orders.id, order.id));

        await tx.insert(orderStatusHistory).values({
          actorUserId: actor.actorUserId,
          fromStatus: paidStatus,
          metadata: { simulatedPayment: true },
          note: "Pesanan otomatis diproses setelah konfirmasi pembayaran (simulasi).",
          orderId: order.id,
          toStatus: "PROCESSING",
        });

        if (order.customerUserId) {
          await tx.insert(notifications).values({
            actionHref: `/orders/${order.id}`,
            dedupeKey: `payment:${paymentId}:sim:PAID`,
            message: `Pembayaran untuk pesanan ${order.orderNumber} berhasil dikonfirmasi.`,
            severity: "success",
            title: "Pembayaran Berhasil",
            type: "PAYMENT_STATUS",
            userId: order.customerUserId,
          });
        }
      } else {
        await inventoryWorkflow.releaseOrderReservationsTx(
          tx,
          order.id,
          outcome === "FAILED"
            ? "Reservasi dilepas karena pembayaran gagal."
            : "Reservasi dilepas karena pembayaran kedaluwarsa.",
          { actorUserId: actor.actorUserId },
        );

        // FAILED / EXPIRED — cancel the order.
        const cancelStatus = "CANCELLED";

        await tx
          .update(orders)
          .set({ status: cancelStatus, updatedAt: now })
          .where(eq(orders.id, order.id));

        await tx.insert(orderStatusHistory).values({
          actorUserId: actor.actorUserId,
          fromStatus: order.status,
          metadata: { simulatedPayment: true, outcome },
          note: `Pesanan dibatalkan karena pembayaran ${outcome === "FAILED" ? "gagal" : "kedaluwarsa"} (simulasi).`,
          orderId: order.id,
          toStatus: cancelStatus,
        });

        if (order.customerUserId) {
          await tx.insert(notifications).values({
            actionHref: `/orders/${order.id}`,
            dedupeKey: `payment:${paymentId}:sim:${outcome}`,
            message: `Pembayaran untuk pesanan ${order.orderNumber} ${outcome === "FAILED" ? "gagal" : "kedaluwarsa"}.`,
            severity: "warning",
            title: outcome === "FAILED" ? "Pembayaran Gagal" : "Pembayaran Kedaluwarsa",
            type: "PAYMENT_STATUS",
            userId: order.customerUserId,
          });
        }
      }

      // 4. Audit log.
      await tx.insert(auditLogs).values({
        action: AUDIT_ACTIONS.PAYMENT_CONFIRMED,
        actorRole: actor.actorRole,
        actorUserId: actor.actorUserId,
        correlationId: actor.requestContext.correlationId,
        description: `Simulasi QRIS callback: outcome=${outcome}`,
        ipAddress: actor.requestContext.ipAddress,
        metadata: {
          orderNumber: order.orderNumber,
          outcome,
          paymentId,
          simulatorNote: "Simulated QRIS — not a real payment",
        },
        result: "SUCCESS",
        targetId: paymentId,
        targetType: "payment",
        userAgent: actor.requestContext.userAgent,
      });
    });
  }

  /**
   * Return the current payment record and latest event for simulator display.
   */
  async getSimulatorStatus(paymentId: string): Promise<SimulatorStatusResult> {
    const [row] = await readDb
      .select({
        amount: payments.amount,
        createdAt: payments.createdAt,
        expiresAt: payments.expiresAt,
        id: payments.id,
        method: payments.method,
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        paidAt: payments.paidAt,
        provider: payments.provider,
        providerReference: payments.providerReference,
        status: payments.status,
        updatedAt: payments.updatedAt,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!row) {
      throw new NotFoundAppError("Pembayaran tidak ditemukan.");
    }

    const [latestEvent] = await readDb
      .select({
        eventType: paymentEvents.eventType,
        id: paymentEvents.id,
        receivedAt: paymentEvents.receivedAt,
        safePayload: paymentEvents.safePayload,
        status: paymentEvents.status,
      })
      .from(paymentEvents)
      .where(eq(paymentEvents.paymentId, paymentId))
      .orderBy(desc(paymentEvents.receivedAt))
      .limit(1);

    return {
      latestEvent: latestEvent ?? null,
      payment: {
        amount: row.amount,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt ?? null,
        id: row.id,
        method: row.method,
        orderId: row.orderId,
        orderNumber: row.orderNumber,
        paidAt: row.paidAt ?? null,
        provider: row.provider,
        providerReference: row.providerReference ?? null,
        status: row.status,
        updatedAt: row.updatedAt,
      },
    };
  }

  /**
   * Return a payment record with its full event timeline.
   */
  async getPaymentDetail(paymentId: string): Promise<{
    events: Array<{
      eventType: string;
      id: string;
      providerEventId: string | null;
      receivedAt: Date;
      safePayload: Record<string, unknown>;
      status: PaymentStatus;
    }>;
    payment: SimulatorStatusResult["payment"];
  }> {
    const { payment } = await this.getSimulatorStatus(paymentId);

    const events = await readDb
      .select({
        eventType: paymentEvents.eventType,
        id: paymentEvents.id,
        providerEventId: paymentEvents.providerEventId,
        receivedAt: paymentEvents.receivedAt,
        safePayload: paymentEvents.safePayload,
        status: paymentEvents.status,
      })
      .from(paymentEvents)
      .where(eq(paymentEvents.paymentId, paymentId))
      .orderBy(asc(paymentEvents.receivedAt));

    return {
      events: events.map((e) => ({
        eventType: e.eventType,
        id: e.id,
        providerEventId: e.providerEventId ?? null,
        receivedAt: e.receivedAt,
        safePayload: e.safePayload,
        status: e.status,
      })),
      payment,
    };
  }
}
