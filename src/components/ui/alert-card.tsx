"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import {
  ALERT_SEVERITY_LABELS,
  ALERT_SEVERITY_TONES,
  type AlertSeverity,
} from "@/constants/design";
import { mc } from "@/utils/mc";

import { Badge } from "./badge";
import { Button, ButtonLink } from "./button";

/**
 * Props for operational alert cards.
 */
export type AlertCardProps = ComponentPropsWithoutRef<"article"> & {
  actionHref?: string;
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  severity: AlertSeverity;
  title: string;
};

/**
 * Alert card for critical stock, failed jobs, transfer failures, and system health issues.
 */
export function AlertCard({
  actionHref,
  actionLabel,
  className,
  message,
  onAction,
  severity,
  title,
  ...props
}: AlertCardProps) {
  let actionNode: ReactNode = null;

  if (actionLabel && actionHref) {
    actionNode = (
      <ButtonLink href={actionHref} size="sm" variant="secondary">
        {actionLabel}
      </ButtonLink>
    );
  } else if (actionLabel && onAction) {
    actionNode = (
      <Button onClick={onAction} size="sm" variant="secondary">
        {actionLabel}
      </Button>
    );
  }

  return (
    <article
      className={mc(
        "grid gap-3 rounded-xl border border-border-default bg-card-surface p-4 shadow-sm",
        className,
      )}
      {...props}
    >
      <header className="flex items-start justify-between gap-3">
        <section className="grid gap-1">
          <h3 className="ts-sm font-semibold text-text-strong">{title}</h3>
          <p className="ts-sm text-text-muted">{message}</p>
        </section>
        <Badge showDot tone={ALERT_SEVERITY_TONES[severity]}>
          {ALERT_SEVERITY_LABELS[severity]}
        </Badge>
      </header>
      {actionNode}
    </article>
  );
}
