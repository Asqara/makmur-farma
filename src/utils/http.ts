import ky from "ky";

/**
 * Pre-configured `ky` instance for calling external APIs.
 * Internal API calls should use `eden` instead.
 */
export const http = ky.create({
  timeout: 15_000,
  retry: { limit: 2 },
});
