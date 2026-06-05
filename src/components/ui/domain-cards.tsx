import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Package,
  ShoppingCart,
} from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { mc } from "@/utils/mc";

import { ButtonLink } from "./button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { ExpiryStatusBadge } from "./status-badge";

// ---------------------------------------------------------------------------
// PrescriptionQueueCard
// ---------------------------------------------------------------------------

export type PrescriptionQueueCardProps = ComponentPropsWithoutRef<"article"> & {
  loading?: boolean;
  oldestAgeMinutes?: number;
  reviewHref?: string;
  totalPending: number;
};

/**
 * Dashboard card for the pharmacist prescription review queue.
 * Shows total pending count and how long the oldest prescription has been waiting.
 */
export function PrescriptionQueueCard({
  className,
  loading,
  oldestAgeMinutes,
  reviewHref,
  totalPending,
  ...props
}: PrescriptionQueueCardProps) {
  let waitNode: ReactNode = null;

  if (oldestAgeMinutes !== undefined && oldestAgeMinutes > 0) {
    const hours = Math.floor(oldestAgeMinutes / 60);
    const mins = oldestAgeMinutes % 60;
    const label =
      hours > 0
        ? `Paling lama ${hours} jam ${mins > 0 ? `${mins} menit` : ""} menunggu`
        : `Paling lama ${mins} menit menunggu`;

    waitNode = (
      <p className="ts-xs text-warning" role="status">
        {label}
      </p>
    );
  }

  return (
    <Card className={mc("flex flex-col", className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList aria-hidden="true" className="size-4 text-text-muted" />
          Antrean Resep
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {loading ? (
          <span className="block h-8 w-16 animate-pulse rounded-md bg-muted-surface" />
        ) : (
          <>
            <p className="ts-4xl font-bold text-text-strong tabular-nums">
              {totalPending}
            </p>
            <p className="ts-xs text-text-muted">resep menunggu verifikasi</p>
            {waitNode}
          </>
        )}
      </CardContent>
      {reviewHref && (
        <CardFooter className="justify-end">
          <ButtonLink href={reviewHref} size="sm" variant="soft">
            Tinjau Sekarang
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </ButtonLink>
        </CardFooter>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// RecentOrdersList
// ---------------------------------------------------------------------------

export type RecentOrderItem = {
  customerName: string;
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  time: string;
};

export type RecentOrdersListProps = ComponentPropsWithoutRef<"article"> & {
  items: RecentOrderItem[];
  loading?: boolean;
  viewAllHref?: string;
};

/**
 * Dashboard card listing the most recent orders with customer, total, and status.
 */
export function RecentOrdersList({
  className,
  items,
  loading,
  viewAllHref,
  ...props
}: RecentOrdersListProps) {
  let contentNode: ReactNode;

  if (loading) {
    contentNode = (
      <ul className="grid gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <li className="flex items-center gap-3" key={i}>
            <span className="block size-9 animate-pulse rounded-full bg-muted-surface" />
            <span className="grid flex-1 gap-1">
              <span className="block h-3.5 w-28 animate-pulse rounded-md bg-muted-surface" />
              <span className="block h-3 w-20 animate-pulse rounded-md bg-muted-surface" />
            </span>
            <span className="block h-3.5 w-14 animate-pulse rounded-md bg-muted-surface" />
          </li>
        ))}
      </ul>
    );
  } else if (items.length === 0) {
    contentNode = (
      <p className="ts-sm py-4 text-center text-text-muted">
        Belum ada pesanan hari ini.
      </p>
    );
  } else {
    contentNode = (
      <ul className="grid gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <article className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-hover-surface">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-blue-soft text-primary-blue ts-xs font-semibold uppercase"
              >
                {item.customerName.slice(0, 2)}
              </span>
              <section className="min-w-0 flex-1">
                <p className="ts-sm truncate font-medium text-text-strong">
                  {item.customerName}
                </p>
                <p className="ts-mono-xs truncate text-text-muted">
                  {item.orderNumber}
                </p>
              </section>
              <section className="shrink-0 text-right">
                <p className="ts-sm font-medium text-text-strong">{item.total}</p>
                <p className="ts-xs text-text-muted">{item.time}</p>
              </section>
            </article>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card className={mc("flex flex-col", className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart aria-hidden="true" className="size-4 text-text-muted" />
          Pesanan Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">{contentNode}</CardContent>
      {viewAllHref && (
        <CardFooter className="justify-center">
          <ButtonLink href={viewAllHref} size="sm" variant="ghost">
            Lihat semua pesanan
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </ButtonLink>
        </CardFooter>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CriticalStockCard
// ---------------------------------------------------------------------------

export type CriticalStockItem = {
  currentQty: number;
  id: string;
  medicineName: string;
  minThreshold: number;
  unit: string;
};

export type CriticalStockCardProps = ComponentPropsWithoutRef<"article"> & {
  items: CriticalStockItem[];
  loading?: boolean;
  viewAllHref?: string;
};

/**
 * Dashboard card listing medicines with critical or zero stock that need immediate attention.
 */
export function CriticalStockCard({
  className,
  items,
  loading,
  viewAllHref,
  ...props
}: CriticalStockCardProps) {
  let contentNode: ReactNode;

  if (loading) {
    contentNode = (
      <ul className="grid gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <li className="flex items-center justify-between gap-3" key={i}>
            <span className="block h-3.5 w-36 animate-pulse rounded-md bg-muted-surface" />
            <span className="block h-3.5 w-16 animate-pulse rounded-md bg-muted-surface" />
          </li>
        ))}
      </ul>
    );
  } else if (items.length === 0) {
    contentNode = (
      <section className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle2
          aria-hidden="true"
          className="size-8 text-success"
        />
        <p className="ts-sm text-text-muted">
          Semua stok obat dalam kondisi baik.
        </p>
      </section>
    );
  } else {
    contentNode = (
      <ul className="grid gap-2">
        {items.map((item) => (
          <li
            className="flex items-center justify-between gap-3 rounded-lg border border-danger-border bg-danger-bg px-3 py-2"
            key={item.id}
          >
            <p className="ts-sm min-w-0 truncate font-medium text-text-strong">
              {item.medicineName}
            </p>
            <section className="shrink-0 text-right">
              <p className="ts-sm font-semibold text-danger tabular-nums">
                {item.currentQty} {item.unit}
              </p>
              <p className="ts-xs text-text-muted">
                min {item.minThreshold} {item.unit}
              </p>
            </section>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card className={mc("flex flex-col", className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle
            aria-hidden="true"
            className="size-4 text-danger"
          />
          Stok Kritis
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">{contentNode}</CardContent>
      {viewAllHref && items.length > 0 && (
        <CardFooter className="justify-end">
          <ButtonLink href={viewAllHref} size="sm" variant="secondary">
            Lihat semua
          </ButtonLink>
        </CardFooter>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ExpiryAlertCard
// ---------------------------------------------------------------------------

export type ExpiryAlertItem = {
  batchNumber: string;
  daysRemaining: number;
  expiryDate: string;
  id: string;
  medicineName: string;
  quantity: number;
  unit: string;
};

export type ExpiryAlertCardProps = ComponentPropsWithoutRef<"article"> & {
  items: ExpiryAlertItem[];
  loading?: boolean;
  viewAllHref?: string;
};

/**
 * Dashboard card listing medicine batches nearing or past expiry date.
 */
export function ExpiryAlertCard({
  className,
  items,
  loading,
  viewAllHref,
  ...props
}: ExpiryAlertCardProps) {
  function getExpiryStatus(
    days: number,
  ): "approaching" | "expired" | "imminent" {
    if (days < 0) return "expired";
    if (days <= 7) return "imminent";
    return "approaching";
  }

  let contentNode: ReactNode;

  if (loading) {
    contentNode = (
      <ul className="grid gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <li className="flex items-center justify-between gap-3" key={i}>
            <span className="block h-3.5 w-36 animate-pulse rounded-md bg-muted-surface" />
            <span className="block h-3.5 w-16 animate-pulse rounded-md bg-muted-surface" />
          </li>
        ))}
      </ul>
    );
  } else if (items.length === 0) {
    contentNode = (
      <section className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle2
          aria-hidden="true"
          className="size-8 text-success"
        />
        <p className="ts-sm text-text-muted">
          Tidak ada obat yang mendekati kedaluwarsa.
        </p>
      </section>
    );
  } else {
    contentNode = (
      <ul className="grid gap-2">
        {items.map((item) => (
          <li
            className="flex min-w-0 items-center justify-between gap-3"
            key={item.id}
          >
            <section className="min-w-0">
              <p className="ts-sm truncate font-medium text-text-strong">
                {item.medicineName}
              </p>
              <p className="ts-mono-xs truncate text-text-muted">
                {item.batchNumber}
              </p>
            </section>
            <section className="shrink-0 text-right">
              <ExpiryStatusBadge status={getExpiryStatus(item.daysRemaining)} />
              <p className="ts-xs mt-1 text-text-muted">{item.expiryDate}</p>
            </section>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card className={mc("flex flex-col", className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock
            aria-hidden="true"
            className="size-4 text-warning"
          />
          Kedaluwarsa Mendatang
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">{contentNode}</CardContent>
      {viewAllHref && items.length > 0 && (
        <CardFooter className="justify-end">
          <ButtonLink href={viewAllHref} size="sm" variant="secondary">
            Lihat semua batch
          </ButtonLink>
        </CardFooter>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// OrderTimeline
// ---------------------------------------------------------------------------

export type OrderTimelineEvent = {
  actor?: string;
  id: string;
  label: string;
  note?: string;
  status: "completed" | "current" | "failed" | "pending";
  time?: string;
};

export type OrderTimelineProps = ComponentPropsWithoutRef<"ol"> & {
  events: OrderTimelineEvent[];
};

const TIMELINE_STATUS_CLASSES = {
  completed: "bg-success text-text-inverse",
  current: "bg-primary-blue text-text-inverse",
  failed: "bg-danger text-text-inverse",
  pending: "bg-muted-surface text-text-muted border border-border-default",
} as const;

/**
 * Vertical timeline for order status history.
 * Each event includes status, label, time, actor, and optional note.
 */
export function OrderTimeline({
  className,
  events,
  ...props
}: OrderTimelineProps) {
  return (
    <ol className={mc("grid gap-0", className)} {...props}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;

        return (
          <li className="flex gap-4" key={event.id}>
            {/* Connector column */}
            <section className="flex flex-col items-center">
              <span
                className={mc(
                  "flex size-8 shrink-0 items-center justify-center rounded-full ts-xs font-semibold",
                  TIMELINE_STATUS_CLASSES[event.status],
                )}
              >
                {index + 1}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="w-px flex-1 bg-border-default my-1"
                />
              )}
            </section>

            {/* Content column */}
            <section className={mc("min-w-0 pb-6", isLast && "pb-0")}>
              <p
                className={mc(
                  "ts-sm font-medium",
                  event.status === "current"
                    ? "text-primary-blue"
                    : event.status === "failed"
                      ? "text-danger"
                      : event.status === "completed"
                        ? "text-text-strong"
                        : "text-text-muted",
                )}
              >
                {event.label}
              </p>
              {event.time && (
                <p className="ts-xs text-text-muted">{event.time}</p>
              )}
              {event.actor && (
                <p className="ts-xs text-text-muted">Oleh: {event.actor}</p>
              )}
              {event.note && (
                <p className="ts-xs mt-1 rounded-md bg-muted-surface px-3 py-2 text-text-default">
                  {event.note}
                </p>
              )}
            </section>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// StockSummary
// ---------------------------------------------------------------------------

export type StockSummaryProps = ComponentPropsWithoutRef<"section"> & {
  available: number;
  nearestExpiry?: string;
  reserved: number;
  threshold?: number;
  total: number;
  unit: string;
};

/**
 * Compact stock summary strip for the medicine detail page.
 * Shows total, available, reserved, minimum threshold, and nearest expiry.
 */
export function StockSummary({
  available,
  className,
  nearestExpiry,
  reserved,
  threshold,
  total,
  unit,
  ...props
}: StockSummaryProps) {
  const items: Array<{ label: string; value: string }> = [
    {
      label: "Total",
      value: `${total.toLocaleString("id-ID")} ${unit}`,
    },
    {
      label: "Tersedia",
      value: `${available.toLocaleString("id-ID")} ${unit}`,
    },
    {
      label: "Dipesan",
      value: `${reserved.toLocaleString("id-ID")} ${unit}`,
    },
  ];

  if (threshold !== undefined) {
    items.push({
      label: "Stok Minimum",
      value: `${threshold.toLocaleString("id-ID")} ${unit}`,
    });
  }

  if (nearestExpiry) {
    items.push({ label: "Kedaluwarsa Terdekat", value: nearestExpiry });
  }

  return (
    <section
      className={mc(
        "grid grid-cols-2 gap-3 rounded-xl border border-border-default bg-muted-surface p-4 sm:grid-cols-3 lg:grid-cols-5",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <section className="grid gap-0.5" key={item.label}>
          <p className="ts-xs text-text-muted">{item.label}</p>
          <p className="ts-sm font-semibold text-text-strong tabular-nums">
            {item.value}
          </p>
        </section>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// PrescriptionDocumentPlaceholder
// ---------------------------------------------------------------------------

export type PrescriptionDocumentPlaceholderProps =
  ComponentPropsWithoutRef<"section"> & {
    fileName?: string;
    fileSize?: string;
    pageCount?: number;
  };

/**
 * Placeholder for a prescription document viewer.
 * Used on the review page when the actual document viewer is not yet integrated.
 */
export function PrescriptionDocumentPlaceholder({
  className,
  fileName,
  fileSize,
  pageCount,
  ...props
}: PrescriptionDocumentPlaceholderProps) {
  return (
    <section
      className={mc(
        "grid place-items-center rounded-xl border-2 border-dashed border-border-default bg-muted-surface px-6 py-16 text-center",
        className,
      )}
      {...props}
    >
      <section className="grid justify-items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full bg-card-surface text-text-muted shadow-card [&>svg]:size-7"
        >
          <Package />
        </span>
        <header className="grid gap-1">
          {fileName ? (
            <>
              <p className="ts-sm font-semibold text-text-strong">{fileName}</p>
              <p className="ts-xs text-text-muted">
                {[fileSize, pageCount ? `${pageCount} halaman` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </>
          ) : (
            <p className="ts-sm text-text-muted">
              Dokumen resep akan tampil di sini.
            </p>
          )}
        </header>
        <p className="ts-xs max-w-xs text-text-muted">
          Akses dokumen ini hanya diizinkan untuk apoteker yang berwenang.
        </p>
      </section>
    </section>
  );
}
