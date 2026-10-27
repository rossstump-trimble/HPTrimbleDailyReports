import crypto from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAccessControl } from "@/lib/store";
import {
  AUTH_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
  isAllowedLoginEmail,
  isAdminEmail,
  safeRedirectPath,
  signSessionPayload,
} from "@/lib/local-session";

const MAX_AGE = 60 * 60 * 24 * 7; // 7-day session

function safeStringCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { password, email, from } = body as {
    password?: string;
    email?: string;
    from?: string;
  };

  const accessControl = getAccessControl();
  if (!accessControl.allowPasskeyLogin) {
    return NextResponse.json(
      { error: "Passkey login is disabled by the administrator. Please sign in with Trimble Identity." },
      { status: 403 },
    );
  }

  const expected = process.env.PROTOTYPE_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "PROTOTYPE_PASSWORD environment variable is not set." },
      { status: 500 },
    );
  }

  if (!password || !safeStringCompare(password, expected)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!isAllowedLoginEmail(cleanEmail, accessControl.allowedDomains, accessControl.allowedEmails)) {
    const domainList = accessControl.allowedDomains.map((d) => `@${d}`).join(" or ");
    return NextResponse.json(
      { error: `A valid ${domainList} email address is required to sign in.` },
      { status: 403 },
    );
  }

  const userIsAdmin = isAdminEmail(cleanEmail, accessControl.adminEmails);
  const name = cleanEmail.split("@")[0].replace(/[._-]+/g, " ");
  const sessionData = signSessionPayload({
    sub: `passkey:${cleanEmail}`,
    email: cleanEmail,
    name,
    expires_at: Date.now() + MAX_AGE * 1000,
    isAdmin: userIsAdmin,
  });

  const redirectTo = safeRedirectPath(from, "/");
  const response = NextResponse.json({ ok: true, redirectTo });

  response.cookies.set(SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  response.cookies.set(AUTH_COOKIE, sessionData.sig || "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  response.cookies.set(
    USER_COOKIE,
    JSON.stringify({ name, email: cleanEmail, sub: sessionData.sub, isAdmin: userIsAdmin }),
    {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    },
  );

  return response;
}
