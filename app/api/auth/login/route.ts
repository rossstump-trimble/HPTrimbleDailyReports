import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocalAuthRequest } from "@/lib/auth-mode";
import { logAuthEvent, requestAuthSnapshot } from "@/lib/auth-debug";
import { generatePKCE, getTIDConfig } from "@/lib/tid-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from") || "/";

  if (isLocalAuthRequest(request)) {
    const localUrl = new URL("/api/auth/local", request.url);
    localUrl.searchParams.set("from", from);
    logAuthEvent("tid.login.local", {
      ...requestAuthSnapshot(request),
      from,
      location: localUrl.toString(),
    });
    return NextResponse.redirect(localUrl);
  }

  const config = getTIDConfig();
  // Always advertise the registered public callback. Next behind Caddy sees
  // Host: localhost:3000, which Trimble Identity would then send the browser to.
  const redirectUri = config.callbackUrl;

  const { verifier, challenge, state } = generatePKCE();

  const authUrl = new URL(config.authorizeUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", config.scopes);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  logAuthEvent("tid.login.redirect", {
    ...requestAuthSnapshot(request),
    from,
    redirectUri,
    configuredBaseUrl: config.baseUrl,
    authorizeHost: authUrl.host,
    hasPkceCookie: true,
  });

  const response = NextResponse.redirect(authUrl.toString());

  const statePayload = JSON.stringify({
    verifier,
    state,
    from,
    redirectUri,
  });

  response.cookies.set("tid_pkce", statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
