import type { ComponentPropsWithoutRef } from "react";

import { QUEUE_STATUS_COPY, type JobStatus } from "@/constants/design";
import { mc } from "@/utils/mc";

import { Card } from "./card";
import { Progress } from "./progress";
import { JobStatusBadge } from "./status-badge";

/**
 * Props for queue status cards.
 */
export type QueueStatusCardProps = ComponentPropsWithoutRef<"article"> & {
  progressLabel?: string;
  progressValue?: number;
  queueName: string;
  status: JobStatus;
  waitingCount: number;
};

/**
 * Queue card for import, report, alert, sync, and notification jobs.
 */
export function QueueStatusCard({
  className,
  progressLabel,
  progressValue = 0,
  queueName,
  status,
  waitingCount,
  ...props
}: QueueStatusCardProps) {
  return (
    <Card className={mc("grid gap-4 p-4", className)} {...props}>
      <header className="flex items-start justify-between gap-3">
        <section className="grid gap-1">
          <h3 className="ts-sm font-semibold text-text-strong">{queueName}</h3>
          <p className="ts-xs text-text-muted">
            {waitingCount} {QUEUE_STATUS_COPY.waitingSuffix}
          </p>
        </section>
        <JobStatusBadge status={status} />
      </header>
      <Progress label={progressLabel} showValue value={progressValue} />
    </Card>
  );
}
