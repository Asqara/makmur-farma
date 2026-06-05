import "server-only";

import { Queue, Worker, type JobsOptions, type Processor } from "bullmq";
import IORedis from "ioredis";

import { ENV } from "@/constants/config";
import { ConfigurationError } from "@/lib/errors";

export const QUEUE_NAMES = {
  imports: "imports",
  maintenance: "maintenance",
  notifications: "notifications",
  reports: "reports",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    delay: 30_000,
    type: "exponential",
  },
  removeOnComplete: {
    age: 7 * 24 * 60 * 60,
    count: 1_000,
  },
  removeOnFail: false,
};

let connection: IORedis | null = null;

function getConnection() {
  if (!ENV.redisUrl) {
    throw new ConfigurationError("REDIS_URL wajib diisi untuk menjalankan worker.");
  }

  connection ??= new IORedis(ENV.redisUrl, {
    maxRetriesPerRequest: null,
  });

  return connection;
}

/**
 * Creates a BullMQ queue with bounded retry defaults.
 */
export function createQueue(name: QueueName) {
  return new Queue(name, {
    connection: getConnection(),
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });
}

/**
 * Creates a worker for one queue. Job payloads must not contain secrets or binaries.
 */
export function createQueueWorker<TPayload extends Record<string, unknown>>(
  name: QueueName,
  processor: Processor<TPayload>,
) {
  return new Worker(name, processor, {
    concurrency: 3,
    connection: getConnection(),
  });
}
