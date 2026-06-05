import {
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_VALUES,
  TERMINAL_PAYMENT_STATUSES,
  canTransitionOrder,
  type OrderStatus,
  type PaymentStatus,
} from "@/constants/domain";
import { ValidationAppError } from "@/lib/errors";

export type OrderLineInput = {
  prescriptionRequired?: boolean;
  quantity: number;
  unitPrice: string | number;
};

export type OrderTotals = {
  discountTotal: string;
  grandTotal: string;
  prescriptionRequired: boolean;
  subtotal: string;
  taxTotal: string;
};

function toCents(value: string | number) {
  const text = String(value);
  const parsed = Number(text);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ValidationAppError("Nilai uang tidak valid.");
  }

  return Math.round(parsed * 100);
}

function formatCents(value: number) {
  return (value / 100).toFixed(2);
}

/**
 * Recalculates authoritative order totals from server-side item prices.
 */
export function calculateOrderTotals(
  lines: OrderLineInput[],
  discountTotal: string | number = 0,
  taxTotal: string | number = 0,
): OrderTotals {
  if (lines.length === 0) {
    throw new ValidationAppError("Keranjang tidak boleh kosong.");
  }

  let subtotalCents = 0;
  let prescriptionRequired = false;

  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new ValidationAppError("Jumlah item harus berupa bilangan bulat positif.");
    }

    subtotalCents += toCents(line.unitPrice) * line.quantity;
    prescriptionRequired = prescriptionRequired || Boolean(line.prescriptionRequired);
  }

  const discountCents = toCents(discountTotal);
  const taxCents = toCents(taxTotal);
  const grandTotalCents = subtotalCents - discountCents + taxCents;

  if (grandTotalCents < 0) {
    throw new ValidationAppError("Total pesanan tidak boleh negatif.");
  }

  return {
    discountTotal: formatCents(discountCents),
    grandTotal: formatCents(grandTotalCents),
    prescriptionRequired,
    subtotal: formatCents(subtotalCents),
    taxTotal: formatCents(taxCents),
  };
}

/**
 * Validates server-side order transition rules.
 */
export function assertOrderTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
) {
  if (!canTransitionOrder(fromStatus, toStatus)) {
    throw new ValidationAppError(
      `Status pesanan tidak dapat berubah dari ${fromStatus} ke ${toStatus}.`,
    );
  }
}

/**
 * Chooses the next order status after a verified payment state.
 */
export function getOrderStatusAfterPayment(
  currentStatus: OrderStatus,
  paymentStatus: PaymentStatus,
): OrderStatus {
  if (!PAYMENT_STATUS_VALUES.includes(paymentStatus)) {
    throw new ValidationAppError("Status pembayaran tidak valid.");
  }

  if (paymentStatus === "PAID") {
    const nextStatus: OrderStatus = "PAID";
    assertOrderTransition(currentStatus, nextStatus);
    return nextStatus;
  }

  if (paymentStatus === "FAILED") {
    assertOrderTransition(currentStatus, "AWAITING_PAYMENT");
    return "AWAITING_PAYMENT";
  }

  if (paymentStatus === "EXPIRED" || paymentStatus === "CANCELLED") {
    assertOrderTransition(currentStatus, "EXPIRED");
    return "EXPIRED";
  }

  return currentStatus;
}

/**
 * Duplicate callbacks are ignored after a payment reaches a terminal status.
 */
export function shouldIgnorePaymentCallback(
  currentStatus: PaymentStatus,
  incomingStatus: PaymentStatus,
) {
  return (
    TERMINAL_PAYMENT_STATUSES.has(currentStatus) &&
    currentStatus === incomingStatus
  );
}

export { ORDER_STATUS_TRANSITIONS };
