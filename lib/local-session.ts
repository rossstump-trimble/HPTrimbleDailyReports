import { NextResponse } from "next/server";

export const AUTH_COOKIE = "ps-proto-auth";
export const SESSION_COOKIE = "ps_session";
export const USER_COOKIE = "ps_user";

export const LOCAL_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const LOCAL_USER = {
  name: "Local Developer",
  email: "local@localhost",
  sub: "local-dev",
} as const;

export function localSessionPayload() {
  return {
    sub: LOCAL_USER.sub,
    email: LOCAL_USER.email,
    name: LOCAL_USER.name,
    given_name: "Local",
    family_name: "Developer",
    access_token: "local-dev-no-tid",
    expires_at: Date.now() + LOCAL_MAX_AGE_SECONDS * 1000,
  };
}

export function applyLocalAuthCookies(response: NextResponse): NextResponse {
  const secure = process.env.NODE_ENV === "production";
  const httpOnly = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: LOCAL_MAX_AGE_SECONDS,
  };

  response.cookies.set(AUTH_COOKIE, "1", httpOnly);
  response.cookies.set(SESSION_COOKIE, JSON.stringify(localSessionPayload()), httpOnly);
  response.cookies.set(USER_COOKIE, JSON.stringify(LOCAL_USER), {
    ...httpOnly,
    httpOnly: false,
  });

  return response;
}

export function hasLocalOrTidSession(request: {
  cookies: { get: (name: string) => { value: string } | undefined; has: (name: string) => boolean };
}): boolean {
  return request.cookies.get(AUTH_COOKIE)?.value === "1" || request.cookies.has(SESSION_COOKIE);
}
