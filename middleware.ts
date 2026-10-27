import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocalAuthRequest } from "@/lib/auth-mode";
import { logAuthEvent, requestAuthSnapshot } from "@/lib/auth-debug";
import { applyLocalAuthCookies, hasLocalOrTidSession } from "@/lib/local-session";
import { publicAppUrl } from "@/lib/public-origin";
import { checkRateLimit } from "@/lib/rate-limiter";
import { isPublicIntakePath } from "@/lib/middleware-auth";

function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }
  return "127.0.0.1";
}

function isPublicPath(pathname: string, method: string): boolean {
  if (isPublicIntakePath(pathname)) {
    return true;
  }

  // Read-only project metadata for intake form (e.g. GET /api/projects/1025)
  if (method === "GET" && /^\/api\/projects\/[^/]+$/.test(pathname)) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request);

  // 1. DDoS & Rate Limiting protection
  const rateLimit = pathname.startsWith("/api/auth") || pathname.startsWith("/api/login") || pathname === "/login"
    ? checkRateLimit(`auth:${clientIp}`, 30, 60000)
    : pathname.startsWith("/api/intake") || pathname.startsWith("/api/dailyreports")
      ? checkRateLimit(`intake:${clientIp}`, 60, 60000)
      : checkRateLimit(`gen:${clientIp}`, 180, 60000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", retryAfter: rateLimit.resetInSec },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetInSec),
        },
      }
    );
  }

  // 2. Public route check
  if (isPublicPath(pathname, request.method)) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // 3. Local development bypass check
  if (isLocalAuthRequest(request)) {
    const response = NextResponse.next();
    if (!hasLocalOrTidSession(request)) {
      applyLocalAuthCookies(response);
    }
    applySecurityHeaders(response);
    return response;
  }

  // 4. Authenticated session check
  const authed = hasLocalOrTidSession(request);

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required via Trimble Identity." },
        { status: 401 }
      );
    }

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
  applySecurityHeaders(response);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  return response;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://resources.connect.trimble.com; font-src 'self' data: https://fonts.gstatic.com https://resources.connect.trimble.com; img-src 'self' data: blob: https:; media-src 'self' data: blob:; connect-src 'self' https:; frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp|woff2?|ttf|otf|css|js|pdf)$|images/|fonts/|logos/|feedback-tool/).*)",
  ],
};
