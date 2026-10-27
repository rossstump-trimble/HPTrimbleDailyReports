import { NextResponse } from "next/server";

export const AUTH_COOKIE = "ps-proto-auth";
export const SESSION_COOKIE = "ps_session";
export const USER_COOKIE = "ps_user";

export const LOCAL_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const DEFAULT_ALLOWED_EMAIL_DOMAINS = ["henselphelps.com", "trimble.com"] as const;
export const DEFAULT_ADMIN_EMAILS_LIST = [
  "ross_stump@trimble.com",
  "nathan_patton@trimble.com",
  "jadan_anderson@trimble.com",
  "egrim@henselphelps.com",
] as const;

export const LOCAL_USER = {
  name: "Local Developer",
  email: "local@trimble.com",
  sub: "local-dev",
  isAdmin: true,
} as const;

export interface SessionData {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  session_expires_at?: number;
  isAdmin?: boolean;
  allowed?: boolean;
  sig?: string;
}

function getSigningSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.TID_CLIENT_SECRET;
  if (secret && secret.trim().length >= 16) {
    return secret.trim();
  }
  if (process.env.NODE_ENV === "production") {
    // In production, if SESSION_SECRET and TID_CLIENT_SECRET are both unset,
    // use a per-process ephemeral key so nothing can be forged from static source code.
    return FALLBACK_PROCESS_SECRET;
  }
  return "dev-only-local-session-secret-do-not-use-in-prod";
}

const FALLBACK_PROCESS_SECRET =
  typeof globalThis !== "undefined" && (globalThis as Record<string, unknown>).__hpSessionSecret
    ? String((globalThis as Record<string, unknown>).__hpSessionSecret)
    : (() => {
        const rand = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
        if (typeof globalThis !== "undefined") {
          (globalThis as Record<string, unknown>).__hpSessionSecret = rand;
        }
        return rand;
      })();

// Pure JS SHA-256 + HMAC-SHA256 implementation so Edge middleware and Node routes can both sign/verify synchronously
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

