import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "ps-proto-auth";
const MAX_AGE = 60 * 60 * 24 * 7; // 7-day session

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { password, from } = body as { password?: string; from?: string };

  const expected = process.env.PROTOTYPE_PASSWORD;

  if (!expected) {
    // No password configured — deny access with a clear server error
    return NextResponse.json(
      { error: "PROTOTYPE_PASSWORD environment variable is not set." },
      { status: 500 }
    );
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const redirectTo = from && from.startsWith("/") ? from : "/";
  const response = NextResponse.json({ ok: true, redirectTo });

  response.cookies.set(AUTH_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  return response;
}
