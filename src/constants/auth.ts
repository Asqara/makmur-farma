/**
 * MVP role values used by SmartStock Pro.
 */
export const USER_ROLE_VALUES = [
  
] as const;

/**
 * Permission values used by SmartStock Pro.
 */
export const PERMISSION_VALUES = [
  
] as const;

/**
 * User role union.
 */
export type UserRole = (typeof USER_ROLE_VALUES)[number];

/**
 * Permission union.
 */
export type Permission = (typeof PERMISSION_VALUES)[number];

/**
 * Role labels shown in Bahasa Indonesia.
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  WAREHOUSE_MANAGER: "Manajer Gudang",
  WAREHOUSE_STAFF: "Staf Gudang",
  VIEWER: "Viewer",
};

/**
 * Permission labels shown in admin screens.
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  
};

/**
 * Permission mapping per MVP role.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: PERMISSION_VALUES,
  WAREHOUSE_MANAGER: [
    
  ],
  WAREHOUSE_STAFF: [
    
  ],
  VIEWER: [
    
  ],
};

/**
 * Audit action names used by security-sensitive flows.
 */
export const AUDIT_ACTIONS = {
  ACCESS_DENIED: "ACCESS_DENIED",
  
} as const;

/**
 * Session idle timeout in seconds.
 */
export const SESSION_IDLE_TIMEOUT_SECONDS = 30 * 60;

/**
 * Session absolute timeout in seconds.
 */
export const SESSION_ABSOLUTE_TIMEOUT_SECONDS = 24 * 60 * 60;

/**
 * Login rate limit attempts per window.
 */
export const AUTH_LOGIN_RATE_LIMIT_ATTEMPTS = 10;

/**
 * Login rate limit window in seconds.
 */
export const AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS = 5 * 60;

/**
 * Login rate limit key prefix.
 */
export const AUTH_LOGIN_RATE_LIMIT_KEY_PREFIX = "auth-login";

/**
 * Fallback IP label for missing request IP.
 */
export const AUTH_LOGIN_RATE_LIMIT_UNKNOWN_IP = "unknown";

/**
 * CSRF header required on mutation requests after login.
 */
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Demo password for local seed users only.
 */
export const DEMO_USER_PASSWORD = "Demo#12345";

/**
 * Argon2 password hash options shared by auth and seed flows.
 */
export const PASSWORD_HASH_OPTIONS = {
  memoryCost: 19_456,
  outputLen: 32,
  parallelism: 1,
  timeCost: 2,
} as const;

/**
 * Demo users for local development seed data.
 */

