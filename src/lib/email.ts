import "server-only";

import nodemailer from "nodemailer";

import { APP_NAME } from "@/constants/app";
import { ENV } from "@/constants/config";
import { EmailDeliveryError } from "@/lib/errors";

type VerificationEmailInput = {
  email: string;
  fullName: string;
  verificationUrl: string;
};

function hasSmtpConfig() {
  return Boolean(ENV.smtp.host && ENV.smtp.username && ENV.smtp.password);
}

function getTransporter() {
  if (!hasSmtpConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    auth: {
      pass: ENV.smtp.password,
      user: ENV.smtp.username,
    },
    host: ENV.smtp.host,
    port: ENV.smtp.port,
    secure: ENV.smtp.port === 465,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Email adapter for Makmur Farma notification flows.
 */
export class EmailService {
  /**
   * Sends the customer email verification link.
   */
  static async sendVerificationEmail(input: VerificationEmailInput) {
    const transporter = getTransporter();

    if (!transporter) {
      if (process.env.NODE_ENV === "production") {
        throw new EmailDeliveryError(
          "SMTP belum dikonfigurasi untuk pengiriman verifikasi email.",
        );
      }

      console.info(
        `[Makmur Farma] Preview tautan verifikasi untuk ${input.email}: ${input.verificationUrl}`,
      );

      return;
    }

    const escapedName = escapeHtml(input.fullName);
    const subject = "Verifikasi Email Makmur Farma";
    const text = [
      `Halo ${input.fullName},`,
      "",
      `Terima kasih telah mendaftar di ${APP_NAME}.`,
      "Buka tautan berikut untuk memverifikasi email Anda:",
      input.verificationUrl,
      "",
      "Tautan ini akan kedaluwarsa sesuai waktu yang ditentukan.",
      "Jika Anda tidak melakukan pendaftaran, abaikan email ini.",
    ].join("\n");
    const html = `
      <p>Halo ${escapedName},</p>
      <p>Terima kasih telah mendaftar di ${APP_NAME}.</p>
      <p>
        <a href="${escapeHtml(input.verificationUrl)}">
          Verifikasi Email
        </a>
      </p>
      <p>Tautan ini akan kedaluwarsa sesuai waktu yang ditentukan.</p>
      <p>Jika Anda tidak melakukan pendaftaran, abaikan email ini.</p>
    `;

    try {
      await transporter.sendMail({
        from: `"${ENV.smtp.fromName}" <${ENV.smtp.fromEmail}>`,
        html,
        subject,
        text,
        to: input.email,
      });
    } catch (error) {
      console.warn("Pengiriman email verifikasi gagal.", error);
      throw new EmailDeliveryError();
    }
  }
}
