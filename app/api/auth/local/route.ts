import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocalAuthRequest } from "@/lib/auth-mode";
import { applyLocalAuthCookies } from "@/lib/local-session";

export const dynamic = "force-dynamic";

function safeFrom(from: string | null): string {
  return from && from.startsWith("/") ? from : "/";
}

export async function GET(request: NextRequest) {
  if (!isLocalAuthRequest(request)) {
    return NextResponse.json(
      { error: "Local auth is only available on localhost or AUTH_MODE=local." },
      { status: 403 }
    );
  }

  const target = safeFrom(request.nextUrl.searchParams.get("from"));
  const response = NextResponse.redirect(new URL(target, request.url));
  applyLocalAuthCookies(response);
  return response;
}
