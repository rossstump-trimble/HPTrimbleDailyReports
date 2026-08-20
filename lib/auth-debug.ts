const LOG_PREFIX = "[tid-auth]";
const LOOPBACK_RE = /localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0/i;

export type AuthDebugRequest = { headers: Headers; url: string };

export function isLoopbackValue(value: string): boolean {
  return LOOPBACK_RE.test(value);
}

export function loopbackFieldNames(fields: Record<string, unknown>): string[] {
  return Object.entries(fields)
    .filter(([, value]) => typeof value === "string" && isLoopbackValue(value))
    .map(([key]) => key);
}

export function requestAuthSnapshot(request: AuthDebugRequest): Record<string, unknown> {
  let requestOrigin = "";
  let requestPath = "";
  let searchParamKeys: string[] = [];
  try {
    const parsed = new URL(request.url);
    requestOrigin = parsed.origin;
    requestPath = parsed.pathname;
    searchParamKeys = Array.from(parsed.searchParams.keys());
  } catch {
    requestOrigin = "invalid-url";
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookieNames = cookieHeader
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter(Boolean);

  return {
    requestOrigin,
    requestPath,
    searchParamKeys,
    host: request.headers.get("host") || "",
    xForwardedHost: request.headers.get("x-forwarded-host") || "",
    xForwardedProto: request.headers.get("x-forwarded-proto") || "",
    cookieNames,
    authModeEnv: process.env.AUTH_MODE || "unset",
    publicBaseUrl: process.env.PUBLIC_BASE_URL || "",
    tidCallbackUrl: process.env.TID_CALLBACK_URL || "",
  };
}

export function logAuthEvent(event: string, fields: Record<string, unknown>): void {
  const loopbackFields = loopbackFieldNames(fields);
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...fields,
    loopbackFields,
  };
  const line = JSON.stringify(payload);
  if (loopbackFields.length > 0) {
    console.warn(LOG_PREFIX, "LOOPBACK", line);
    return;
  }
  console.info(LOG_PREFIX, line);
}
