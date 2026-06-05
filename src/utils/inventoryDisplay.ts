import type { StockStatus } from "@/constants/design";
import type { ProductStockStatus } from "@/constants/inventory";

/**
 * Convert API stock status values to design-system badge keys.
 */
export function toStockBadgeStatus(status: ProductStockStatus): StockStatus {
  if (status === "low_stock") return "low";
  if (status === "out_of_stock") return "out";

  return status;
}

/**
 * Format inventory quantities with unit.
 */
export function formatStockQuantity(quantity: number, unit: string): string {
  return `${new Intl.NumberFormat("id-ID").format(quantity)} ${unit}`;
}

/**
 * Format date-time values for dashboard tables.
 */
export function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
