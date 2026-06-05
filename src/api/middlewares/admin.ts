import "server-only";

import { requireRole, requireSession } from "./session";

/**
 * Requires an authenticated Admin session.
 */
export async function requireAdmin(request: Request) {
  const session = await requireSession(request);
  requireRole(session, ["ADMIN"]);

  return session;
}
