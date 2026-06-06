/**
 * Logo assets available in the public folder.
 */
export const LOGO_ASSETS = {
  compact: "/logogram.svg",
  favicon: "/favicon.png",
  horizontal: "/logotype_horizontal.svg",
  vertical: "/logotype_vertical.svg",
} as const;

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

/**
 * Class names for each button variant, consumed by cva in button.tsx.
 */
export const BUTTON_VARIANT_CLASS_NAMES = {
  primary:
    "bg-primary-blue text-text-inverse hover:bg-primary-blue-hover active:bg-primary-blue-pressed focus-visible:ring-primary-blue",
  secondary:
    "border border-border-strong bg-card-surface text-text-default hover:bg-muted-surface focus-visible:ring-primary-blue",
  soft:
    "bg-primary-blue-soft text-primary-blue hover:bg-primary-blue-border focus-visible:ring-primary-blue",
  ghost:
    "bg-transparent text-text-default hover:bg-muted-surface hover:text-text-strong focus-visible:ring-primary-blue",
  danger:
    "bg-danger text-text-inverse hover:bg-danger-hover active:bg-danger-hover focus-visible:ring-danger",
} as const;

/**
 * Class names for each button size, consumed by cva in button.tsx.
 */
export const BUTTON_SIZE_CLASS_NAMES = {
  sm: "h-8 px-3 ts-xs",
  default: "h-10 px-4 ts-sm",
  lg: "h-11 px-5 ts-base",
  icon: "size-10 p-0",
} as const;

// ---------------------------------------------------------------------------
// Badge / Status tone
// ---------------------------------------------------------------------------

/**
 * Status tone union used across badge, metric card, and alert components.
 */
export type StatusTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

/**
 * Class names for each status tone, consumed by cva in badge.tsx.
 */
export const STATUS_TONE_CLASS_NAMES: Record<StatusTone, string> = {
  neutral:
    "bg-neutral-bg border-neutral-border text-neutral",
  primary:
    "bg-primary-blue-soft border-primary-blue-border text-primary-blue",
  success:
    "bg-success-bg border-success-border text-success",
  warning:
    "bg-warning-bg border-warning-border text-warning",
  danger:
    "bg-danger-bg border-danger-border text-danger",
  info:
    "bg-info-bg border-info-border text-info",
};

// ---------------------------------------------------------------------------
// Overlay layering
// ---------------------------------------------------------------------------

/**
 * Centralized overlay layers. Popovers are rendered above dialogs because
 * select/date panels are portalled to document.body while their triggers may
 * live inside modal content.
 */
export const OVERLAY_Z_INDEX_CLASS_NAMES = {
  mobileDrawer: "z-[9999]",
  dialogBackdrop: "z-[9999]",
  popover: "z-[9999]",
  toast: "z-[9999]",
} as const;

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

/**
 * Class names for Card sub-components.
 */
export const CARD_CLASS_NAMES = {
  root: "rounded-[10px] border border-border-default bg-card-surface shadow-card overflow-hidden",
  header:
    "flex items-start justify-between gap-4 border-b border-border-default px-5 py-4",
  title: "ts-sm font-semibold text-text-strong",
  description: "ts-xs text-text-muted",
  content: "p-5",
  denseContent: "p-4",
  footer:
    "flex items-center justify-between gap-3 border-t border-border-default px-5 py-3 ts-sm text-text-muted",
} as const;

// ---------------------------------------------------------------------------
// Form field
// ---------------------------------------------------------------------------

/**
 * Class names for Field wrapper and control elements.
 */
export const FIELD_CLASS_NAMES = {
  wrapper: "grid gap-1.5",
  label: "ts-sm font-medium text-text-default",
  control: [
    "ts-sm h-10 w-full rounded-lg border border-border-strong bg-card-surface px-3",
    "text-text-strong placeholder:text-text-muted",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:border-primary-blue",
    "disabled:cursor-not-allowed disabled:bg-muted-surface disabled:text-text-disabled",
    "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger/20",
  ].join(" "),
  textarea: [
    "ts-sm min-h-24 w-full resize-y rounded-lg border border-border-strong bg-card-surface px-3 py-2.5",
    "text-text-strong placeholder:text-text-muted",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:border-primary-blue",
    "disabled:cursor-not-allowed disabled:bg-muted-surface disabled:text-text-disabled",
    "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger/20",
  ].join(" "),
  helper: "ts-xs text-text-muted",
  error: "ts-xs text-danger",
} as const;

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

