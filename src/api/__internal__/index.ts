import { Elysia } from "elysia";

import { APP_NAME } from "@/constants/app";

/**
 * Internal operational API.
 */
export const internalApi = new Elysia().get("/api/__internal__/health", () => ({
  app: APP_NAME,
  status: "ok",
  timestamp: new Date().toISOString(),
}));
