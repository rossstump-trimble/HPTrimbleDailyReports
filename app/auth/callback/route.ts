import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logAuthEvent, requestAuthSnapshot } from "@/lib/auth-debug";
import { publicAppUrl, tidOAuthRedirectUri } from "@/lib/public-origin";
import { decodeJWT, exchangeCodeForTokens, getTIDConfig } from "@/lib/tid-auth";
import { getAccessControl } from "@/lib/store";
import { saveServerSideTidTokens } from "@/lib/projectsight/session-token";
import {
  AUTH_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
  compactSignedSession,
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

function firstNonEmptyString(...values: unknown[]): string {
  for (const val of values) {
    if (typeof val === "string" && val.trim()) {
      return val.trim();
    }
  }
  return "";
}

async function fetchUserInfoEmail(accessToken: string): Promise<{
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  sub?: string;
}> {
  try {
    const config = getTIDConfig();
    const res = await fetch(`${config.issuer}/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, unknown>;
    return {
      email: firstNonEmptyString(data.email, data.preferred_username, data.upn),
      name: firstNonEmptyString(data.name),
      given_name: firstNonEmptyString(data.given_name),
      family_name: firstNonEmptyString(data.family_name),
      sub: firstNonEmptyString(data.sub),
    };
  } catch {
    return {};
  }
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

    let sub = firstNonEmptyString(idPayload?.sub, accessPayload?.sub);
    let email = firstNonEmptyString(
      idPayload?.email,
      accessPayload?.email,
      idPayload?.preferred_username,
      accessPayload?.preferred_username,
      idPayload?.upn,
      accessPayload?.upn,
      idPayload?.unique_name,
      accessPayload?.unique_name,
    ).toLowerCase();
    let givenName = firstNonEmptyString(
      idPayload?.given_name,
      accessPayload?.given_name,
      idPayload?.first_name,
      accessPayload?.first_name,
    );
    let familyName = firstNonEmptyString(
      idPayload?.family_name,
      accessPayload?.family_name,
      idPayload?.last_name,
      accessPayload?.last_name,
    );
    let rawName = firstNonEmptyString(idPayload?.name, accessPayload?.name);

    // If email was not embedded in id_token or access_token, query /oauth/userinfo
    if (!email && tokens.access_token) {
      const userInfo = await fetchUserInfoEmail(tokens.access_token);
      if (userInfo.email) email = userInfo.email.toLowerCase();
      if (!sub && userInfo.sub) sub = userInfo.sub;
      if (!givenName && userInfo.given_name) givenName = userInfo.given_name;
      if (!familyName && userInfo.family_name) familyName = userInfo.family_name;
      if (!rawName && userInfo.name) rawName = userInfo.name;
    }

    const name =
      rawName ||
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
    const expiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;

    // Persist full OAuth tokens server-side so browser cookies stay well under the 4KB limit
    saveServerSideTidTokens({
      sub,
      email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expires_at: expiresAt,
    });

    const fullSessionData = signSessionPayload({
      sub,
      email,
      name,
      given_name: givenName,
      family_name: familyName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expires_at: expiresAt,
      isAdmin: userIsAdmin,
      allowed: true,
    });

    const compactSession = compactSignedSession(fullSessionData);
    const fullSerialized = JSON.stringify(fullSessionData);
    // Browsers silently drop cookies > 4096 bytes after URL-encoding
    const sessionCookieValue =
      encodeURIComponent(fullSerialized).length <= 3400
        ? fullSerialized
        : JSON.stringify(compactSession);

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

    response.cookies.set(SESSION_COOKIE, sessionCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set(AUTH_COOKIE, JSON.stringify(compactSession), {
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
