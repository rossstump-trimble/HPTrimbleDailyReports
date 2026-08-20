import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "ps-proto-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow login, auth callback, and public auth endpoints through
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/logout"
  ) {
    return NextResponse.next();
  }

  // Check for a valid auth cookie (either prototype auth or TID session)
  const authed =
    request.cookies.get(AUTH_COOKIE)?.value === "1" ||
    request.cookies.has("ps_session");

  if (!authed) {
    const loginUrl = new URL("/login", request.url);
    // Pass the original destination so we can redirect back after login
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — add CORS headers and continue
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
    // Run on all routes except Next.js internals, static files, and public assets
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp|woff2?|ttf|otf|css|js|pdf)$|images/|fonts/|logos/|drawings/|specs/).*)",
  ],
};
