import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/constants/cookies";
import { ROUTES } from "@/constants/routes";

const PUBLIC_PATHS = [ROUTES.LOGIN, ROUTES.LOGOUT];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path);
}

/**
 * Route proxy that keeps protected dashboard pages behind a session cookie.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME));

  if (pathname === ROUTES.LOGIN && hasSession) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  if (isPublicPath(pathname) || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.png|.*\\..*).*)"],
};
