import { Elysia } from "elysia";

import { requirePermission, requireSession } from "./middlewares/session";

/**
 * Minimal protected notification overview endpoint used by the dashboard shell.
 */
export const notificationsApi = new Elysia().get(
  "/api/notifications",
  async ({ request }) => {
    const session = await requireSession(request);
    requirePermission(session, "notification.read");

    return {
      data: [],
      pagination: {
        limit: 5,
        page: 1,
        total: 0,
        totalPages: 0,
      },
    };
  },
);
