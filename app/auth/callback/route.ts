import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJWT, exchangeCodeForTokens } from "@/lib/tid-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (!code || !state) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Missing authorization code or state");
    return NextResponse.redirect(loginUrl);
  }

  const pkceCookie = request.cookies.get("tid_pkce")?.value;
  if (!pkceCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Session state expired. Please sign in again.");
    return NextResponse.redirect(loginUrl);
  }

  let parsedPkce: { verifier: string; state: string; from?: string; redirectUri?: string };
  try {
    parsedPkce = JSON.parse(pkceCookie);
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Invalid session state.");
    return NextResponse.redirect(loginUrl);
  }

  if (parsedPkce.state !== state) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "State verification failed.");
    return NextResponse.redirect(loginUrl);
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "hp-trimble-lab.com";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const redirectUri = parsedPkce.redirectUri || `${proto}://${host}/auth/callback`;

  try {
    const tokens = await exchangeCodeForTokens(code, parsedPkce.verifier, redirectUri);
    const idPayload = tokens.id_token ? decodeJWT(tokens.id_token) : null;
    const accessPayload = tokens.access_token ? decodeJWT(tokens.access_token) : null;
    const payload = idPayload || accessPayload || {};

    const sub = (payload.sub as string) || "";
    const email = (payload.email as string) || (payload.preferred_username as string) || "ross_stump@trimble.com";
    const givenName = (payload.given_name as string) || "";
    const familyName = (payload.family_name as string) || "";
    const name = (payload.name as string) || (givenName ? `${givenName} ${familyName}`.trim() : email.split("@")[0]);

    const sessionData = {
      sub,
      email,
      name,
      given_name: givenName,
      family_name: familyName,
      access_token: tokens.access_token,
      expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
    };

    const target = parsedPkce.from && parsedPkce.from.startsWith("/") ? parsedPkce.from : "/";
    const response = NextResponse.redirect(new URL(target, request.url));

    const maxAge = 60 * 60 * 24 * 7; // 7 days

    response.cookies.set("ps_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set("ps-proto-auth", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set("ps_user", JSON.stringify({ name, email, sub }), {
      httpOnly: false, // readable by client UI
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // Clear temporary PKCE cookie
    response.cookies.set("tid_pkce", "", { path: "/", maxAge: 0 });

    return response;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", `Authentication failed: ${errMsg}`);
    return NextResponse.redirect(loginUrl);
  }
}
