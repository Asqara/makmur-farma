import {
  SESSION_ABSOLUTE_TIMEOUT_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
} from "@/constants/auth";

/**
 * Expiry fields required to evaluate session validity.
 */
export type SessionExpiryInput = {
  expiresAt: Date;
  idleExpiresAt: Date;
  revokedAt: Date | null;
};

/**
 * Creates idle and absolute expiry dates from one timestamp.
 */
export function createSessionExpiry(now = new Date()) {
  return {
    expiresAt: new Date(
      now.getTime() + SESSION_ABSOLUTE_TIMEOUT_SECONDS * 1_000,
    ),
    idleExpiresAt: new Date(
      now.getTime() + SESSION_IDLE_TIMEOUT_SECONDS * 1_000,
    ),
  };
}

/**
 * Checks whether a session can no longer be used.
 */
export function isSessionExpired(
  session: SessionExpiryInput,
  now = new Date(),
): boolean {
  if (session.revokedAt) {
    return true;
  }

  if (session.expiresAt.getTime() <= now.getTime()) {
    return true;
  }

  return session.idleExpiresAt.getTime() <= now.getTime();
}

/**
 * Creates a renewed idle expiry that never exceeds the absolute expiry.
 */
export function renewIdleExpiry(expiresAt: Date, now = new Date()) {
  const nextIdleExpiry = new Date(
    now.getTime() + SESSION_IDLE_TIMEOUT_SECONDS * 1_000,
  );

  if (nextIdleExpiry.getTime() > expiresAt.getTime()) {
    return expiresAt;
  }

  return nextIdleExpiry;
}
