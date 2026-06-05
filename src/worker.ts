import { eq } from "drizzle-orm";

import { jobRuns } from "@/drizzle-schema";
import { db } from "@/lib/db";
import { QUEUE_NAMES, createQueueWorker } from "@/lib/queue";

type WorkerPayload = {
  jobRunId?: string;
};

async function markJobFailed(jobRunId: string | undefined, safeError: string) {
  if (!jobRunId) return;

  await db
    .update(jobRuns)
    .set({
      completedAt: new Date(),
      safeError,
      status: "FAILED",
      updatedAt: new Date(),
    })
    .where(eq(jobRuns.id, jobRunId));
}

async function unsupportedHandler(payload: WorkerPayload, queueName: string) {
  await markJobFailed(
    payload.jobRunId,
    `Handler worker ${queueName} belum dikonfigurasi untuk efek bisnis final.`,
  );
}

/**
 * Makmur Farma worker entry point.
 *
 * The queue runtime is wired with bounded retries and PostgreSQL job status
 * tracking. Domain-specific processors must be attached here before the worker
 * is used to complete reports/imports/notifications in production.
 */
async function main() {
  const workers = [
    createQueueWorker<WorkerPayload>(QUEUE_NAMES.reports, (job) =>
      unsupportedHandler(job.data, QUEUE_NAMES.reports),
    ),
    createQueueWorker<WorkerPayload>(QUEUE_NAMES.imports, (job) =>
      unsupportedHandler(job.data, QUEUE_NAMES.imports),
    ),
    createQueueWorker<WorkerPayload>(QUEUE_NAMES.notifications, (job) =>
      unsupportedHandler(job.data, QUEUE_NAMES.notifications),
    ),
    createQueueWorker<WorkerPayload>(QUEUE_NAMES.maintenance, (job) =>
      unsupportedHandler(job.data, QUEUE_NAMES.maintenance),
    ),
  ];

  console.info(
    `Worker aktif untuk queue: ${workers.map((worker) => worker.name).join(", ")}`,
  );
}

main().catch((error) => {
  console.error("Worker gagal dimulai.", error);
  process.exitCode = 1;
});
