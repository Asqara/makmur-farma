import "server-only";

import { hash, verify } from "@node-rs/argon2";

import { PASSWORD_HASH_OPTIONS } from "@/constants/auth";
import { validatePasswordStrength } from "@/utils/passwordPolicy";

import { ValidationAppError } from "./errors";

/**
 * Validates and hashes a plain password.
 */
export async function hashPassword(password: string): Promise<string> {
  const validation = validatePasswordStrength(password);

  if (!validation.isValid) {
    throw new ValidationAppError(validation.messages.join(" "));
  }

  return hash(password, PASSWORD_HASH_OPTIONS);
}

/**
 * Verifies one plain password against an Argon2 hash.
 */
export function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return verify(passwordHash, password, PASSWORD_HASH_OPTIONS);
}
