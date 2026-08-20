import { isLoopbackHost } from "@/lib/auth-mode";

export const PUBLIC_APP_FALLBACK = "https://hp-trimble-lab.com";

function rejectLoopbackUrl(url: string, fallback: string): string {
  try {
    if (isLoopbackHost(new URL(url).host)) return fallback;
  } catch {
    return fallback;
  }
  return url;
}

export function configuredPublicBaseUrl(): string {
  const raw = (process.env.PUBLIC_BASE_URL || PUBLIC_APP_FALLBACK).replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production" && process.env.AUTH_MODE !== "local") {
    return rejectLoopbackUrl(raw, PUBLIC_APP_FALLBACK);
  }
  return raw;
}

export function configuredTidCallbackUrl(): string {
  const fallback = `${configuredPublicBaseUrl()}/auth/callback`;
  const raw = (process.env.TID_CALLBACK_URL || fallback).replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production" && process.env.AUTH_MODE !== "local") {
    return rejectLoopbackUrl(raw, `${PUBLIC_APP_FALLBACK}/auth/callback`);
  }
  return raw;
}
