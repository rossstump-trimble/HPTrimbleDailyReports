import { isLocalAuthRequest, isLoopbackHost, requestHostHeader } from "@/lib/auth-mode";
import { configuredPublicBaseUrl, configuredTidCallbackUrl } from "@/lib/public-base";

export function resolvePublicOrigin(request: { headers: Headers; url: string }): string {
  if (isLocalAuthRequest(request)) {
    return new URL(request.url).origin;
  }

  const forwardedHost = requestHostHeader(request.headers);
  if (forwardedHost && !isLoopbackHost(forwardedHost)) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }

  return configuredPublicBaseUrl();
}

export function publicAppUrl(
  request: { headers: Headers; url: string },
  pathAndQuery: string
): URL {
  return new URL(pathAndQuery, `${resolvePublicOrigin(request)}/`);
}

/** Never send Trimble Identity a loopback callback — that is how browsers get bounced to localhost:3000. */
export function tidOAuthRedirectUri(stored?: string): string {
  const configured = configuredTidCallbackUrl();
  if (!stored) return configured;
  try {
    if (isLoopbackHost(new URL(stored).host)) return configured;
  } catch {
    return configured;
  }
  return stored;
}
