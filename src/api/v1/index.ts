import { Elysia } from "elysia";
import { ZodError, type ZodType } from "zod";

import { client } from "@/client";
import { createAuthCookies, createClearAuthCookies } from "@/lib/session";
import { assertSafeMutationOrigin, assertSessionCsrf } from "@/lib/csrf";
import { getRequestContext } from "@/lib/request";
import { ValidationAppError } from "@/lib/errors";
import { Auth } from "@/zod-schemas";

function setCookieHeaders(set: { headers: Record<string, string | number> }, cookies: string[]) {
  set.headers["Set-Cookie"] = cookies as unknown as string;
}

function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];

      throw new ValidationAppError(
        firstIssue?.message ?? "Data yang dikirim tidak valid.",
      );
    }

    throw error;
  }
}

/**
 * Versioned application API.
 */
export const v1Api = new Elysia()
  .group("/api/v1/auth", (app) =>
    app
      .post("/register", async ({ body, request }) => {
        assertSafeMutationOrigin(request);

        return client.auth.register(
          parseBody(Auth.register, body),
          getRequestContext(request),
        );
      })
      .post("/login", async ({ body, request, set }) => {
        assertSafeMutationOrigin(request);

        const result = await client.auth.login(
          parseBody(Auth.login, body),
          getRequestContext(request),
        );
        const cookies = createAuthCookies(
          result.sessionToken,
          result.csrfToken,
        );

        setCookieHeaders(set, cookies);

        return {
          redirectTo: result.redirectTo,
          user: result.user,
        };
      })
      .get("/session", async ({ request }) =>
        client.auth.getCurrentSession(request, getRequestContext(request)),
      )
      .post("/logout", async ({ request, set }) => {
        const requestContext = getRequestContext(request);
        const activeSession = await client.auth
          .validateRequestSession(request, requestContext)
          .catch(() => null);

        if (activeSession) {
          assertSessionCsrf(request, activeSession.csrfTokenHash);
        }

        const result = await client.auth.logout(request, requestContext);

        setCookieHeaders(set, createClearAuthCookies());

        return result;
      })
      .post("/verify-email", async ({ body, request }) => {
        assertSafeMutationOrigin(request);

        return client.auth.verifyEmail(
          parseBody(Auth.verifyEmail, body),
          getRequestContext(request),
        );
      })
      .post("/resend-verification", async ({ body, request }) => {
        assertSafeMutationOrigin(request);

        return client.auth.resendVerification(
          parseBody(Auth.resendVerification, body),
          getRequestContext(request),
        );
      }),
  )
  .get("/api/v1/profile", async ({ request }) =>
    client.auth.getCurrentSession(request, getRequestContext(request)),
  );
