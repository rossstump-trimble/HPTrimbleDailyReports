export const LAST_PROJECT_STORAGE_KEY = "hp_last_project_id";
export const DEFAULT_PROJECT_STORAGE_KEY = "hp_default_project_id";
export const ACTIVE_PROJECT_EVENT = "hp-active-project-change";
export const FALLBACK_PROJECT_ID = "1025";

export function extractProjectIdFromPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const match = pathname.match(/\/projects\/([^/?#]+)/) || pathname.match(/\/intake\/([^/?#]+)/);
  if (!match || !match[1]) return null;
  return decodeURIComponent(match[1]);
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const found = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  if (!found) return null;
  try {
    return decodeURIComponent(found.slice(prefix.length)) || null;
  } catch {
    return found.slice(prefix.length) || null;
  }
}

function writeCookie(name: string, value: string | null): void {
  if (typeof document === "undefined") return;
  if (!value) {
    document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
    return;
  }
  const maxAge = 60 * 60 * 24 * 90; // 90 days
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function getLastSelectedProjectId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromStorage = window.localStorage.getItem(LAST_PROJECT_STORAGE_KEY)?.trim();
    if (fromStorage) return fromStorage;
  } catch {
    // ignore storage errors
  }
  return readCookie(LAST_PROJECT_STORAGE_KEY);
}

export function getDefaultProjectId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromStorage = window.localStorage.getItem(DEFAULT_PROJECT_STORAGE_KEY)?.trim();
    if (fromStorage) return fromStorage;
  } catch {
    // ignore storage errors
  }
  return readCookie(DEFAULT_PROJECT_STORAGE_KEY);
}

export function setLastSelectedProjectId(projectId: string): void {
  const clean = projectId.trim();
  if (!clean || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_PROJECT_STORAGE_KEY, clean);
  } catch {
    // ignore storage errors
  }
  writeCookie(LAST_PROJECT_STORAGE_KEY, clean);
  window.dispatchEvent(
    new CustomEvent(ACTIVE_PROJECT_EVENT, {
      detail: { lastProjectId: clean, defaultProjectId: getDefaultProjectId() },
    }),
  );
}

export function setDefaultProjectId(projectId: string | null): void {
  const clean = projectId?.trim() || null;
  if (typeof window === "undefined") return;
  try {
    if (clean) {
      window.localStorage.setItem(DEFAULT_PROJECT_STORAGE_KEY, clean);
      window.localStorage.setItem(LAST_PROJECT_STORAGE_KEY, clean);
    } else {
      window.localStorage.removeItem(DEFAULT_PROJECT_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
  writeCookie(DEFAULT_PROJECT_STORAGE_KEY, clean);
  if (clean) {
    writeCookie(LAST_PROJECT_STORAGE_KEY, clean);
  }
  window.dispatchEvent(
    new CustomEvent(ACTIVE_PROJECT_EVENT, {
      detail: { lastProjectId: getLastSelectedProjectId(), defaultProjectId: clean },
    }),
  );
}

export function clearRememberedProjectIfMatches(deletedProjectId: string): void {
  const cleanDeleted = deletedProjectId.trim().toLowerCase();
  if (!cleanDeleted || typeof window === "undefined") return;
  const last = getLastSelectedProjectId();
  const def = getDefaultProjectId();
  let changed = false;
  try {
    if (last && last.toLowerCase() === cleanDeleted) {
      window.localStorage.removeItem(LAST_PROJECT_STORAGE_KEY);
      writeCookie(LAST_PROJECT_STORAGE_KEY, null);
      changed = true;
    }
    if (def && def.toLowerCase() === cleanDeleted) {
      window.localStorage.removeItem(DEFAULT_PROJECT_STORAGE_KEY);
      writeCookie(DEFAULT_PROJECT_STORAGE_KEY, null);
      changed = true;
    }
  } catch {
    // ignore
  }
  if (changed) {
    window.dispatchEvent(
      new CustomEvent(ACTIVE_PROJECT_EVENT, {
        detail: { lastProjectId: getLastSelectedProjectId(), defaultProjectId: getDefaultProjectId() },
      }),
    );
  }
}

export function resolveActiveProjectId(opts: {
  pathname?: string | null;
  lastProjectId?: string | null;
  defaultProjectId?: string | null;
  fallback?: string;
}): string {
  const fromPath = extractProjectIdFromPath(opts.pathname);
  if (fromPath) return fromPath;
  if (opts.lastProjectId?.trim()) return opts.lastProjectId.trim();
  if (opts.defaultProjectId?.trim()) return opts.defaultProjectId.trim();
  return opts.fallback || FALLBACK_PROJECT_ID;
}
