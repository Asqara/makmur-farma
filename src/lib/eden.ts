"use client";

import { treaty } from "@elysiajs/eden";

import type { App } from "@/api";
import { APP_URL } from "@/constants/app";
import { CSRF_HEADER_NAME } from "@/constants/auth";
import { CSRF_COOKIE_NAME } from "@/constants/cookies";
import { parseCookieHeader } from "@/utils/cookies";

function getBaseUrl() {
  if (typeof window === "undefined") {
    return APP_URL;
  }

  return window.location.origin;
}

function getCsrfHeader() {
  if (typeof document === "undefined") {
    return undefined;
  }

  const csrfToken = parseCookieHeader(document.cookie)[CSRF_COOKIE_NAME];

  if (!csrfToken) {
    return undefined;
  }

  return {
    [CSRF_HEADER_NAME]: csrfToken,
  };
}

/**
 * Typed Eden client for same-origin SmartStock Pro API calls.
 */
export const eden = treaty<App>(getBaseUrl(), {
  fetch: {
    credentials: "include",
  },
  headers: getCsrfHeader,
});
