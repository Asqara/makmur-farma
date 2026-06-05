import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { HealthStatus } from "@/constants/design";
import { mc } from "@/utils/mc";

import { Card } from "./card";
import { HealthStatusBadge } from "./status-badge";

/**
 * Props for monitoring health cards.
 */
export type MonitoringHealthCardProps = ComponentPropsWithoutRef<"article"> & {
  description?: string;
  icon?: ReactNode;
  lastChecked: string;
  metric: string;
  serviceName: string;
  status: HealthStatus;
};

/**
 * Compact system health card for API, database, Redis, and worker status.
 */
export function MonitoringHealthCard({
  className,
  description,
  icon,
  lastChecked,
  metric,
  serviceName,
  status,
  ...props
}: MonitoringHealthCardProps) {
  let iconNode: ReactNode = null;

  if (icon) {
    iconNode = (
      <span
        aria-hidden="true"
        className="inline-flex size-10 items-center justify-center rounded-full bg-muted-surface text-text-muted [&>svg]:size-5"
      >
        {icon}
      </span>
    );
  }

  let descriptionNode: ReactNode = null;

  if (description) {
    descriptionNode = <p className="ts-xs text-text-muted">{description}</p>;
  }

  return (
    <Card className={mc("p-4", className)} {...props}>
      <header className="flex items-start justify-between gap-3">
        <section className="grid gap-1">
          <p className="ts-sm font-semibold text-text-strong">{serviceName}</p>
          <HealthStatusBadge status={status} />
        </section>
        {iconNode}
      </header>
      <section className="mt-4 grid gap-1">
        <strong className="ts-lg text-text-strong">{metric}</strong>
        <p className="ts-xs text-text-muted">{lastChecked}</p>
        {descriptionNode}
      </section>
    </Card>
  );
}
