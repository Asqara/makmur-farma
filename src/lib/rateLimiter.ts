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
  AUTH_LOGIN_RATE_LIMIT_UNKNOWN_IP,
  AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS,
} from "@/constants/auth";
import { RateLimitError } from "@/lib/errors";

type RateLimiterInstance = RateLimiterRedis | RateLimiterMemory;

/**
 * Rate limiter helper for security-sensitive routes.
 */
export class RateLimiter {
  private static loginFallbackLimiter = new RateLimiterMemory({
    points: AUTH_LOGIN_RATE_LIMIT_ATTEMPTS,
    duration: AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS,
    keyPrefix: AUTH_LOGIN_RATE_LIMIT_KEY_PREFIX,
  });

  private static loginLimiter = RateLimiter.createLoginLimiter();

  private static createLoginLimiter(): RateLimiterInstance {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      return RateLimiter.loginFallbackLimiter;
    }

    const redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    return new RateLimiterRedis({
      storeClient: redis,
      points: AUTH_LOGIN_RATE_LIMIT_ATTEMPTS,
      duration: AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS,
      keyPrefix: AUTH_LOGIN_RATE_LIMIT_KEY_PREFIX,
      insuranceLimiter: RateLimiter.loginFallbackLimiter,
    });
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

  private static getLoginKey(ipAddress: string | null, email: string) {
    return `${ipAddress ?? AUTH_LOGIN_RATE_LIMIT_UNKNOWN_IP}:${email}`;
  }

  /**
   * Consume one login attempt or throw `RateLimitError`.
   */
  static async consumeAuthLogin(ipAddress: string | null, email: string) {
    const key = RateLimiter.getLoginKey(ipAddress, email);

    try {
      await RateLimiter.loginLimiter.consume(key, 1);
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
}
