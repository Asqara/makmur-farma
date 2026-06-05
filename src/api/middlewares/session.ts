import "server-only";

import type { Permission, UserRole } from "@/constants/auth";
import { client } from "@/client";
import type { AuthSession } from "@/client/types";
import { ForbiddenError } from "@/lib/errors";
import { getRequestContext } from "@/lib/request";
import { hasPermission } from "@/utils/permissions";

/**
 * Reads and validates the current request session.
 */
export async function requireSession(request: Request): Promise<AuthSession> {
  return client.auth.validateRequestSession(request, getRequestContext(request));
}

/**
 * Requires the current session to have one permission.
 */
export function requirePermission(
  session: AuthSession,
  permission: Permission,
) {
  if (!hasPermission(session.user.role, permission)) {
    throw new ForbiddenError();
  }
}

/**
 * Requires one of the given roles.
 */
export function requireRole(
  session: AuthSession,
  roles: readonly UserRole[],
) {
  if (!roles.includes(session.user.role)) {
    throw new ForbiddenError();
  }
}
