import crypto from "crypto";

export interface TIDTokens {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface TIDUser {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
}

export function getTIDConfig() {
  const clientId = process.env.TID_CLIENT_ID || "57c84480-2c3d-4d4c-aede-4538b03b1bc4";
  const clientSecret = process.env.TID_CLIENT_SECRET || "";
  const issuer = (process.env.TID_ISSUER || "https://id.trimble.com").replace(/\/+$/, "");
  const scopes = process.env.TID_SCOPES || "openid ProjectSight_API_US1:ProjectSight_API_US1";
  const baseUrl = (process.env.PUBLIC_BASE_URL || "https://hp-trimble-lab.com").replace(/\/+$/, "");
  const callbackUrl = process.env.TID_CALLBACK_URL || `${baseUrl}/auth/callback`;

  return {
    clientId,
    clientSecret,
    issuer,
    scopes,
    baseUrl,
    callbackUrl,
    authorizeUrl: `${issuer}/oauth/authorize`,
    tokenUrl: `${issuer}/oauth/token`,
  };
}

export function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  const state = crypto.randomBytes(16).toString("base64url");
  return { verifier, challenge, state };
}

export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function exchangeCodeForTokens(
  code: string,
  verifier: string,
  redirectUri: string
): Promise<TIDTokens> {
  const config = getTIDConfig();
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
    client_id: config.clientId,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TID Token exchange failed (${response.status}): ${errText}`);
  }

  return response.json();
}
