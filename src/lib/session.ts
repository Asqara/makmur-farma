import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import {
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/constants/cookies";
import {
  CSRF_HEADER_NAME,
  SESSION_ABSOLUTE_TIMEOUT_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
} from "@/constants/auth";
import { parseCookieHeader } from "@/utils/cookies";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

type CookieOptions = {
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict";
  secure?: boolean;
};

function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions,
): string {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  return parts.join("; ");
}

/**
 * Creates a random token for session or CSRF use.
 */
export function createSecurityToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hashes tokens before database persistence.
 */
export function hashSecurityToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Compares two token hashes without leaking timing information.
 */
export function safeCompareHash(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * Reads session token from a request cookie.
 */
export function getSessionTokenFromRequest(request: Request): string | null {
  const cookies = parseCookieHeader(request.headers.get("cookie"));

  return cookies[SESSION_COOKIE_NAME] ?? null;
}

/**
 * Reads CSRF token from a request header or cookie.
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  const cookies = parseCookieHeader(request.headers.get("cookie"));

  return (
    request.headers.get(CSRF_HEADER_NAME) ??
    cookies[CSRF_COOKIE_NAME] ??
    null
  );
}

/**
 * Creates cookies for a new authenticated session.
 */
export function createAuthCookies(sessionToken: string, csrfToken: string) {
  return [
    serializeCookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      maxAge: SESSION_ABSOLUTE_TIMEOUT_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: IS_PRODUCTION,
    }),
    serializeCookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      maxAge: SESSION_IDLE_TIMEOUT_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: IS_PRODUCTION,
    }),
  ];
}

/**
 * Creates expired cookies for logout.
 */
export function createClearAuthCookies() {
  return [
    serializeCookie(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: IS_PRODUCTION,
    }),
    serializeCookie(CSRF_COOKIE_NAME, "", {
      httpOnly: false,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: IS_PRODUCTION,
    }),
  ];
}
