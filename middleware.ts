import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocalAuthRequest } from "@/lib/auth-mode";
import { logAuthEvent, requestAuthSnapshot } from "@/lib/auth-debug";
import { applyLocalAuthCookies, hasLocalOrTidSession } from "@/lib/local-session";
import { publicAppUrl } from "@/lib/public-origin";

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/logout" ||
    pathname.startsWith("/intake") ||
    pathname.startsWith("/api/intake")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isLocalAuthRequest(request)) {
    const response = NextResponse.next();
    if (!hasLocalOrTidSession(request)) {
      applyLocalAuthCookies(response);
    }
    return response;
  }

  const authed = hasLocalOrTidSession(request);

  if (!authed) {
    const loginUrl = publicAppUrl(request, "/login");
    loginUrl.searchParams.set("from", pathname);
    logAuthEvent("tid.middleware.unauth", {
      ...requestAuthSnapshot(request),
      pathname,
      location: loginUrl.toString(),
    });
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp|woff2?|ttf|otf|css|js|pdf)$|images/|fonts/|logos/).*)",
  ],
};
