import type { BatchStatus } from "@/constants/domain";
import { InsufficientStockError, InvalidQuantityError } from "@/lib/errors";

export type AllocationCandidate = {
  availableQuantity: number;
  batchId: string;
  batchNumber: string;
  expiryDate: Date;
  receivedDate: Date;
  status: BatchStatus;
};

export type BatchAllocation = {
  batchId: string;
  batchNumber: string;
  quantity: number;
};

function compareAllocationCandidate(
  left: AllocationCandidate,
  right: AllocationCandidate,
) {
  const expiryDiff = left.expiryDate.getTime() - right.expiryDate.getTime();

  if (expiryDiff !== 0) return expiryDiff;

  const receivedDiff =
    left.receivedDate.getTime() - right.receivedDate.getTime();

  if (receivedDiff !== 0) return receivedDiff;

  return left.batchId.localeCompare(right.batchId);
}

function assertPositiveQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new InvalidQuantityError("Jumlah harus berupa bilangan bulat positif.");
  }
}

/**
 * Deterministic nearest-expiry-first batch allocation used by online and counter orders.
 */
export function allocateNearestExpiryBatches(
  candidates: AllocationCandidate[],
  requestedQuantity: number,
  now = new Date(),
): BatchAllocation[] {
  assertPositiveQuantity(requestedQuantity);

  const eligible = candidates
    .filter(
      (candidate) =>
        candidate.status === "AVAILABLE" &&
        candidate.availableQuantity > 0 &&
        candidate.expiryDate.getTime() > now.getTime(),
    )
    .sort(compareAllocationCandidate);

  let remainingQuantity = requestedQuantity;
  const allocations: BatchAllocation[] = [];

  for (const candidate of eligible) {
    if (remainingQuantity === 0) break;

    const quantity = Math.min(candidate.availableQuantity, remainingQuantity);

    allocations.push({
      batchId: candidate.batchId,
      batchNumber: candidate.batchNumber,
      quantity,
    });
    remainingQuantity -= quantity;
  }

  if (remainingQuantity > 0) {
    throw new InsufficientStockError(
      "Stok batch yang memenuhi syarat tidak mencukupi.",
    );
  }

  return allocations;
}

export type StockLevelInput = {
  availableQuantity: number;
  criticalThreshold: number;
  lowThreshold: number;
};

export type StockLevelStatus = "available" | "critical" | "low" | "out";

/**
 * Calculates stock risk status without mutating authoritative stock.
 */
export function getStockLevelStatus({
  availableQuantity,
  criticalThreshold,
  lowThreshold,
}: StockLevelInput): StockLevelStatus {
  if (availableQuantity <= 0) return "out";
  if (availableQuantity <= criticalThreshold) return "critical";
  if (availableQuantity <= lowThreshold) return "low";

  return "available";
}