/**
 * Class names for SelectInput components.
 */
export const SELECT_CLASS_NAMES = {
  trigger: [
    "ts-sm h-10 w-full rounded-lg border border-border-strong bg-card-surface px-3 text-left",
    "text-text-strong",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:border-primary-blue",
    "disabled:cursor-not-allowed disabled:bg-muted-surface disabled:text-text-disabled",
  ].join(" "),
  value: "truncate text-text-strong",
  placeholder: "text-text-muted",
  panel: [
    OVERLAY_Z_INDEX_CLASS_NAMES.popover,
    "grid max-h-64 overflow-y-auto rounded-xl border border-border-default",
    "bg-elevated-surface shadow-floating",
  ].join(" "),
  option: [
    "ts-sm flex w-full items-center gap-2 px-3 py-2.5 text-left text-text-default",
    "hover:bg-muted-surface hover:text-text-strong",
  ].join(" "),
  optionActive: "bg-primary-blue-soft text-primary-blue",
} as const;

// ---------------------------------------------------------------------------
// Date input
// ---------------------------------------------------------------------------

/**
 * Class names for DateInput component.
 */
export const DATE_INPUT_CLASS_NAMES = {
  wrapper: "relative",
  trigger: [
    "ts-sm h-10 w-full rounded-lg border border-border-strong bg-card-surface px-3 pr-10 text-left",
    "text-text-strong",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:border-primary-blue",
    "disabled:cursor-not-allowed disabled:bg-muted-surface disabled:text-text-disabled",
  ].join(" "),
  value: "truncate",
  placeholder: "text-text-muted",
  icon: "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted",
  panel: [
    OVERLAY_Z_INDEX_CLASS_NAMES.popover,
    "rounded-xl border border-border-default bg-elevated-surface p-4 shadow-floating",
  ].join(" "),
  weekDay: "ts-xs text-center font-medium text-text-muted",
  day: "ts-sm grid size-9 place-items-center rounded-lg text-text-default transition-colors hover:bg-muted-surface",
  dayMuted: "text-text-disabled",
  daySelected:
    "bg-primary-blue text-text-inverse hover:bg-primary-blue-hover",
} as const;

/**
 * Copy strings for DateInput navigation buttons.
 */
export const DATE_INPUT_COPY = {
  previousMonth: "Bulan sebelumnya",
  nextMonth: "Bulan berikutnya",
} as const;

/**
 * Short weekday labels in Bahasa Indonesia, starting from Sunday.
 */
export const DATE_INPUT_WEEKDAY_LABELS = [
  "Min",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
] as const;

// ---------------------------------------------------------------------------
// Stock status (medicine batch / product stock)
// ---------------------------------------------------------------------------

/**
 * Stock availability status values.
 */
export type StockStatus = "available" | "low" | "critical" | "out" | "blocked";

/**
 * Bahasa Indonesia labels for each stock status.
 */
export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  available: "Tersedia",
  low: "Stok Rendah",
  critical: "Stok Kritis",
  out: "Habis",
  blocked: "Diblokir",
};

/**
 * Badge tone for each stock status.
 */
export const STOCK_STATUS_TONES: Record<StockStatus, StatusTone> = {
  available: "success",
  low: "warning",
  critical: "danger",
  out: "danger",
  blocked: "neutral",
};

// ---------------------------------------------------------------------------
// Expiry status
// ---------------------------------------------------------------------------

/**
 * Expiry condition values for medicine batches.
 */
export type ExpiryStatus = "safe" | "approaching" | "imminent" | "expired";

/**
 * Bahasa Indonesia labels for each expiry status.
 */
export const EXPIRY_STATUS_LABELS: Record<ExpiryStatus, string> = {
  safe: "Aman",
  approaching: "Mendekati Kedaluwarsa",
  imminent: "Segera Kedaluwarsa",
  expired: "Kedaluwarsa",
};

/**
 * Badge tone for each expiry status.
 */
export const EXPIRY_STATUS_TONES: Record<ExpiryStatus, StatusTone> = {
  safe: "success",
  approaching: "warning",
  imminent: "danger",
  expired: "danger",
};

// ---------------------------------------------------------------------------
// Medicine status
// ---------------------------------------------------------------------------

/**
 * Medicine master-data status values.
 */
export type MedicineStatus = "active" | "discontinued" | "pending_review";

/**
 * Bahasa Indonesia labels for each medicine status.
 */
