import { Elysia } from "elysia";

import { internalApi } from "./__internal__";
import { notificationsApi } from "./notifications";
import { v1Api } from "./v1";
import { AppError } from "@/lib/errors";

/**
 * Makmur Farma Elysia API mounted by the Next.js catch-all route.
 */
export const app = new Elysia()
  .onError(({ error, set }) => {
    if (error instanceof AppError) {
      set.status = error.statusCode;

      return {
        code: error.code,
        message: error.publicMessage,
      };
    }

    console.error("Unhandled API error.", error);
    set.status = 500;

    return {
      code: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan pada server.",
    };
  })
  .use(internalApi)
  .use(v1Api)
  .use(notificationsApi);

export type App = typeof app;
