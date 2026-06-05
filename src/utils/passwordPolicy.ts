import { z } from "zod";

/**
 * Password strength validation message.
 */
export const PASSWORD_STRENGTH_MESSAGE =
  "Password minimal 8 karakter dan wajib memiliki huruf besar, huruf kecil, angka, dan simbol.";

/**
 * Password strength schema shared by frontend and backend validation.
 */
export const PASSWORD_STRENGTH_SCHEMA = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .regex(/[A-Z]/, "Password wajib memiliki minimal 1 huruf besar.")
  .regex(/[a-z]/, "Password wajib memiliki minimal 1 huruf kecil.")
  .regex(/[0-9]/, "Password wajib memiliki minimal 1 angka.")
  .regex(/[^A-Za-z0-9]/, "Password wajib memiliki minimal 1 simbol.");

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
