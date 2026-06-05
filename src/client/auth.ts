import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import {
  AUDIT_ACTIONS,
  EMAIL_VERIFICATION_TTL_SECONDS,
  SESSION_ACTIVITY_UPDATE_THROTTLE_SECONDS,
  type UserRole,
} from "@/constants/auth";
import { ENV } from "@/constants/config";
import {
  auditLogs,
  emailVerificationTokens,
  sessions,
  users,
  type SessionRow,
  type UserRow,
} from "@/drizzle-schema";
import {
  AccountDisabledError,
  AuthenticationError,
  ConflictAppError,
  EmailNotVerifiedError,
  InvalidVerificationTokenError,
  SessionExpiredError,
  UnauthorizedError,
  VerificationTokenExpiredError,
} from "@/lib/errors";
import { EmailService } from "@/lib/email";
import { db, readDb } from "@/lib/db";
import { hashPassword, needsPasswordRehash, verifyPassword } from "@/lib/password";
import type { RequestContext } from "@/lib/request";
import {
  createSecurityToken,
  getSessionTokenFromRequest,
  hashSecurityToken,
} from "@/lib/session";
import { RateLimiter } from "@/lib/rateLimiter";
import {
  createSessionExpiry,
  isSessionExpired,
  renewIdleExpiry,
} from "@/utils/sessionTimeout";
import { validatePasswordStrength } from "@/utils/passwordPolicy";
import { getPermissionsForRole } from "@/utils/permissions";
import { getSafeRedirectPath } from "@/utils/redirects";
import type {
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  VerifyEmailInput,
} from "@/zod-schemas";

import { toPublicUser, type AuthSession, type PublicUser } from "./types";

type LoginResult = {
  csrfToken: string;
  redirectTo: string;
  sessionToken: string;
  user: PublicUser;
};

type RegisterResult = {
  email: string;
  maskedEmail: string;
  message: string;
};

type SessionResult = {
  session: Omit<AuthSession, "csrfTokenHash" | "permissions" | "userId">;
  user: PublicUser;
};

type VerifyEmailResult = {
  status: "already_verified" | "verified";
};

type AuditInput = {
  action: string;
  actorRole?: UserRole | null;
  actorUserId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  requestContext: RequestContext;
  result: "BLOCKED" | "FAILED" | "SUCCESS";
  targetId?: string | null;
  targetType: string;
};

