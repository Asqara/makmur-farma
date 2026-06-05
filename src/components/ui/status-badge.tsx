import type { ComponentPropsWithoutRef } from "react";

import {
  EXPIRY_STATUS_LABELS,
  EXPIRY_STATUS_TONES,
  HEALTH_STATUS_LABELS,
  HEALTH_STATUS_TONES,
  JOB_STATUS_LABELS,
  JOB_STATUS_TONES,
  MEDICINE_STATUS_LABELS,
  MEDICINE_STATUS_TONES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  PRESCRIPTION_STATUS_LABELS,
  PRESCRIPTION_STATUS_TONES,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_TONES,
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_TONES,
  type ExpiryStatus,
  type HealthStatus,
  type JobStatus,
  type MedicineStatus,
  type OrderStatus,
  type PaymentStatus,
  type PrescriptionStatus,
  type StatusTone,
  type StockStatus,
  type TransferStatus,
} from "@/constants/design";

import { Badge } from "./badge";

/**
 * Props for a direct status badge when the caller already knows label and tone.
 */
export type StatusBadgeProps = Omit<
  ComponentPropsWithoutRef<typeof Badge>,
  "children" | "tone"
> & {
  label: string;
  tone: StatusTone;
};

/**
 * Base status badge — renders a dot and a label in the correct semantic tone.
 */
export function StatusBadge({ label, tone, ...props }: StatusBadgeProps) {
  return (
    <Badge showDot tone={tone} {...props}>
      {label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Stock status badge
// ---------------------------------------------------------------------------

/**
 * Props for medicine-batch stock status badges.
 */
export type StockStatusBadgeProps = Omit<StatusBadgeProps, "label" | "tone"> & {
  label?: string;
  status: StockStatus;
};

/**
 * Stock availability badge — Tersedia, Stok Rendah, Stok Kritis, Habis, Diblokir.
 */
export function StockStatusBadge({
  label,
  status,
  ...props
}: StockStatusBadgeProps) {
  return (
    <StatusBadge
      label={label ?? STOCK_STATUS_LABELS[status]}
      tone={STOCK_STATUS_TONES[status]}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Expiry status badge
// ---------------------------------------------------------------------------

/**
 * Props for medicine-batch expiry status badges.
 */
export type ExpiryStatusBadgeProps = Omit<
  StatusBadgeProps,
  "label" | "tone"
> & {
  label?: string;
  status: ExpiryStatus;
};

/**
 * Expiry condition badge — Aman, Mendekati Kedaluwarsa, Segera Kedaluwarsa, Kedaluwarsa.
 */
export function ExpiryStatusBadge({
  label,
  status,
  ...props
}: ExpiryStatusBadgeProps) {
  return (
    <StatusBadge
      label={label ?? EXPIRY_STATUS_LABELS[status]}
      tone={EXPIRY_STATUS_TONES[status]}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Medicine status badge
// ---------------------------------------------------------------------------

/**
 * Props for medicine master-data status badges.
 */
export type MedicineStatusBadgeProps = Omit<
  StatusBadgeProps,
  "label" | "tone"
> & {
  label?: string;
  status: MedicineStatus;
};

/**
 * Medicine status badge — Aktif, Dihentikan, Menunggu Tinjauan.
 */
export function MedicineStatusBadge({
  label,
  status,
  ...props
}: MedicineStatusBadgeProps) {
  return (
    <StatusBadge
      label={label ?? MEDICINE_STATUS_LABELS[status]}
      tone={MEDICINE_STATUS_TONES[status]}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Prescription status badge
// ---------------------------------------------------------------------------

/**
 * Props for prescription review status badges.
 */
export type PrescriptionStatusBadgeProps = Omit<
  StatusBadgeProps,
  "label" | "tone"
> & {
  label?: string;
  status: PrescriptionStatus;
};

/**
 * Prescription status badge — Menunggu Verifikasi, Sedang Ditinjau, Disetujui, Ditolak, Perlu Perbaikan.
 */
export function PrescriptionStatusBadge({
  label,
  status,
  ...props
}: PrescriptionStatusBadgeProps) {
  return (
    <StatusBadge
      label={label ?? PRESCRIPTION_STATUS_LABELS[status]}
      tone={PRESCRIPTION_STATUS_TONES[status]}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Order status badge
// ---------------------------------------------------------------------------

/**
 * Props for order lifecycle status badges.
 */
export type OrderStatusBadgeProps = Omit<
  StatusBadgeProps,
  "label" | "tone"
> & {
  label?: string;
  status: OrderStatus;
};

/**
 * Order status badge covering the full Makmur Farma order workflow.
 */
export function OrderStatusBadge({
  label,
  status,
  ...props
}: OrderStatusBadgeProps) {
  return (
    <StatusBadge
      label={label ?? ORDER_STATUS_LABELS[status]}
      tone={ORDER_STATUS_TONES[status]}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Payment status badge
// ---------------------------------------------------------------------------

/**
 * Props for payment status badges.
 */
export type PaymentStatusBadgeProps = Omit<
  StatusBadgeProps,
  "label" | "tone"
> & {
  label?: string;
  status: PaymentStatus;
};

/**
 * Payment status badge — Menunggu, Berhasil, Gagal, Kedaluwarsa, Dikembalikan.
 */
export function PaymentStatusBadge({
  label,
  status,
  ...props
}: PaymentStatusBadgeProps) {
  return (
    <StatusBadge
      label={label ?? PAYMENT_STATUS_LABELS[status]}
      tone={PAYMENT_STATUS_TONES[status]}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Transfer status badge (kept for backward compatibility)
// ---------------------------------------------------------------------------

/**
 * Props for transfer / stock-movement status badges.
 */
export type TransferStatusBadgeProps = Omit<
  StatusBadgeProps,
  "label" | "tone"
> & {
  label?: string;
  status: TransferStatus;
};

/**
 * Transfer status badge for stock-movement and import flows.
 */
export function TransferStatusBadge({
  label,
  status,
  ...props
}: TransferStatusBadgeProps) {
  return (
    <StatusBadge
      label={label ?? TRANSFER_STATUS_LABELS[status]}
      tone={TRANSFER_STATUS_TONES[status]}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Job status badge
// ---------------------------------------------------------------------------

/**
 * Props for background-job status badges.
 */
export type JobStatusBadgeProps = Omit<StatusBadgeProps, "label" | "tone"> & {
  label?: string;
  status: JobStatus;
};

/**
 * Job / queue status badge for import, report, and notification jobs.
 */
export function JobStatusBadge({
  label,
  status,
  ...props
}: JobStatusBadgeProps) {
  return (
    <StatusBadge
      label={label ?? JOB_STATUS_LABELS[status]}
      tone={JOB_STATUS_TONES[status]}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Health status badge
// ---------------------------------------------------------------------------

/**
 * Props for system health status badges.
 */
export type HealthStatusBadgeProps = Omit<
  StatusBadgeProps,
  "label" | "tone"
> & {
  label?: string;
  status: HealthStatus;
};

/**
 * System health badge — Sehat, Menurun, Bermasalah, Tidak Diketahui.
 */
export function HealthStatusBadge({
  label,
  status,
  ...props
}: HealthStatusBadgeProps) {
  return (
    <StatusBadge
      label={label ?? HEALTH_STATUS_LABELS[status]}
      tone={HEALTH_STATUS_TONES[status]}
      {...props}
    />
  );
}
