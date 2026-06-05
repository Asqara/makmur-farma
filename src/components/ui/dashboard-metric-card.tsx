import type { ComponentPropsWithoutRef, ReactNode } from "react";

import {
  STATUS_TONE_CLASS_NAMES,
  type StatusTone,
} from "@/constants/design";
import { mc } from "@/utils/mc";

import { Card } from "./card";

/**
 * Props for dashboard KPI metric cards.
 */
export type DashboardMetricCardProps = ComponentPropsWithoutRef<"article"> & {
  helperText?: string;
  icon?: ReactNode;
  title: string;
  tone?: StatusTone;
  value: ReactNode;
};

/**
 * KPI card for total products, stock value, critical stock, and pending transfer counts.
 */
export function DashboardMetricCard({
  className,
  helperText,
  icon,
  title,
  tone = "info",
  value,
  ...props
}: DashboardMetricCardProps) {
  let iconNode: ReactNode = null;

  if (icon) {
    iconNode = (
      <span
        aria-hidden="true"
        className={mc(
          "inline-flex size-8 items-center justify-center rounded-full border [&>svg]:size-3",
          STATUS_TONE_CLASS_NAMES[tone],
        )}
      >
        {icon}
      </span>
    );
  }

  let helperNode: ReactNode = null;

  if (helperText) {
    helperNode = <p className="ts-xs text-text-muted">{helperText}</p>;
  }

  return (
    <Card className={mc("p-4 sm:p-5", className)} {...props}>
      <header className="flex items-start justify-between gap-4">
        <section className="grid min-w-0 gap-2">
          <p className="ts-sm font-medium text-text-muted">{title}</p>
          <strong className="ts-2xl break-words text-text-strong">{value}</strong>
        </section>
        {iconNode}
      </header>
      {helperNode}
    </Card>
  );
}