export const MEDICINE_STATUS_LABELS: Record<MedicineStatus, string> = {
  active: "Aktif",
  discontinued: "Dihentikan",
  pending_review: "Menunggu Tinjauan",
};

/**
 * Badge tone for each medicine status.
 */
export const MEDICINE_STATUS_TONES: Record<MedicineStatus, StatusTone> = {
  active: "success",
  discontinued: "neutral",
  pending_review: "warning",
};

// ---------------------------------------------------------------------------
// Prescription status
// ---------------------------------------------------------------------------

/**
 * Prescription review status values.
 */
export type PrescriptionStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "rejected"
  | "needs_revision";

/**
 * Bahasa Indonesia labels for each prescription status.
 */
export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  pending: "Menunggu Verifikasi",
  reviewing: "Sedang Ditinjau",
  approved: "Disetujui",
  rejected: "Ditolak",
  needs_revision: "Perlu Perbaikan",
};

/**
 * Badge tone for each prescription status.
 */
export const PRESCRIPTION_STATUS_TONES: Record<PrescriptionStatus, StatusTone> =
  {
    pending: "warning",
    reviewing: "info",
    approved: "success",
    rejected: "danger",
    needs_revision: "warning",
  };

// ---------------------------------------------------------------------------
// Order status
// ---------------------------------------------------------------------------

/**
 * Order lifecycle status values.
 */
export type OrderStatus =
  | "DRAFT"
  | "AWAITING_PRESCRIPTION"
  | "PRESCRIPTION_REVIEW"
  | "PRESCRIPTION_REJECTED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_PENDING"
  | "PAID"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "EXPIRED";

/**
 * Bahasa Indonesia labels for each order status.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Draf",
  AWAITING_PRESCRIPTION: "Menunggu Resep",
  PRESCRIPTION_REVIEW: "Tinjauan Resep",
  PRESCRIPTION_REJECTED: "Resep Ditolak",
  AWAITING_PAYMENT: "Menunggu Pembayaran",
  PAYMENT_PENDING: "Pembayaran Diproses",
  PAID: "Dibayar",
  PROCESSING: "Diproses",
  READY_FOR_PICKUP: "Siap Diambil",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  REFUNDED: "Dikembalikan",
  EXPIRED: "Kedaluwarsa",
};

/**
 * Badge tone for each order status.
 */
export const ORDER_STATUS_TONES: Record<OrderStatus, StatusTone> = {
  DRAFT: "neutral",
  AWAITING_PRESCRIPTION: "warning",
  PRESCRIPTION_REVIEW: "info",
  PRESCRIPTION_REJECTED: "danger",
  AWAITING_PAYMENT: "warning",
  PAYMENT_PENDING: "warning",
  PAID: "info",
  PROCESSING: "primary",
  READY_FOR_PICKUP: "success",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELLED: "neutral",
  REFUNDED: "neutral",
  EXPIRED: "neutral",
};

// ---------------------------------------------------------------------------
// Payment status
// ---------------------------------------------------------------------------

/**
 * Payment lifecycle status values.
 */
export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED";

/**
 * Bahasa Indonesia labels for each payment status.
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Menunggu",
  SUCCESS: "Berhasil",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  REFUNDED: "Dikembalikan",
};

/**
 * Badge tone for each payment status.
 */
export const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
  EXPIRED: "neutral",
  REFUNDED: "info",
};

// ---------------------------------------------------------------------------
// Transfer status (kept for backward compatibility with warehouse code)
// ---------------------------------------------------------------------------

/**
 * Transfer / stock-movement status values.
 */
export type TransferStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

/**
 * Bahasa Indonesia labels for each transfer status.
 */
export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  DRAFT: "Draf",
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  FAILED: "Gagal",
};

/**
 * Badge tone for each transfer status.
 */
export const TRANSFER_STATUS_TONES: Record<TransferStatus, StatusTone> = {
  DRAFT: "neutral",
  PENDING: "warning",
  APPROVED: "info",
  COMPLETED: "success",
  CANCELLED: "neutral",
  FAILED: "danger",
};

// ---------------------------------------------------------------------------
// Job / queue status
// ---------------------------------------------------------------------------

/**
 * Background job status values.
 */
export type JobStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "stalled";

/**
 * Bahasa Indonesia labels for each job status.
 */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  idle: "Idle",
  running: "Berjalan",
  completed: "Selesai",
  failed: "Gagal",
  stalled: "Berhenti",
};

