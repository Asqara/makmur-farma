import { z } from "zod";

/**
 * Password requirements shown to users and enforced by backend validation.
 */
export const PASSWORD_REQUIREMENTS = [
  "Minimal 10 karakter.",
  "Maksimal 128 karakter.",
  "Gunakan minimal tiga jenis karakter: huruf kecil, huruf besar, angka, dan simbol.",
] as const;

/**
 * Password strength validation message.
 */
export const PASSWORD_STRENGTH_MESSAGE =
  "Password harus terdiri dari 10-128 karakter dan menggunakan minimal tiga jenis karakter.";

const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;

function countCharacterGroups(password: string): number {
  let groups = 0;

  if (/[a-z]/.test(password)) groups += 1;
  if (/[A-Z]/.test(password)) groups += 1;
  if (/[0-9]/.test(password)) groups += 1;
  if (/[^A-Za-z0-9]/.test(password)) groups += 1;

  return groups;
}

/**
 * Password strength schema shared by frontend and backend validation.
 */
export const PASSWORD_STRENGTH_SCHEMA = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "Password harus terdiri dari minimal 10 karakter.")
  .max(PASSWORD_MAX_LENGTH, "Password maksimal 128 karakter.")
  .refine(
    (password) => countCharacterGroups(password) >= 3,
    "Password harus menggunakan minimal tiga jenis karakter.",
  );

/**
 * Validate password strength and return clear messages.
 */
export function validatePasswordStrength(password: string) {
  const result = PASSWORD_STRENGTH_SCHEMA.safeParse(password);

  if (result.success) {
    return {
      isValid: true,
      messages: [],
    };
  }

  return {
    isValid: false,
    messages: result.error.issues.map((issue) => issue.message),
  };
}
