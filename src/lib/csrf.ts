import "server-only";

import { ENV } from "@/constants/config";
import { CsrfError } from "@/lib/errors";
import { getCsrfHeaderFromRequest, hashSecurityToken } from "@/lib/session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getAllowedOrigins(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = new URL(ENV.appPublicUrl).origin;

  return new Set([requestOrigin, configuredOrigin]);
}

function assertHeaderOrigin(
  allowedOrigins: Set<string>,
  headerValue: string | null,
) {
  if (!headerValue) {
    return;
  }

  try {
    const origin = new URL(headerValue).origin;

    if (!allowedOrigins.has(origin)) {
      throw new CsrfError();
    }
  } catch (error) {
    if (error instanceof CsrfError) {
      throw error;
    }

    throw new CsrfError();
  }
}

/**
 * Validates Origin/Referer for cookie-backed public auth mutations.
 */
export function assertSafeMutationOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return;
  }

  const allowedOrigins = getAllowedOrigins(request);

  assertHeaderOrigin(allowedOrigins, request.headers.get("origin"));
  assertHeaderOrigin(allowedOrigins, request.headers.get("referer"));
}

/**
 * Validates same-origin and session-bound CSRF header for authenticated writes.
 */
export function assertSessionCsrf(request: Request, csrfTokenHash: string) {
  assertSafeMutationOrigin(request);

  const csrfToken = getCsrfHeaderFromRequest(request);

  if (!csrfToken) {
    throw new CsrfError();
  }

  if (hashSecurityToken(csrfToken) !== csrfTokenHash) {
    throw new CsrfError();
  }
}
