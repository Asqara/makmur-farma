import type { StatusTone } from "@/constants/design";

/**
 * Medicine master-data lifecycle.
 */
export const MEDICINE_STATUS_VALUES = [
  "ACTIVE",
  "INACTIVE",
  "DISCONTINUED",
  "BLOCKED",
] as const;

/**
 * Batch lifecycle values. PostgreSQL remains the source of truth for stock.
 */
export const BATCH_STATUS_VALUES = [
  "AVAILABLE",
  "BLOCKED",
  "DEPLETED",
  "EXPIRED",
  "RECALLED",
] as const;

/**
 * Stock movement operations that must exist for every stock mutation.
 */
export const STOCK_MOVEMENT_TYPE_VALUES = [
  "RECEIPT",
  "SALE",
  "RESERVATION",
  "RESERVATION_RELEASE",
  "CANCELLATION_RELEASE",
  "ADJUSTMENT",
  "RETURN",
  "DISPOSAL",
  "IMPORT_OPENING",
] as const;

/**
 * Order entry channels.
 */
export const ORDER_CHANNEL_VALUES = ["ONLINE", "COUNTER"] as const;

/**
 * Explicit order workflow statuses.
 */
export const ORDER_STATUS_VALUES = [
  "DRAFT",
  "AWAITING_PRESCRIPTION",
  "PRESCRIPTION_REVIEW",
  "PRESCRIPTION_REJECTED",
  "AWAITING_PAYMENT",
  "PAYMENT_PENDING",
  "PAID",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "EXPIRED",
] as const;

/**
 * Prescription review workflow statuses.
 */
export const PRESCRIPTION_STATUS_VALUES = [
  "PENDING",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "NEEDS_REVISION",
] as const;

/**
 * Payment lifecycle statuses.
 */
export const PAYMENT_STATUS_VALUES = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "REFUNDED",
] as const;

/**
 * Payment methods supported by the MVP workflow.
 */
export const PAYMENT_METHOD_VALUES = [
  "CASH",
  "BANK_TRANSFER",
  "QRIS",
  "PAYMENT_GATEWAY",
] as const;

/**
 * Background job statuses persisted for user-visible work.
 */
export const JOB_STATUS_VALUES = [
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "PARTIALLY_COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

/**
 * Background job categories used by queues and monitoring.
 */
export const JOB_TYPE_VALUES = [
  "EMAIL_NOTIFICATION",
  "IN_APP_NOTIFICATION",
  "MEDICINE_IMPORT",
  "REPORT_GENERATION",
  "LOW_STOCK_SCAN",
  "EXPIRY_SCAN",
  "PAYMENT_FOLLOW_UP",
  "RESERVATION_EXPIRY",
] as const;

/**
 * Import row result states.
 */
export const IMPORT_ROW_STATUS_VALUES = [
  "VALID",
  "WARNING",
  "FAILED",
  "IMPORTED",
] as const;

/**
 * Application error severity values. Keep lowercase to match DESIGN.md.
 */
export const ERROR_SEVERITY_VALUES = ["critical", "warning", "info"] as const;

export type BatchStatus = (typeof BATCH_STATUS_VALUES)[number];
export type ErrorSeverity = (typeof ERROR_SEVERITY_VALUES)[number];
export type ImportRowStatus = (typeof IMPORT_ROW_STATUS_VALUES)[number];
export type JobStatus = (typeof JOB_STATUS_VALUES)[number];
export type JobType = (typeof JOB_TYPE_VALUES)[number];
export type MedicineStatus = (typeof MEDICINE_STATUS_VALUES)[number];
export type OrderChannel = (typeof ORDER_CHANNEL_VALUES)[number];
export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];
export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUS_VALUES)[number];
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPE_VALUES)[number];

export const MEDICINE_STATUS_LABELS: Record<MedicineStatus, string> = {
  ACTIVE: "Aktif",
  BLOCKED: "Diblokir",
  DISCONTINUED: "Dihentikan",
  INACTIVE: "Nonaktif",
};

export const MEDICINE_STATUS_TONES: Record<MedicineStatus, StatusTone> = {
  ACTIVE: "success",
  BLOCKED: "neutral",
  DISCONTINUED: "neutral",
  INACTIVE: "warning",
};

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  AVAILABLE: "Tersedia",
  BLOCKED: "Diblokir",
  DEPLETED: "Habis",
  EXPIRED: "Kedaluwarsa",
  RECALLED: "Ditarik",
};

export const BATCH_STATUS_TONES: Record<BatchStatus, StatusTone> = {
  AVAILABLE: "success",
  BLOCKED: "neutral",
  DEPLETED: "danger",
  EXPIRED: "danger",
  RECALLED: "warning",
};

