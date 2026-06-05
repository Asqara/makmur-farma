import { describe, expect, it } from "vitest";

import { InsufficientStockError, InvalidQuantityError } from "@/lib/errors";

import {
  allocateNearestExpiryBatches,
  getStockLevelStatus,
  type AllocationCandidate,
} from "./inventory-rules";

const now = new Date("2026-06-05T00:00:00.000Z");

function candidate(
  override: Partial<AllocationCandidate>,
): AllocationCandidate {
  return {
    availableQuantity: 10,
    batchId: "batch-a",
    batchNumber: "A",
    expiryDate: new Date("2026-09-01T00:00:00.000Z"),
    receivedDate: new Date("2026-01-01T00:00:00.000Z"),
    status: "AVAILABLE",
    ...override,
  };
}

describe("allocateNearestExpiryBatches", () => {
  it("allocates from earliest expiry, then earliest receipt, then stable id", () => {
    const allocations = allocateNearestExpiryBatches(
      [
        candidate({
          batchId: "batch-c",
          batchNumber: "C",
          expiryDate: new Date("2026-09-01T00:00:00.000Z"),
          receivedDate: new Date("2026-01-02T00:00:00.000Z"),
        }),
        candidate({
          batchId: "batch-a",
          batchNumber: "A",
          availableQuantity: 3,
          expiryDate: new Date("2026-07-01T00:00:00.000Z"),
        }),
        candidate({
          batchId: "batch-b",
          batchNumber: "B",
          availableQuantity: 4,
          expiryDate: new Date("2026-09-01T00:00:00.000Z"),
          receivedDate: new Date("2026-01-01T00:00:00.000Z"),
        }),
      ],
      8,
      now,
    );

    expect(allocations).toEqual([
      { batchId: "batch-a", batchNumber: "A", quantity: 3 },
      { batchId: "batch-b", batchNumber: "B", quantity: 4 },
      { batchId: "batch-c", batchNumber: "C", quantity: 1 },
    ]);
  });

  it("rejects expired and blocked batches", () => {
    expect(() =>
      allocateNearestExpiryBatches(
        [
          candidate({
            batchId: "expired",
            expiryDate: new Date("2026-01-01T00:00:00.000Z"),
          }),
          candidate({
            batchId: "blocked",
            status: "BLOCKED",
          }),
        ],
        1,
        now,
      ),
    ).toThrow(InsufficientStockError);
  });

  it("rejects non-positive quantity", () => {
    expect(() => allocateNearestExpiryBatches([], 0, now)).toThrow(
      InvalidQuantityError,
    );
  });
});

describe("getStockLevelStatus", () => {
  it("classifies stock risk against thresholds", () => {
    expect(
      getStockLevelStatus({
        availableQuantity: 0,
        criticalThreshold: 3,
        lowThreshold: 10,
      }),
    ).toBe("out");
    expect(
      getStockLevelStatus({
        availableQuantity: 3,
        criticalThreshold: 3,
        lowThreshold: 10,
      }),
    ).toBe("critical");
    expect(
      getStockLevelStatus({
        availableQuantity: 8,
        criticalThreshold: 3,
        lowThreshold: 10,
      }),
    ).toBe("low");
    expect(
      getStockLevelStatus({
        availableQuantity: 12,
        criticalThreshold: 3,
        lowThreshold: 10,
      }),
    ).toBe("available");
  });
});
