import type { Permission, UserRole, UserStatus } from "@/constants/auth";
import type { UserRow } from "@/drizzle-schema";
import type { RequestContext } from "@/lib/request";
import { getPermissionsForRole } from "@/utils/permissions";

/**
 * Safe user shape returned to frontend and API clients.
 */
export type PublicUser = {
  createdAt: Date;
  email: string;
  emailVerifiedAt: Date | null;
  fullName: string;
  id: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  name: string;
  phone: string | null;
  permissions: Permission[];
  role: UserRole;
  status: UserStatus;
  updatedAt: Date;
};

/**
 * Authenticated request session data.
 */
export type AuthSession = {
  absoluteExpiresAt: Date;
  csrfTokenHash: string;
  id: string;
  idleExpiresAt: Date;
  lastActivityAt: Date;
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
  const permissions = getPermissionsForRole(user.role);

  return {
    createdAt: user.createdAt,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    fullName: user.fullName,
    id: user.id,
    isActive: user.status === "ACTIVE" && user.isActive,
    lastLoginAt: user.lastLoginAt,
    name: user.fullName,
    permissions,
    phone: user.phone,
    role: user.role,
    status: user.status,
    updatedAt: user.updatedAt,
  };
}
