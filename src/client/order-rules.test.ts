import { describe, expect, it } from "vitest";

import { ValidationAppError } from "@/lib/errors";

import {
  assertOrderTransition,
  calculateOrderTotals,
  getOrderStatusAfterPayment,
  shouldIgnorePaymentCallback,
} from "./order-rules";

describe("calculateOrderTotals", () => {
  it("recalculates totals from authoritative server-side item prices", () => {
    expect(
      calculateOrderTotals(
        [
          { quantity: 2, unitPrice: "12500.00" },
          {
            prescriptionRequired: true,
            quantity: 1,
            unitPrice: "8000.50",
          },
        ],
        "1000.00",
        "500.00",
      ),
    ).toEqual({
      discountTotal: "1000.00",
      grandTotal: "32500.50",
      prescriptionRequired: true,
      subtotal: "33000.50",
      taxTotal: "500.00",
    });
  });

  it("rejects empty carts and invalid quantities", () => {
    expect(() => calculateOrderTotals([])).toThrow(ValidationAppError);
    expect(() =>
      calculateOrderTotals([{ quantity: 0, unitPrice: "1000.00" }]),
    ).toThrow(ValidationAppError);
  });
});

describe("assertOrderTransition", () => {
  it("allows valid workflow transitions", () => {
    expect(() =>
      assertOrderTransition("PRESCRIPTION_REVIEW", "AWAITING_PAYMENT"),
    ).not.toThrow();
  });

  it("rejects invalid workflow transitions", () => {
    expect(() => assertOrderTransition("CANCELLED", "PROCESSING")).toThrow(
      ValidationAppError,
    );
  });
});

describe("getOrderStatusAfterPayment", () => {
  it("moves a payable order to paid after verified payment", () => {
    expect(getOrderStatusAfterPayment("PAYMENT_PENDING", "PAID")).toBe("PAID");
  });

  it("moves failed payment back to awaiting payment", () => {
    expect(getOrderStatusAfterPayment("PAYMENT_PENDING", "FAILED")).toBe(
      "AWAITING_PAYMENT",
    );
  });
});

describe("shouldIgnorePaymentCallback", () => {
  it("ignores duplicate terminal callback with the same status", () => {
    expect(shouldIgnorePaymentCallback("PAID", "PAID")).toBe(true);
  });

  it("does not ignore conflicting callback statuses", () => {
    expect(shouldIgnorePaymentCallback("PAID", "FAILED")).toBe(false);
  });
});
