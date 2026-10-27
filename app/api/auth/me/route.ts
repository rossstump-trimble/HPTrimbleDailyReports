import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocalAuthRequest } from "@/lib/auth-mode";
import {
  LOCAL_USER,
  SESSION_COOKIE,
  isAllowedLoginEmail,
  isAdminEmail,
  parseVerifiedSession,
  signSessionPayload,
} from "@/lib/local-session";
import { getAccessControl } from "@/lib/store";
import { getValidTidAccessToken } from "@/lib/projectsight/session-token";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (isLocalAuthRequest(request)) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        return NextResponse.json({
          authenticated: true,
          mode: "local",
          isAdmin: true,
          user: {
            name: session.name || LOCAL_USER.name,
            email: session.email || LOCAL_USER.email,
            sub: session.sub || LOCAL_USER.sub,
            isAdmin: true,
          },
        });
      } catch {
        // fall through to default local user
      }
    }
    return NextResponse.json({
      authenticated: true,
      mode: "local",
      isAdmin: true,
      user: LOCAL_USER,
    });
  }

  const accessControl = getAccessControl();
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = parseVerifiedSession(sessionCookie, {
    allowedDomains: accessControl.allowedDomains,
    allowedEmails: accessControl.allowedEmails,
  });
  if (!session || !sessionCookie) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  try {
    if (
      session.email &&
      !isAllowedLoginEmail(session.email, accessControl.allowedDomains, accessControl.allowedEmails)
    ) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 403 });
    }

    const isPasskeySession = Boolean(session.sub && session.sub.startsWith("passkey:"));
    if (isPasskeySession && !accessControl.allowPasskeyLogin) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const { token, refreshedSession } = await getValidTidAccessToken(sessionCookie);
    const authenticated = Boolean(token) || (isPasskeySession && accessControl.allowPasskeyLogin);
    if (!authenticated) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const userIsAdmin = isAdminEmail(session.email, accessControl.adminEmails);

    const response = NextResponse.json({
      authenticated: true,
      mode: "tid",
      isAdmin: userIsAdmin,
      user: {
        name: session.name || "",
        email: session.email || "",
        sub: session.sub,
        isAdmin: userIsAdmin,
      },
    });

    if (refreshedSession) {
      const signed = signSessionPayload({
        ...refreshedSession,
        isAdmin: userIsAdmin,
        allowed: true,
      });
      response.cookies.set(SESSION_COOKIE, JSON.stringify(signed), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
