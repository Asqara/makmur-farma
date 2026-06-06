import { app } from "@/api";

export const runtime = "nodejs";

/**
 * Copies headers from a source Headers object to a destination Headers object,
 * using getSetCookie() to preserve multiple Set-Cookie headers separately.
 * Node.js 20 / undici merges multiple Set-Cookie values into one comma-separated
 * string when iterating via forEach/entries — getSetCookie() is the only safe way.
 */
function copyHeaders(src: Headers, dst: Headers) {
  src.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      dst.append(key, value);
    }
  });

  const setCookies =
    typeof (src as unknown as { getSetCookie?: () => string[] }).getSetCookie ===
    "function"
      ? (src as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : [];

  for (const cookie of setCookies) {
    dst.append("Set-Cookie", cookie);
  }
}

async function handle(request: Request): Promise<Response> {
  const res = await app.handle(request);

  const headers = new Headers();
  copyHeaders(res.headers, headers);

  if (!res.body || res.bodyUsed) {
    return new Response(null, { headers, status: res.status });
  }

  // Buffer to give Next.js a clonable, non-streaming body.
  try {
    const raw = await res.arrayBuffer();
    return new Response(raw.byteLength > 0 ? raw.slice(0) : null, {
      headers,
      status: res.status,
    });
  } catch {
    return new Response(null, { headers, status: res.status });
  }
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