export const ORDER_CHANNEL_LABELS: Record<OrderChannel, string> = {
  COUNTER: "Kasir",
  ONLINE: "Online",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Menunggu Pembayaran",
  AWAITING_PRESCRIPTION: "Menunggu Resep",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
  DRAFT: "Draf",
  EXPIRED: "Kedaluwarsa",
  PAID: "Dibayar",
  PAYMENT_PENDING: "Pembayaran Diproses",
  PRESCRIPTION_REJECTED: "Resep Ditolak",
  PRESCRIPTION_REVIEW: "Tinjauan Resep",
  PROCESSING: "Diproses",
  READY_FOR_PICKUP: "Siap Diambil",
  REFUNDED: "Dikembalikan",
  SHIPPED: "Dikirim",
};

export const ORDER_STATUS_TONES: Record<OrderStatus, StatusTone> = {
  AWAITING_PAYMENT: "warning",
  AWAITING_PRESCRIPTION: "warning",
  CANCELLED: "neutral",
  COMPLETED: "success",
  DRAFT: "neutral",
  EXPIRED: "neutral",
  PAID: "info",
  PAYMENT_PENDING: "warning",
  PRESCRIPTION_REJECTED: "danger",
  PRESCRIPTION_REVIEW: "info",
  PROCESSING: "primary",
  READY_FOR_PICKUP: "success",
  REFUNDED: "neutral",
  SHIPPED: "info",
};

export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  APPROVED: "Disetujui",
  IN_REVIEW: "Sedang Ditinjau",
  NEEDS_REVISION: "Perlu Perbaikan",
  PENDING: "Menunggu Verifikasi",
  REJECTED: "Ditolak",
};

export const PRESCRIPTION_STATUS_TONES: Record<PrescriptionStatus, StatusTone> = {
  APPROVED: "success",
  IN_REVIEW: "info",
  NEEDS_REVISION: "warning",
  PENDING: "warning",
  REJECTED: "danger",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  CANCELLED: "Dibatalkan",
  EXPIRED: "Kedaluwarsa",
  FAILED: "Gagal",
  PAID: "Berhasil",
  PENDING: "Menunggu",
  PROCESSING: "Diproses",
  REFUNDED: "Dikembalikan",
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  FAILED: "danger",
  PAID: "success",
  PENDING: "warning",
  PROCESSING: "info",
  REFUNDED: "info",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
  FAILED: "Gagal",
  PARTIALLY_COMPLETED: "Sebagian Selesai",
  PROCESSING: "Berjalan",
  QUEUED: "Menunggu",
};

export const JOB_STATUS_TONES: Record<JobStatus, StatusTone> = {
  CANCELLED: "neutral",
  COMPLETED: "success",
  FAILED: "danger",
  PARTIALLY_COMPLETED: "warning",
  PROCESSING: "info",
  QUEUED: "neutral",
};

export const TERMINAL_ORDER_STATUSES = new Set<OrderStatus>([
  "CANCELLED",
  "COMPLETED",
  "EXPIRED",
  "REFUNDED",
]);

export const TERMINAL_PAYMENT_STATUSES = new Set<PaymentStatus>([
  "CANCELLED",
  "EXPIRED",
  "FAILED",
  "PAID",
  "REFUNDED",
]);

/**
 * Server-side order transition map. UI labels are separate from this rule.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  AWAITING_PAYMENT: ["PAYMENT_PENDING", "PAID", "CANCELLED", "EXPIRED"],
  AWAITING_PRESCRIPTION: ["PRESCRIPTION_REVIEW", "CANCELLED", "EXPIRED"],
  CANCELLED: [],
  COMPLETED: [],
  DRAFT: ["AWAITING_PRESCRIPTION", "AWAITING_PAYMENT", "CANCELLED"],
  EXPIRED: [],
  PAID: ["PROCESSING", "REFUNDED"],
  PAYMENT_PENDING: ["PAID", "AWAITING_PAYMENT", "CANCELLED", "EXPIRED"],
  PRESCRIPTION_REJECTED: ["CANCELLED"],
  PRESCRIPTION_REVIEW: [
    "PRESCRIPTION_REJECTED",
    "AWAITING_PAYMENT",
    "CANCELLED",
  ],
  PROCESSING: ["READY_FOR_PICKUP", "SHIPPED", "CANCELLED", "REFUNDED"],
  READY_FOR_PICKUP: ["COMPLETED", "CANCELLED", "REFUNDED"],
  REFUNDED: [],
  SHIPPED: ["COMPLETED", "REFUNDED"],
};

/**
 * Validates whether an order transition is allowed.
 */
export function canTransitionOrder(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): boolean {
  return ORDER_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}
