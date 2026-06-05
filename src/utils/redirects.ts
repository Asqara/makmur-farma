import {
  OPERATIONAL_ROLE_VALUES,
  ROLE_DEFAULT_REDIRECTS,
  type UserRole,
} from "@/constants/auth";

function isInternalPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;

  try {
    const parsed = new URL(value, "http://makmur-farma.local");

    return parsed.origin === "http://makmur-farma.local";
  } catch {
    return false;
  }
}

function isAllowedForRole(path: string, role: UserRole): boolean {
  if (role === "CUSTOMER") {
    return path === "/account" || path.startsWith("/account/");
  }

  return OPERATIONAL_ROLE_VALUES.includes(role) && path !== "/account";
}

/**
 * Returns a role-appropriate redirect path and rejects external URLs.
 */
export function getSafeRedirectPath(
  requestedPath: string | null | undefined,
  role: UserRole,
): string {
  const fallback = ROLE_DEFAULT_REDIRECTS[role];

  if (!requestedPath) {
    return fallback;
  }

  if (!isInternalPath(requestedPath)) {
    return fallback;
  }

  if (!isAllowedForRole(requestedPath, role)) {
    return fallback;
  }

  return requestedPath;
}
