import {
  ROLE_PERMISSIONS,
  type Permission,
  type UserRole,
} from "@/constants/auth";

/**
 * Returns permissions assigned to one role.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Checks whether one role has a permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
