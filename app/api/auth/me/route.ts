import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("ps_session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie);
    return NextResponse.json({
      authenticated: true,
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
