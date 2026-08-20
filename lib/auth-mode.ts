export type AuthMode = "local" | "tid";

export type AuthModeSource = AuthMode | "unset";

function parseAuthModeEnv(raw: string | undefined): AuthModeSource {
  const value = (raw ?? "").trim().toLowerCase();
  switch (value) {
    case "local":
      return "local";
    case "tid":
      return "tid";
    case "":
      return "unset";
    default:
      return "unset";
  }
}

export function isLoopbackHost(hostHeader: string): boolean {
  const raw = hostHeader.trim().toLowerCase();
  let hostname = raw;
  if (raw.startsWith("[")) {
    const end = raw.indexOf("]");
    hostname = end === -1 ? raw : raw.slice(0, end + 1);
  } else if (raw.includes(":") && !raw.startsWith("::")) {
    hostname = raw.split(":")[0];
  }

  switch (hostname) {
    case "localhost":
    case "127.0.0.1":
    case "[::1]":
    case "::1":
      return true;
    default:
      return false;
  }
}

export function resolveAuthMode(opts: {
  authModeEnv?: string;
  hostHeader?: string;
}): AuthMode {
  const explicit = parseAuthModeEnv(opts.authModeEnv);
  switch (explicit) {
    case "local":
      return "local";
    case "tid":
      return "tid";
    case "unset": {
      return isLoopbackHost(opts.hostHeader ?? "") ? "local" : "tid";
    }
    default: {
      const _exhaustive: never = explicit;
      return _exhaustive;
    }
  }
}

export function requestHostHeader(headers: Headers): string {
  return headers.get("x-forwarded-host") || headers.get("host") || "";
}

export function isLocalAuthRequest(request: { headers: Headers }): boolean {
  return (
    resolveAuthMode({
      authModeEnv: process.env.AUTH_MODE,
      hostHeader: requestHostHeader(request.headers),
    }) === "local"
  );
}
