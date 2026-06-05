import type { Permission, UserRole } from "@/constants/auth";
import type { UserRow } from "@/drizzle-schema";
import type { RequestContext } from "@/lib/request";

/**
 * Safe user shape returned to frontend and API clients.
 */
export type PublicUser = {
  createdAt: Date;
  email: string;
  id: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  name: string;
  permissions: Permission[];
  role: UserRole;
  updatedAt: Date;
};

/**
 * Authenticated request session data.
 */
export type AuthSession = {
  csrfTokenHash: string;
  expiresAt: Date;
  id: string;
  idleExpiresAt: Date;
  permissions: Permission[];
  user: PublicUser;
  userId: string;
};

/**
 * Audit context attached to user actions.
 */
export type AuditContext = RequestContext & {
  actorUserId?: string | null;
};

/**
 * Converts a database user row to public API shape.
 */
export function toPublicUser(user: UserRow): PublicUser {
  return {
    createdAt: user.createdAt,
    email: user.email,
    id: user.id,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    name: user.name,
    permissions: [],
    role: user.role,
    updatedAt: user.updatedAt,
  };
}
