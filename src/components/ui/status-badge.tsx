import type { ComponentPropsWithoutRef } from "react";

import {
  HEALTH_STATUS_LABELS,
  HEALTH_STATUS_TONES,
  JOB_STATUS_LABELS,
  JOB_STATUS_TONES,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_TONES,
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_TONES,
  type HealthStatus,
  type JobStatus,
  type StatusTone,
  type StockStatus,
  type TransferStatus,
} from "@/constants/design";

import { Badge } from "./badge";

/**
 * Props for a direct status badge.
 */
export type StatusBadgeProps = Omit<
  ComponentPropsWithoutRef<typeof Badge>,
  "children" | "tone"
> & {
  label: string;
  tone: StatusTone;
};

/**
 * Direct status badge when caller already knows label and tone.
 */
export function StatusBadge({ label, tone, ...props }: StatusBadgeProps) {
  return (
    <Badge showDot tone={tone} {...props}>
      {label}
    </Badge>
  );
}

/**
 * Props for stock status badges.
 */
export type StockStatusBadgeProps = Omit<StatusBadgeProps, "label" | "tone"> & {
  label?: string;
  status: StockStatus;
};

/**
 * Stock status badge using SmartStock Pro stock status colors.
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

/**
 * Props for transfer status badges.
 */
export type TransferStatusBadgeProps = Omit<
  StatusBadgeProps,
  "label" | "tone"
> & {
  label?: string;
  status: TransferStatus;
};

/**
 * Transfer status badge using SmartStock Pro transfer status colors.
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

/**
 * Props for queue and job status badges.
 */
export type JobStatusBadgeProps = Omit<StatusBadgeProps, "label" | "tone"> & {
  label?: string;
  status: JobStatus;
};

/**
 * Queue and job status badge using SmartStock Pro job status colors.
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
 * System health status badge using SmartStock Pro monitoring colors.
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