function sha256Bytes(msg: Uint8Array): Uint8Array {
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const bitLen = msg.length * 8;
  const padLen = ((msg.length + 9 + 63) & ~63);
  const padded = new Uint8Array(padLen);
  padded.set(msg);
  padded[msg.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(padLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  for (let offset = 0; offset < padLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);
  return out;
}

function hmacSha256Hex(keyStr: string, messageStr: string): string {
  const enc = new TextEncoder();
  let keyBytes = enc.encode(keyStr);
  if (keyBytes.length > 64) {
    keyBytes = new Uint8Array(sha256Bytes(keyBytes));
  }
  const blockKey = new Uint8Array(64);
  blockKey.set(keyBytes);

  const oKeyPad = new Uint8Array(64);
  const iKeyPad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    oKeyPad[i] = blockKey[i] ^ 0x5c;
    iKeyPad[i] = blockKey[i] ^ 0x36;
  }

  const msgBytes = enc.encode(messageStr);
  const innerInput = new Uint8Array(64 + msgBytes.length);
  innerInput.set(iKeyPad);
  innerInput.set(msgBytes, 64);
  const innerHash = sha256Bytes(innerInput);

  const outerInput = new Uint8Array(64 + 32);
  outerInput.set(oKeyPad);
  outerInput.set(innerHash, 64);
  const digest = sha256Bytes(outerInput);

  let hex = "";
  for (let i = 0; i < digest.length; i++) {
    hex += digest[i].toString(16).padStart(2, "0");
  }
  return hex;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function computeSessionSignature(payload: {
  sub?: string;
  email?: string;
  expires_at?: number;
  session_expires_at?: number;
  isAdmin?: boolean;
  allowed?: boolean;
}): string {
  const secret = getSigningSecret();
  const canonical = [
    payload.sub || "",
    (payload.email || "").toLowerCase(),
    String(payload.expires_at || 0),
    String(payload.session_expires_at || 0),
    payload.isAdmin ? "admin:1" : "admin:0",
    payload.allowed !== false ? "allow:1" : "allow:0",
  ].join("|");
  return hmacSha256Hex(secret, canonical);
}

export function signSessionPayload(session: SessionData): SessionData {
  const now = Date.now();
  const expiresAt = session.expires_at || now + LOCAL_MAX_AGE_SECONDS * 1000;
  const sessionExpiresAt = session.session_expires_at || now + LOCAL_MAX_AGE_SECONDS * 1000;
  const normalized: SessionData = {
    ...session,
    expires_at: expiresAt,
    session_expires_at: sessionExpiresAt,
    allowed: session.allowed ?? true,
  };
  normalized.sig = computeSessionSignature(normalized);
  return normalized;
}

export function isAllowedLoginEmail(
  email: string | undefined | null,
  customDomains?: string[],
  customEmails?: string[],
): boolean {
  const clean = (email || "").trim().toLowerCase();
  if (!clean || !clean.includes("@")) return false;
  if (clean === "local@localhost" || clean === "local@trimble.com") return true;

  const allowedEmails = (customEmails || []).map((e) => e.trim().toLowerCase());
  if (allowedEmails.includes(clean)) return true;

  const domain = clean.split("@")[1]?.trim().toLowerCase();
  if (!domain) return false;

  const envDomains = (process.env.ALLOWED_LOGIN_DOMAINS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@+/, ""))
    .filter(Boolean);

  const domains =
    customDomains && customDomains.length > 0
      ? customDomains.map((d) => d.trim().toLowerCase().replace(/^@+/, ""))
      : envDomains.length > 0
      ? envDomains
      : [...DEFAULT_ALLOWED_EMAIL_DOMAINS];

  return domains.some((allowed) => domain === allowed);
}

export function isAdminEmail(
  email: string | undefined | null,
  customAdmins?: string[],
): boolean {
  const clean = (email || "").trim().toLowerCase();
  if (!clean) return false;
  if (clean === "local@localhost" || clean === "local@trimble.com") return true;

  const envAdmins = (process.env.ACCESS_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const adminList =
    customAdmins && customAdmins.length > 0
      ? [...customAdmins.map((e) => e.trim().toLowerCase()), ...envAdmins]
      : [...DEFAULT_ADMIN_EMAILS_LIST, ...envAdmins];

  return adminList.includes(clean);
}

export function localSessionPayload(): SessionData {
  return signSessionPayload({
    sub: LOCAL_USER.sub,
    email: LOCAL_USER.email,
    name: LOCAL_USER.name,
    given_name: "Local",
    family_name: "Developer",
    access_token: "local-dev-no-tid",
    expires_at: Date.now() + LOCAL_MAX_AGE_SECONDS * 1000,
    session_expires_at: Date.now() + LOCAL_MAX_AGE_SECONDS * 1000,
    isAdmin: true,
    allowed: true,
  });
}

export function applyLocalAuthCookies(response: NextResponse): NextResponse {
  const secure = process.env.NODE_ENV === "production";
  const httpOnly = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: LOCAL_MAX_AGE_SECONDS,
  };

  const payload = localSessionPayload();
  response.cookies.set(AUTH_COOKIE, payload.sig || "1", httpOnly);
  response.cookies.set(SESSION_COOKIE, JSON.stringify(payload), httpOnly);
  response.cookies.set(USER_COOKIE, JSON.stringify(LOCAL_USER), {
    ...httpOnly,
    httpOnly: false,
  });

  return response;
}

export function parseVerifiedSession(
  rawCookie: string | undefined,
  policy?: { allowedDomains?: string[]; allowedEmails?: string[] },
): SessionData | null {
  if (!rawCookie) return null;
  try {
    const parsed = JSON.parse(rawCookie) as SessionData;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.sig || typeof parsed.sig !== "string") return null;

    const expectedSig = computeSessionSignature(parsed);
    if (!constantTimeEqual(parsed.sig, expectedSig)) {
      return null;
    }

    const expiryToCheck = parsed.session_expires_at ?? parsed.expires_at;
    if (!expiryToCheck || Date.now() > expiryToCheck) {
      return null;
    }

    if (policy) {
      if (!isAllowedLoginEmail(parsed.email, policy.allowedDomains, policy.allowedEmails)) {
        return null;
      }
    } else if (parsed.allowed !== true) {
      if (!isAllowedLoginEmail(parsed.email)) {
        return null;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

export function hasLocalOrTidSession(request: {
  cookies: { get: (name: string) => { value: string } | undefined; has: (name: string) => boolean };
}): boolean {
  const rawSession = request.cookies.get(SESSION_COOKIE)?.value;
  const verified = parseVerifiedSession(rawSession);
  return verified !== null;
}

export function safeRedirectPath(from: string | null | undefined, fallback = "/"): string {
  if (!from || typeof from !== "string") return fallback;
  const trimmed = from.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }
  // Reject control characters (tabs, newlines, CR) or backslashes that WHATWG URL strips
  if (/[\x00-\x1f\x7f\\]/.test(trimmed)) {
    return fallback;
  }
  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
