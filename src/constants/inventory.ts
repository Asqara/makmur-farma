/**
 * Product stock status values as returned by the API.
 * Use toStockBadgeStatus() in src/utils/inventoryDisplay.ts to map to design-system StockStatus.
 */
export type ProductStockStatus =
  | "available"
  | "low_stock"
  | "out_of_stock"
  | "critical"
  | "blocked";
