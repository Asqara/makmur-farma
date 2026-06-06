import {
  EMAIL_VERIFICATION_TTL_SECONDS,
  SESSION_ABSOLUTE_TIMEOUT_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
} from "./auth";

function numberFromEnv(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

/**
 * Centralized environment configuration.
 */
export const ENV = {
  appPublicUrl:
    process.env.APP_PUBLIC_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000",
  appTimezone: process.env.APP_TIMEZONE ?? "Asia/Jakarta",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://user:pass@localhost:5432/makmur_farma",
  databaseReadUrl:
    process.env.DATABASE_URL_READ ??
    process.env.DATABASE_URL ??
    "postgres://user:pass@localhost:5432/makmur_farma",
  redisUrl: process.env.REDIS_URL,
  smtp: {
    fromEmail:
      process.env.SMTP_FROM_EMAIL ??
      process.env.SMTP_FROM ??
      "no-reply@makmur-farma.local",
    fromName: process.env.SMTP_FROM_NAME ?? "Makmur Farma",
    host: process.env.SMTP_HOST,
    password: process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS,
    port: numberFromEnv(process.env.SMTP_PORT, 587),
    username: process.env.SMTP_USERNAME ?? process.env.SMTP_USER,
  },
  auth: {
    emailVerificationTtlSeconds: numberFromEnv(
      process.env.AUTH_EMAIL_VERIFICATION_TTL_MINUTES,
      EMAIL_VERIFICATION_TTL_SECONDS / 60,
    ) * 60,
    sessionAbsoluteTimeoutSeconds: numberFromEnv(
      process.env.AUTH_SESSION_ABSOLUTE_TIMEOUT_HOURS,
      SESSION_ABSOLUTE_TIMEOUT_SECONDS / 3600,
    ) * 3600,
    sessionIdleTimeoutSeconds: numberFromEnv(
      process.env.AUTH_SESSION_IDLE_TIMEOUT_MINUTES,
      SESSION_IDLE_TIMEOUT_SECONDS / 60,
    ) * 60,
  },
  /**
   * Enables API documentation UI and raw OpenAPI JSON.
   * Defaults to enabled for local assessment/demo unless set to "false".
   */
  enableApiDocs: process.env.ENABLE_API_DOCS !== "false",
  /**
   * When true, the QRIS payment simulator endpoints are active.
   * Set ENABLE_PAYMENT_SIMULATOR=true in development/demo environments only.
   * Never enable in production.
   */
  enablePaymentSimulator: process.env.ENABLE_PAYMENT_SIMULATOR === "true",
} as const;
