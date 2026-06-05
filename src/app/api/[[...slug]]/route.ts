import { app } from "@/api";

export const runtime = "nodejs";

async function handle(request: Request): Promise<Response> {
  const res = await app.handle(request);

  if (!res.body) {
    return res;
  }

  // Buffer streaming responses to avoid "Body has already been consumed"
  // when Next.js processes static assets served by @elysia/static.
  const body = await res.arrayBuffer();

  return new Response(body, {
    headers: res.headers,
    status: res.status,
  });
}

/**
 * Elysia GET handler.
 */
export const GET = handle;

/**
 * Elysia POST handler.
 */
export const POST = handle;

/**
 * Elysia PATCH handler.
 */
export const PATCH = handle;

/**
 * Elysia PUT handler.
 */
export const PUT = handle;

/**
 * Elysia DELETE handler.
 */
export const DELETE = handle;
