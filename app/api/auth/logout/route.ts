import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logAuthEvent, requestAuthSnapshot } from "@/lib/auth-debug";
import { publicAppUrl } from "@/lib/public-origin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const loginUrl = publicAppUrl(request, "/login");
  logAuthEvent("tid.logout", {
    ...requestAuthSnapshot(request),
    location: loginUrl.toString(),
  });
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
