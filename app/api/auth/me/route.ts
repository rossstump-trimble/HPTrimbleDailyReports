import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocalAuthRequest } from "@/lib/auth-mode";
import { LOCAL_USER } from "@/lib/local-session";
import { getValidTidAccessToken } from "@/lib/projectsight/session-token";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (isLocalAuthRequest(request)) {
    const sessionCookie = request.cookies.get("ps_session")?.value;
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        return NextResponse.json({
          authenticated: true,
          mode: "local",
          user: {
            name: session.name || LOCAL_USER.name,
            email: session.email || LOCAL_USER.email,
            sub: session.sub || LOCAL_USER.sub,
          },
        });
      } catch {
        // fall through to default local user
      }
    }
    return NextResponse.json({
      authenticated: true,
      mode: "local",
      user: LOCAL_USER,
    });
  }

  const sessionCookie = request.cookies.get("ps_session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie);
    const { token, refreshedSession } = await getValidTidAccessToken(sessionCookie);

    const response = NextResponse.json({
      authenticated: Boolean(token),
      mode: "tid",
      user: {
        name: session.name || "",
        email: session.email || "",
        sub: session.sub,
      },
    });

    if (refreshedSession) {
      response.cookies.set("ps_session", JSON.stringify(refreshedSession), {
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
