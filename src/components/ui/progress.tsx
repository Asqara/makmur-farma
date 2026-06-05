import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { PROGRESS_COPY } from "@/constants/design";
import { mc } from "@/utils/mc";

/**
 * Props for progress indicators.
 */
export type ProgressProps = Omit<
  ComponentPropsWithoutRef<"progress">,
  "max" | "value"
> & {
  label?: string;
  max?: number;
  showValue?: boolean;
  value: number;
};

/**
 * Accessible progress bar for import, report, and queue jobs.
 */
export function Progress({
  className,
  label = PROGRESS_COPY.label,
  max = 100,
  showValue = false,
  value,
  ...props
}: ProgressProps) {
  const safeMax = Math.max(max, 1);
  const normalizedValue = Math.min(Math.max(value, 0), safeMax);
  const percentage = Math.round((normalizedValue / safeMax) * 100);

  let valueNode: ReactNode = null;

  if (showValue) {
    valueNode = (
      <span className="ts-xs text-text-muted">
        {percentage}% {PROGRESS_COPY.complete}
      </span>
    );
  }

  return (
    <section className="grid gap-2" aria-label={label}>
      <header className="flex items-center justify-between gap-3">
        <span className="ts-xs font-medium text-text-strong">{label}</span>
        {valueNode}
      </header>
      <progress
        aria-valuetext={`${percentage}%`}
        className={mc("ssp-progress", className)}
        max={safeMax}
        value={normalizedValue}
        {...props}
      />
    </section>
  );
}