/**
 * Badge tone for each job status.
 */
export const JOB_STATUS_TONES: Record<JobStatus, StatusTone> = {
  idle: "neutral",
  running: "info",
  completed: "success",
  failed: "danger",
  stalled: "warning",
};

// ---------------------------------------------------------------------------
// System health status
// ---------------------------------------------------------------------------

/**
 * Service health status values.
 */
export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

/**
 * Bahasa Indonesia labels for each health status.
 */
export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: "Sehat",
  degraded: "Menurun",
  down: "Bermasalah",
  unknown: "Tidak Diketahui",
};

/**
 * Badge tone for each health status.
 */
export const HEALTH_STATUS_TONES: Record<HealthStatus, StatusTone> = {
  healthy: "success",
  degraded: "warning",
  down: "danger",
  unknown: "neutral",
};

// ---------------------------------------------------------------------------
// Alert severity
// ---------------------------------------------------------------------------

/**
 * Alert severity levels used in AlertCard and notification items.
 */
export type AlertSeverity = "critical" | "warning" | "info" | "success";

/**
 * Bahasa Indonesia labels for each alert severity.
 */
export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: "Kritis",
  warning: "Peringatan",
  info: "Info",
  success: "Sukses",
};

/**
 * Badge tone for each alert severity.
 */
export const ALERT_SEVERITY_TONES: Record<AlertSeverity, StatusTone> = {
  critical: "danger",
  warning: "warning",
  info: "info",
  success: "success",
};

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/**
 * Accessible copy strings for navigation landmarks.
 */
export const NAVIGATION_COPY = {
  main: "Menu utama",
  collapseLabel: "Tutup sidebar",
  expandLabel: "Buka sidebar",
} as const;

/**
 * Section group labels shown in the sidebar.
 */
export const NAVIGATION_SECTION_LABELS = {
  utama: "UTAMA",
  penjualan: "PENJUALAN",
  farmasi: "FARMASI",
  persediaan: "PERSEDIAAN",
  pelanggan: "PELANGGAN",
  laporan: "LAPORAN",
  sistem: "SISTEM",
  /** @deprecated kept for backward compat with SmartStock Pro code */
  inventory: "INVENTORI",
  /** @deprecated kept for backward compat with SmartStock Pro code */
  operations: "OPERASIONAL",
  /** @deprecated kept for backward compat with SmartStock Pro code */
  system: "SISTEM",
} as const;

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

/**
 * Copy strings for Dialog components.
 */
export const DIALOG_COPY = {
  close: "Tutup dialog",
  cancel: "Batal",
  confirm: "Konfirmasi",
} as const;

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

/**
 * Default copy strings for EmptyState.
 */
export const EMPTY_STATE_COPY = {
  title: "Belum ada data",
  description: "Data belum tersedia saat ini.",
  actionLabel: "Tambah Data",
} as const;

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

/**
 * Default copy strings for ErrorState.
 */
export const ERROR_STATE_COPY = {
  title: "Terjadi kesalahan",
  description: "Data gagal dimuat. Coba muat ulang halaman.",
  actionLabel: "Coba Lagi",
} as const;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Copy strings for Pagination component.
 */
export const PAGINATION_COPY = {
  label: "Navigasi halaman",
  previous: "Sebelumnya",
  next: "Berikutnya",
} as const;

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

/**
 * Accessible copy for Tabs tablist.
 */
export const TABS_COPY = {
  label: "Tab navigasi",
} as const;

// ---------------------------------------------------------------------------
// Action menu
// ---------------------------------------------------------------------------

/**
 * Default aria-label for the more-actions trigger.
 */
export const ACTION_MENU_COPY = {
  label: "Opsi lainnya",
} as const;

// ---------------------------------------------------------------------------
// Import stepper
// ---------------------------------------------------------------------------

/**
 * Human-readable labels for each step state.
 */
export const STEPPER_STATUS_LABELS = {
  pending: "Menunggu",
  current: "Sedang Berjalan",
  completed: "Selesai",
  error: "Gagal",
} as const;

// ---------------------------------------------------------------------------
// Queue status card
// ---------------------------------------------------------------------------

/**
 * Copy strings used in QueueStatusCard.
 */
export const QUEUE_STATUS_COPY = {
  waitingSuffix: "menunggu",
} as const;

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

/**
 * Copy strings used in Progress component.
 */
export const PROGRESS_COPY = {
  label: "Progres",
  complete: "selesai",
} as const;
