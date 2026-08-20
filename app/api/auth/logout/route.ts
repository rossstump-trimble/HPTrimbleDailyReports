import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.set("ps_session", "", { path: "/", maxAge: 0 });
  response.cookies.set("ps-proto-auth", "", { path: "/", maxAge: 0 });
  response.cookies.set("ps_user", "", { path: "/", maxAge: 0 });
  response.cookies.set("tid_pkce", "", { path: "/", maxAge: 0 });

  return response;
}

export async function POST(request: NextRequest) {
  return GET(request);
}
