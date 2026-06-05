import { z } from "zod";

import { PASSWORD_STRENGTH_SCHEMA } from "@/utils/passwordPolicy";

const EMAIL_SCHEMA = z
  .string()
  .trim()
  .min(1, "Email wajib diisi.")
  .email("Email tidak valid.");

const FULL_NAME_SCHEMA = z
  .string()
  .trim()
  .min(3, "Nama lengkap minimal 3 karakter.")
  .max(120, "Nama lengkap maksimal 120 karakter.");

const PHONE_SCHEMA = z
  .string()
  .trim()
  .min(8, "Nomor telepon minimal 8 digit.")
  .max(20, "Nomor telepon maksimal 20 karakter.")
  .regex(/^[+0-9][0-9\s-]*$/, "Nomor telepon tidak valid.");

/**
 * Auth request schemas.
 */
export class Auth {
  static login = z.object({
    email: EMAIL_SCHEMA,
    password: z
      .string()
      .min(1, "Password wajib diisi.")
      .max(128, "Password maksimal 128 karakter."),
    redirectTo: z.string().optional(),
  });

  static register = z
    .object({
      confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
      email: EMAIL_SCHEMA,
      fullName: FULL_NAME_SCHEMA,
      password: PASSWORD_STRENGTH_SCHEMA,
      phone: PHONE_SCHEMA,
      termsAccepted: z.literal(true, {
        error: "Persetujuan syarat dan kebijakan privasi wajib dicentang.",
      }),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: "Konfirmasi password tidak sama.",
      path: ["confirmPassword"],
    });

  static verifyEmail = z.object({
    token: z
      .string()
      .trim()
      .min(32, "Token verifikasi tidak valid.")
      .max(256, "Token verifikasi tidak valid."),
  });

  static resendVerification = z.object({
    email: EMAIL_SCHEMA,
  });
}

export type LoginInput = z.infer<typeof Auth.login>;
export type RegisterInput = z.infer<typeof Auth.register>;
export type ResendVerificationInput = z.infer<
  typeof Auth.resendVerification
>;
export type VerifyEmailInput = z.infer<typeof Auth.verifyEmail>;
