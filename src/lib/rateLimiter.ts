import "server-only";

import Redis from "ioredis";
import {
  RateLimiterMemory,
  RateLimiterRedis,
  type RateLimiterRes,
} from "rate-limiter-flexible";

import {
  AUTH_LOGIN_RATE_LIMIT_ATTEMPTS,
  AUTH_LOGIN_RATE_LIMIT_KEY_PREFIX,
  AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS,
  AUTH_RATE_LIMIT_UNKNOWN_IP,
  AUTH_REGISTER_RATE_LIMIT_ATTEMPTS,
  AUTH_REGISTER_RATE_LIMIT_KEY_PREFIX,
  AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS,
  AUTH_RESEND_VERIFICATION_RATE_LIMIT_KEY_PREFIX,
  AUTH_VERIFICATION_RATE_LIMIT_ATTEMPTS,
  AUTH_VERIFICATION_RATE_LIMIT_KEY_PREFIX,
  AUTH_VERIFICATION_RATE_LIMIT_WINDOW_SECONDS,
} from "@/constants/auth";
import { ENV } from "@/constants/config";
import { RateLimitError } from "@/lib/errors";

type RateLimiterInstance = RateLimiterRedis | RateLimiterMemory;

type RateLimiterConfig = {
  duration: number;
  keyPrefix: string;
  points: number;
};

/**
 * Rate limiter helper for security-sensitive routes.
 */
export class RateLimiter {
  private static redis = ENV.redisUrl
    ? new Redis(ENV.redisUrl, {
        connectTimeout: 2000,
        enableOfflineQueue: false,
        lazyConnect: true,
        maxRetriesPerRequest: 0,
      })
    : null;

  private static limiters = new Map<string, RateLimiterInstance>();

  private static createLimiter(config: RateLimiterConfig): RateLimiterInstance {
    const fallbackLimiter = new RateLimiterMemory({
      duration: config.duration,
      keyPrefix: config.keyPrefix,
      points: config.points,
    });

    if (!RateLimiter.redis) {
      return fallbackLimiter;
    }

    return new RateLimiterRedis({
      duration: config.duration,
      insuranceLimiter: fallbackLimiter,
      keyPrefix: config.keyPrefix,
      points: config.points,
      storeClient: RateLimiter.redis,
    });
  }

  private static getLimiter(config: RateLimiterConfig): RateLimiterInstance {
    const existing = RateLimiter.limiters.get(config.keyPrefix);

    if (existing) {
      return existing;
    }

    const limiter = RateLimiter.createLimiter(config);
    RateLimiter.limiters.set(config.keyPrefix, limiter);

    return limiter;
  }

  private static isRateLimiterRes(value: unknown): value is RateLimiterRes {
    if (!value || typeof value !== "object") {
      return false;
    }

    if (!("msBeforeNext" in value)) {
      return false;
    }

    const candidate = value as { msBeforeNext?: unknown };

    return typeof candidate.msBeforeNext === "number";
  }

  private static getKey(ipAddress: string | null, identifier: string) {
    return `${ipAddress ?? AUTH_RATE_LIMIT_UNKNOWN_IP}:${identifier}`;
  }

  private static async consume(config: RateLimiterConfig, key: string) {
    try {
      await RateLimiter.getLimiter(config).consume(key, 1);
    } catch (error) {
      if (RateLimiter.isRateLimiterRes(error)) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil(error.msBeforeNext / 1000),
        );

        throw new RateLimitError(retryAfterSeconds);
      }

      console.warn("Rate limit check gagal.", error);
    }
  }

  /**
   * Consume one login attempt or throw `RateLimitError`.
   */
  static async consumeAuthLogin(ipAddress: string | null, email: string) {
    await RateLimiter.consume(
      {
        duration: AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS,
        keyPrefix: AUTH_LOGIN_RATE_LIMIT_KEY_PREFIX,
        points: AUTH_LOGIN_RATE_LIMIT_ATTEMPTS,
      },
      RateLimiter.getKey(ipAddress, email),
    );
  }

  /**
   * Consume one public registration attempt.
   */
  static async consumeAuthRegistration(ipAddress: string | null, email: string) {
    await RateLimiter.consume(
      {
        duration: AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS,
        keyPrefix: AUTH_REGISTER_RATE_LIMIT_KEY_PREFIX,
        points: AUTH_REGISTER_RATE_LIMIT_ATTEMPTS,
      },
      RateLimiter.getKey(ipAddress, email),
    );
  }

  /**
   * Consume one email verification attempt.
   */
  static async consumeEmailVerification(ipAddress: string | null, token: string) {
    await RateLimiter.consume(
      {
        duration: AUTH_VERIFICATION_RATE_LIMIT_WINDOW_SECONDS,
        keyPrefix: AUTH_VERIFICATION_RATE_LIMIT_KEY_PREFIX,
        points: AUTH_VERIFICATION_RATE_LIMIT_ATTEMPTS,
      },
      RateLimiter.getKey(ipAddress, token.slice(0, 12)),
    );
  }

  /**
   * Consume one resend-verification attempt.
   */
  static async consumeResendVerification(
    ipAddress: string | null,
    email: string,
  ) {
    await RateLimiter.consume(
      {
        duration: AUTH_VERIFICATION_RATE_LIMIT_WINDOW_SECONDS,
        keyPrefix: AUTH_RESEND_VERIFICATION_RATE_LIMIT_KEY_PREFIX,
        points: AUTH_VERIFICATION_RATE_LIMIT_ATTEMPTS,
      },
      RateLimiter.getKey(ipAddress, email),
    );
  }
}
