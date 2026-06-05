import { Elysia } from "elysia";

import { client } from "@/client";
import { requirePermission, requireSession } from "./middlewares/session";

/**
 * Minimal protected notification overview endpoint used by the dashboard shell.
 */
export const notificationsApi = new Elysia().get(
  "/api/notifications",
  async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "notification.read");

    return client.notifications.list(query as Record<string, unknown>, {
      role: session.user.role,
      userId: session.userId,
    });
  },
);
