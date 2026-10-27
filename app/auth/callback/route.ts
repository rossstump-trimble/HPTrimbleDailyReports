import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logAuthEvent, requestAuthSnapshot } from "@/lib/auth-debug";
import { publicAppUrl, tidOAuthRedirectUri } from "@/lib/public-origin";
import { decodeJWT, exchangeCodeForTokens } from "@/lib/tid-auth";
import { getAccessControl } from "@/lib/store";
import {
  AUTH_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
  isAllowedLoginEmail,
  isAdminEmail,
  safeRedirectPath,
  signSessionPayload,
} from "@/lib/local-session";

export const dynamic = "force-dynamic";

function failToLogin(
  request: NextRequest,
  error: string,
  extra: Record<string, unknown> = {}
): NextResponse {
  const loginUrl = publicAppUrl(request, "/login");
  loginUrl.searchParams.set("error", error);
  logAuthEvent("tid.callback.fail", {
    ...requestAuthSnapshot(request),
    error,
    location: loginUrl.toString(),
    ...extra,
  });
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  logAuthEvent("tid.callback.start", {
    ...requestAuthSnapshot(request),
    hasCode: Boolean(code),
    hasState: Boolean(state),
    tidError: error || "",
  });

  if (error) {
    return failToLogin(request, errorDescription || error, { tidError: error });
  }

  if (!code || !state) {
    return failToLogin(request, "Missing authorization code or state");
  }

  const pkceCookie = request.cookies.get("tid_pkce")?.value;
  if (!pkceCookie) {
    return failToLogin(request, "Session state expired. Please sign in again.", {
      hasPkceCookie: false,
    });
  }

  let parsedPkce: { verifier: string; state: string; from?: string; redirectUri?: string };
  try {
    parsedPkce = JSON.parse(pkceCookie);
  } catch {
    return failToLogin(request, "Invalid session state.", { pkceParse: "invalid-json" });
  }

  if (parsedPkce.state !== state) {
    return failToLogin(request, "State verification failed.", { stateMatch: false });
  }

  const storedRedirectUri = parsedPkce.redirectUri || "";
  const redirectUri = tidOAuthRedirectUri(parsedPkce.redirectUri);

  logAuthEvent("tid.callback.exchange", {
    ...requestAuthSnapshot(request),
    storedRedirectUri,
    redirectUri,
    from: parsedPkce.from || "/",
    replacedLoopbackCallback: Boolean(storedRedirectUri) && storedRedirectUri !== redirectUri,
  });

  try {
    const tokens = await exchangeCodeForTokens(code, parsedPkce.verifier, redirectUri);
    const idPayload = tokens.id_token ? decodeJWT(tokens.id_token) : null;
    const accessPayload = tokens.access_token ? decodeJWT(tokens.access_token) : null;
    const payload = idPayload || accessPayload || {};

    const sub = (payload.sub as string) || "";
    const email = (
      (payload.email as string) ||
      (payload.preferred_username as string) ||
      (payload.upn as string) ||
      ""
    )
      .trim()
      .toLowerCase();
    const givenName = (payload.given_name as string) || "";
    const familyName = (payload.family_name as string) || "";
    const name =
      (payload.name as string) ||
      (givenName ? `${givenName} ${familyName}`.trim() : email ? email.split("@")[0] : "");

    const accessControl = getAccessControl();
    if (!isAllowedLoginEmail(email, accessControl.allowedDomains, accessControl.allowedEmails)) {
      const domainList = accessControl.allowedDomains.map((d) => `@${d}`).join(" or ");
      return failToLogin(
        request,
        `Access restricted: Only ${domainList} email addresses are authorized to sign in (${email || "no email in token"}).`,
        { rejectedEmail: email },
      );
    }

    const userIsAdmin = isAdminEmail(email, accessControl.adminEmails);

    const sessionData = signSessionPayload({
      sub,
      email,
      name,
      given_name: givenName,
      family_name: familyName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
      isAdmin: userIsAdmin,
    });

    const target = safeRedirectPath(parsedPkce.from, "/");
    const location = publicAppUrl(request, target);
    const response = NextResponse.redirect(location);

    logAuthEvent("tid.callback.ok", {
      ...requestAuthSnapshot(request),
      location: location.toString(),
      target,
      hasAccessToken: Boolean(tokens.access_token),
      expiresIn: tokens.expires_in || 0,
      emailDomain: email.includes("@") ? email.split("@")[1] : "",
    });

    const maxAge = 60 * 60 * 24 * 7; // 7 days

    response.cookies.set(SESSION_COOKIE, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set(AUTH_COOKIE, sessionData.sig || "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set(
      USER_COOKIE,
      JSON.stringify({ name, email, sub, isAdmin: userIsAdmin }),
      {
        httpOnly: false, // readable by client UI
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
      },
    );

    // Clear temporary PKCE cookie
    response.cookies.set("tid_pkce", "", { path: "/", maxAge: 0 });

    return response;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return failToLogin(request, `Authentication failed: ${errMsg}`, {
      exchangeError: errMsg.slice(0, 400),
      redirectUri,
    });
  }
}