const SAFE_RESEND_MESSAGE =
  "Jika alamat email dapat digunakan, instruksi verifikasi akan dikirim.";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return "email terdaftar";
  }

  const visiblePrefix = name.slice(0, 2);

  return `${visiblePrefix}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  if (!("code" in error)) {
    return false;
  }

  return (error as { code?: string }).code === "23505";
}

function isActiveVerifiedUser(user: UserRow) {
  return user.status === "ACTIVE" && user.isActive && user.emailVerifiedAt;
}

function getVerificationUrl(token: string) {
  const url = new URL("/verify-email", ENV.appPublicUrl);
  url.searchParams.set("token", token);

  return url.toString();
}

/**
 * Business service for Makmur Farma authentication and session management.
 */
export class AuthClient {
  private async writeAudit(input: AuditInput) {
    try {
      await db.insert(auditLogs).values({
        action: input.action,
        actorRole: input.actorRole ?? null,
        actorUserId: input.actorUserId ?? null,
        correlationId: input.requestContext.correlationId,
        description: input.description,
        ipAddress: input.requestContext.ipAddress,
        metadata: input.metadata ?? {},
        result: input.result,
        targetId: input.targetId ?? null,
        targetType: input.targetType,
        userAgent: input.requestContext.userAgent,
      });
    } catch (error) {
      console.warn("Audit log gagal ditulis.", error);
    }
  }

  private async createVerificationToken(user: UserRow) {
    const now = new Date();
    const token = createSecurityToken();
    const tokenHash = hashSecurityToken(token);
    const expiresAt = new Date(
      now.getTime() +
        (ENV.auth.emailVerificationTtlSeconds ||
          EMAIL_VERIFICATION_TTL_SECONDS) *
          1_000,
    );

    await db.transaction(async (tx) => {
      await tx
        .update(emailVerificationTokens)
        .set({
          updatedAt: now,
          usedAt: now,
        })
        .where(
          and(
            eq(emailVerificationTokens.userId, user.id),
            isNull(emailVerificationTokens.usedAt),
          ),
        );

      await tx.insert(emailVerificationTokens).values({
        expiresAt,
        tokenHash,
        userId: user.id,
      });
    });

    return {
      expiresAt,
      token,
      verificationUrl: getVerificationUrl(token),
    };
  }

  private toSessionResult(session: AuthSession): SessionResult {
    return {
      session: {
        absoluteExpiresAt: session.absoluteExpiresAt,
        id: session.id,
        idleExpiresAt: session.idleExpiresAt,
        lastActivityAt: session.lastActivityAt,
        user: session.user,
      },
      user: session.user,
    };
  }

  /**
   * Registers a public customer account and sends a verification email.
   */
  async register(
    input: RegisterInput,
    requestContext: RequestContext,
  ): Promise<RegisterResult> {
    const normalizedEmail = normalizeEmail(input.email);

    await RateLimiter.consumeAuthRegistration(
      requestContext.ipAddress,
      normalizedEmail,
    );

    const passwordHash = await hashPassword(input.password);

    let user: UserRow;

    try {
      [user] = await db
        .insert(users)
        .values({
          email: input.email.trim(),
          fullName: input.fullName.trim(),
          isActive: false,
          normalizedEmail,
          passwordHash,
          phone: input.phone.trim(),
          role: "CUSTOMER",
          status: "PENDING_VERIFICATION",
        })
        .returning();
    } catch (error) {
      await this.writeAudit({
        action: AUDIT_ACTIONS.AUTH_REGISTER_FAILED,
        description: "Registrasi pelanggan gagal.",
        metadata: {
          email: maskEmail(normalizedEmail),
          reason: isUniqueViolation(error) ? "duplicate_email" : "database_error",
        },
        requestContext,
        result: "FAILED",
        targetType: "user",
      });

      if (isUniqueViolation(error)) {
        throw new ConflictAppError(
          "Email sudah terdaftar. Silakan masuk atau gunakan email lain.",
        );
      }

      throw error;
    }

    const verification = await this.createVerificationToken(user);

    await EmailService.sendVerificationEmail({
      email: user.email,
      fullName: user.fullName,
      verificationUrl: verification.verificationUrl,
    });

    await this.writeAudit({
      action: AUDIT_ACTIONS.AUTH_REGISTER_SUCCESS,
      actorRole: user.role,
      actorUserId: user.id,
      description: "Registrasi pelanggan berhasil dan menunggu verifikasi email.",
      metadata: {
        email: maskEmail(user.normalizedEmail),
        verificationExpiresAt: verification.expiresAt.toISOString(),
      },
      requestContext,
      result: "SUCCESS",
      targetId: user.id,
      targetType: "user",
    });

    await this.writeAudit({
      action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFICATION_SENT,
      actorRole: user.role,
      actorUserId: user.id,
      description: "Email verifikasi dikirim.",
      metadata: {
        email: maskEmail(user.normalizedEmail),
      },
      requestContext,
      result: "SUCCESS",
      targetId: user.id,
      targetType: "email_verification",
    });

    return {
      email: user.email,
      maskedEmail: maskEmail(user.normalizedEmail),
      message: "Registrasi berhasil. Silakan periksa email Anda.",
    };
  }

  /**
   * Verifies a one-time email verification token.
   */
  async verifyEmail(
    input: VerifyEmailInput,
    requestContext: RequestContext,
  ): Promise<VerifyEmailResult> {
    await RateLimiter.consumeEmailVerification(
      requestContext.ipAddress,
      input.token,
    );

    const tokenHash = hashSecurityToken(input.token);
    const now = new Date();
    const [record] = await readDb
      .select({
        token: emailVerificationTokens,
        user: users,
      })
      .from(emailVerificationTokens)
      .innerJoin(users, eq(emailVerificationTokens.userId, users.id))
      .where(eq(emailVerificationTokens.tokenHash, tokenHash))
      .limit(1);

    if (!record) {
      await this.writeAudit({
        action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFICATION_FAILED,
        description: "Token verifikasi email tidak ditemukan.",
        metadata: { reason: "invalid_token" },
        requestContext,
        result: "FAILED",
        targetType: "email_verification",
      });

      throw new InvalidVerificationTokenError();
    }

    if (record.user.emailVerifiedAt) {
      if (!record.token.usedAt) {
        await db
          .update(emailVerificationTokens)
          .set({ updatedAt: now, usedAt: now })
          .where(eq(emailVerificationTokens.id, record.token.id));
      }

      return { status: "already_verified" };
    }

    if (record.token.usedAt) {
      await this.writeAudit({
        action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFICATION_FAILED,
        actorRole: record.user.role,
        actorUserId: record.user.id,
        description: "Token verifikasi email sudah digunakan.",
        metadata: { reason: "token_used" },
        requestContext,
        result: "FAILED",
        targetId: record.user.id,
        targetType: "email_verification",
      });

      throw new InvalidVerificationTokenError("Tautan verifikasi sudah digunakan.");
    }

    if (record.token.expiresAt.getTime() <= now.getTime()) {
      await this.writeAudit({
        action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFICATION_FAILED,
        actorRole: record.user.role,
        actorUserId: record.user.id,
        description: "Token verifikasi email kedaluwarsa.",
        metadata: { reason: "token_expired" },
        requestContext,
        result: "FAILED",
        targetId: record.user.id,
        targetType: "email_verification",
      });

      throw new VerificationTokenExpiredError();
    }

    await db.transaction(async (tx) => {
      await tx
        .update(emailVerificationTokens)
        .set({
          updatedAt: now,
          usedAt: now,
        })
        .where(eq(emailVerificationTokens.id, record.token.id));

      await tx
        .update(users)
        .set({
          emailVerifiedAt: now,
          isActive: true,
          status: "ACTIVE",
          updatedAt: now,
        })
        .where(eq(users.id, record.user.id));
    });

    await this.writeAudit({
      action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFIED,
      actorRole: record.user.role,
      actorUserId: record.user.id,
      description: "Email pelanggan berhasil diverifikasi.",
      metadata: {
        email: maskEmail(record.user.normalizedEmail),
      },
      requestContext,
      result: "SUCCESS",
      targetId: record.user.id,
      targetType: "email_verification",
    });

    return { status: "verified" };
  }

  /**
   * Sends a new verification email when a pending account exists.
   */
  async resendVerification(
    input: ResendVerificationInput,
    requestContext: RequestContext,
  ) {
    const normalizedEmail = normalizeEmail(input.email);

    await RateLimiter.consumeResendVerification(
      requestContext.ipAddress,
      normalizedEmail,
    );

    const [user] = await readDb
      .select()
      .from(users)
      .where(eq(users.normalizedEmail, normalizedEmail))
      .limit(1);

    if (!user || isActiveVerifiedUser(user)) {
      await this.writeAudit({
        action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFICATION_RESENT,
        description: "Permintaan kirim ulang verifikasi diproses secara aman.",
        metadata: {
          email: maskEmail(normalizedEmail),
          sent: false,
        },
        requestContext,
        result: "SUCCESS",
        targetType: "email_verification",
      });

      return { message: SAFE_RESEND_MESSAGE };
    }

    const verification = await this.createVerificationToken(user);

    await EmailService.sendVerificationEmail({
      email: user.email,
      fullName: user.fullName,
      verificationUrl: verification.verificationUrl,
    });

    await this.writeAudit({
      action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFICATION_RESENT,
      actorRole: user.role,
      actorUserId: user.id,
      description: "Email verifikasi dikirim ulang.",
      metadata: {
        email: maskEmail(user.normalizedEmail),
        verificationExpiresAt: verification.expiresAt.toISOString(),
      },
      requestContext,
      result: "SUCCESS",
      targetId: user.id,
      targetType: "email_verification",
    });

    return { message: SAFE_RESEND_MESSAGE };
  }

  /**
   * Authenticates a user and creates an opaque server-side session.
   */
  async login(
    input: LoginInput,
    requestContext: RequestContext,
  ): Promise<LoginResult> {
    const normalizedEmail = normalizeEmail(input.email);

    await RateLimiter.consumeAuthLogin(requestContext.ipAddress, normalizedEmail);

    const [user] = await readDb
      .select()
      .from(users)
      .where(eq(users.normalizedEmail, normalizedEmail))
      .limit(1);

    const invalidCredentials = async () => {
      await this.writeAudit({
        action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        description: "Login gagal dengan kredensial tidak valid.",
        metadata: {
          email: maskEmail(normalizedEmail),
          reason: "invalid_credentials",
        },
        requestContext,
        result: "FAILED",
        targetType: "auth",
      });

      throw new AuthenticationError("Email atau password tidak sesuai.");
    };

    if (!user) {
      await invalidCredentials();
    }

    const passwordValid = await verifyPassword(user.passwordHash, input.password);

    if (!passwordValid) {
      await invalidCredentials();
    }

    if (user.status === "PENDING_VERIFICATION" || !user.emailVerifiedAt) {
      await this.writeAudit({
        action: AUDIT_ACTIONS.AUTH_LOGIN_BLOCKED,
        actorRole: user.role,
        actorUserId: user.id,
        description: "Login diblokir karena email belum diverifikasi.",
        metadata: {
          email: maskEmail(user.normalizedEmail),
          reason: "email_not_verified",
        },
        requestContext,
        result: "BLOCKED",
        targetId: user.id,
        targetType: "auth",
      });

      throw new EmailNotVerifiedError(
        "Email belum diverifikasi. Silakan periksa email Anda atau kirim ulang verifikasi.",
      );
    }

    if (user.status !== "ACTIVE" || !user.isActive) {
      await this.writeAudit({
        action: AUDIT_ACTIONS.AUTH_LOGIN_BLOCKED,
        actorRole: user.role,
        actorUserId: user.id,
        description: "Login diblokir karena akun tidak aktif.",
        metadata: {
          email: maskEmail(user.normalizedEmail),
          reason: user.status,
        },
        requestContext,
        result: "BLOCKED",
        targetId: user.id,
        targetType: "auth",
      });

      throw new AccountDisabledError();
    }

    const now = new Date();
    const sessionToken = createSecurityToken();
    const csrfToken = createSecurityToken();
    const sessionExpiry = createSessionExpiry(now);
    const publicUser = toPublicUser(user);

    if (
      needsPasswordRehash(user.passwordHash) &&
      validatePasswordStrength(input.password).isValid
    ) {
      await db
        .update(users)
        .set({
          passwordHash: await hashPassword(input.password),
          updatedAt: now,
        })
        .where(eq(users.id, user.id));
    }

    const [session] = await db
      .insert(sessions)
      .values({
        absoluteExpiresAt: sessionExpiry.absoluteExpiresAt,
        csrfTokenHash: hashSecurityToken(csrfToken),
        idleExpiresAt: sessionExpiry.idleExpiresAt,
        ipAddress: requestContext.ipAddress,
        lastActivityAt: now,
        tokenHash: hashSecurityToken(sessionToken),
        userAgent: requestContext.userAgent,
        userId: user.id,
      })
      .returning();

    await db
      .update(users)
      .set({
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));

    await this.writeAudit({
      action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
      actorRole: user.role,
      actorUserId: user.id,
      description: "Login berhasil.",
      metadata: {
        email: maskEmail(user.normalizedEmail),
      },
      requestContext,
      result: "SUCCESS",
      targetId: user.id,
      targetType: "auth",
    });

    await this.writeAudit({
      action: AUDIT_ACTIONS.AUTH_SESSION_CREATED,
      actorRole: user.role,
      actorUserId: user.id,
      description: "Session autentikasi dibuat.",
      metadata: {
        absoluteExpiresAt: session.absoluteExpiresAt.toISOString(),
        idleExpiresAt: session.idleExpiresAt.toISOString(),
      },
      requestContext,
      result: "SUCCESS",
      targetId: session.id,
      targetType: "session",
    });

    return {
      csrfToken,
      redirectTo: getSafeRedirectPath(input.redirectTo, user.role),
      sessionToken,
      user: {
        ...publicUser,
        lastLoginAt: now,
      },
    };
  }

  private async findSessionByToken(
    request: Request,
  ): Promise<{ session: SessionRow; user: UserRow } | null> {
    const token = getSessionTokenFromRequest(request);

    if (!token) {
      return null;
    }

    const tokenHash = hashSecurityToken(token);
    const [record] = await readDb
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);

    return record ?? null;
  }

  /**
   * Validates the current request session from the HTTP-only cookie.
   */
  async validateRequestSession(
    request: Request,
    requestContext: RequestContext,
  ): Promise<AuthSession> {
    const record = await this.findSessionByToken(request);

    if (!record) {
      throw new UnauthorizedError();
    }

    const now = new Date();

    if (
      isSessionExpired(
        {
          absoluteExpiresAt: record.session.absoluteExpiresAt,
          idleExpiresAt: record.session.idleExpiresAt,
          revokedAt: record.session.revokedAt,
        },
        now,
      )
    ) {
      const reason = record.session.revokedAt
        ? (record.session.revokedReason ?? "revoked")
        : record.session.absoluteExpiresAt.getTime() <= now.getTime()
          ? "absolute_timeout"
          : "idle_timeout";

      if (!record.session.revokedAt) {
        await db
          .update(sessions)
          .set({
            revokedAt: now,
            revokedReason: reason,
            updatedAt: now,
          })
          .where(eq(sessions.id, record.session.id));
      }

      await this.writeAudit({
        action: AUDIT_ACTIONS.AUTH_SESSION_EXPIRED,
        actorRole: record.user.role,
        actorUserId: record.user.id,
        description: "Session autentikasi kedaluwarsa atau dicabut.",
        metadata: { reason },
        requestContext,
        result: "BLOCKED",
        targetId: record.session.id,
        targetType: "session",
      });

      throw new SessionExpiredError();
    }

    if (record.user.status !== "ACTIVE" || !record.user.isActive) {
      throw new UnauthorizedError();
    }

    const lastActivityAgeSeconds =
      (now.getTime() - record.session.lastActivityAt.getTime()) / 1_000;

    let idleExpiresAt = record.session.idleExpiresAt;
    let lastActivityAt = record.session.lastActivityAt;

    if (lastActivityAgeSeconds >= SESSION_ACTIVITY_UPDATE_THROTTLE_SECONDS) {
      idleExpiresAt = renewIdleExpiry(record.session.absoluteExpiresAt, now);
      lastActivityAt = now;

      await db
        .update(sessions)
        .set({
          idleExpiresAt,
          lastActivityAt,
          updatedAt: now,
        })
        .where(eq(sessions.id, record.session.id));
    }

    const publicUser = toPublicUser(record.user);

    return {
      absoluteExpiresAt: record.session.absoluteExpiresAt,
      csrfTokenHash: record.session.csrfTokenHash,
      id: record.session.id,
      idleExpiresAt,
      lastActivityAt,
      permissions: getPermissionsForRole(record.user.role),
      user: publicUser,
      userId: record.user.id,
    };
  }

  /**
   * Returns a safe representation of the active session.
   */
  async getCurrentSession(
    request: Request,
    requestContext: RequestContext,
  ): Promise<SessionResult> {
    const session = await this.validateRequestSession(request, requestContext);

    return this.toSessionResult(session);
  }

  /**
   * Revokes the current session if it exists. Logout is idempotent.
   */
  async logout(request: Request, requestContext: RequestContext) {
    const record = await this.findSessionByToken(request);

    if (!record) {
      return { message: "Anda telah keluar dari Makmur Farma." };
    }

    const now = new Date();

    if (!record.session.revokedAt) {
      await db
        .update(sessions)
        .set({
          revokedAt: now,
          revokedReason: "logout",
          updatedAt: now,
        })
        .where(eq(sessions.id, record.session.id));
    }

    await this.writeAudit({
      action: AUDIT_ACTIONS.AUTH_LOGOUT,
      actorRole: record.user.role,
      actorUserId: record.user.id,
      description: "User keluar dari aplikasi.",
      metadata: {
        sessionId: record.session.id,
      },
      requestContext,
      result: "SUCCESS",
      targetId: record.session.id,
      targetType: "session",
    });

    return { message: "Anda telah keluar dari Makmur Farma." };
  }
}
