import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocalAuthRequest } from "@/lib/auth-mode";
import { LOCAL_USER } from "@/lib/local-session";

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
    return NextResponse.json({
      authenticated: true,
      mode: "tid",
      user: {
        name: session.name || "Ross Stump",
        email: session.email || "ross_stump@trimble.com",
        sub: session.sub,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
