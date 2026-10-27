import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isLocalAuthRequest } from "@/lib/auth-mode";
import {
  LOCAL_USER,
  SESSION_COOKIE,
  isAdminEmail,
  parseVerifiedSession,
  type SessionData,
} from "@/lib/local-session";
import { getAccessControl } from "@/lib/store";

export interface AuthenticatedContext {
  authenticated: boolean;
  isAdmin: boolean;
  email: string;
  name: string;
  session: SessionData | null;
}

export function getRequestAuthContext(req: Request): AuthenticatedContext {
  if (isLocalAuthRequest(req)) {
    return {
      authenticated: true,
      isAdmin: true,
      email: LOCAL_USER.email,
      name: LOCAL_USER.name,
      session: {
        sub: LOCAL_USER.sub,
        email: LOCAL_USER.email,
        name: LOCAL_USER.name,
        isAdmin: true,
        allowed: true,
      },
    };
  }

  try {
    const accessControl = getAccessControl();
    const jar = cookies();
    const rawCookie = jar.get(SESSION_COOKIE)?.value;
    const session = parseVerifiedSession(rawCookie, {
      allowedDomains: accessControl.allowedDomains,
      allowedEmails: accessControl.allowedEmails,
    });
    if (!session) {
      return { authenticated: false, isAdmin: false, email: "", name: "", session: null };
    }

    const isPasskeySession = Boolean(session.sub && session.sub.startsWith("passkey:"));
    if (isPasskeySession && !accessControl.allowPasskeyLogin) {
      return { authenticated: false, isAdmin: false, email: "", name: "", session: null };
    }

    const userIsAdmin = isAdminEmail(session.email, accessControl.adminEmails);
    return {
      authenticated: true,
      isAdmin: userIsAdmin,
      email: session.email || "",
      name: session.name || "",
      session,
    };
  } catch {
    return { authenticated: false, isAdmin: false, email: "", name: "", session: null };
  }
}

export function requireAuthResponse(req: Request): NextResponse | null {
  const ctx = getRequestAuthContext(req);
  if (!ctx.authenticated) {
    return NextResponse.json(
      { success: false, error: "Authentication required via Trimble Identity." },
      { status: 401 },
    );
  }
  return null;
}

export function requireAdminResponse(req: Request): NextResponse | null {
  const ctx = getRequestAuthContext(req);
  if (!ctx.authenticated) {
    return NextResponse.json(
      { success: false, error: "Authentication required via Trimble Identity." },
      { status: 401 },
    );
  }
  if (!ctx.isAdmin) {
    return NextResponse.json(
      { success: false, error: "Administrator privileges required for this action." },
      { status: 403 },
    );
  }
  return null;
}
