import "server-only";

/**
 * Request metadata stored in audit logs and sessions.
 */
export type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

/**
 * Extracts IP address and user agent from a request.
 */
export function getRequestContext(request: Request): RequestContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  const ipAddress =
    firstForwardedIp ?? request.headers.get("x-real-ip") ?? null;

  return {
    ipAddress,
    userAgent: request.headers.get("user-agent"),
  };
}
