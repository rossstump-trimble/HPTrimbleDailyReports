import fs from 'fs';
import path from 'path';
import { refreshTIDTokens } from '@/lib/tid-auth';

const LOCAL_PLACEHOLDER_ACCESS_TOKEN = 'local-dev-no-tid';

export const SESSION_COOKIE = 'ps_session';

export interface SessionCookiePayload {
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

interface StoredTokenEntry {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  updated_at: number;
  refresh_failed_until?: number;
}

const memoryTokenStore = new Map<string, StoredTokenEntry>();
const inFlightRefreshes = new Map<string, Promise<StoredTokenEntry | null>>();

function getTokenStorePath(): string {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return path.join(process.cwd(), 'data', 'tid-tokens-test.json');
  }
  return path.join(process.cwd(), 'data', 'tid-tokens.json');
}

function userKeys(payload: { sub?: string; email?: string }): string[] {
  const keys: string[] = [];
  if (payload.sub?.trim()) keys.push(`sub:${payload.sub.trim()}`);
  if (payload.email?.trim()) keys.push(`email:${payload.email.trim().toLowerCase()}`);
  return keys;
}

function loadDiskTokens(): Record<string, StoredTokenEntry> {
  try {
    const filePath = getTokenStorePath();
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, StoredTokenEntry>;
  } catch {
    return {};
  }
}

function saveDiskTokens(entries: Record<string, StoredTokenEntry>): void {
  try {
    const filePath = getTokenStorePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmp = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
    fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf-8');
    fs.renameSync(tmp, filePath);
  } catch {
    // ignore disk cache write errors
  }
}

export function saveServerSideTidTokens(payload: {
  sub?: string;
  email?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}): void {
  if (!payload.access_token || payload.access_token === LOCAL_PLACEHOLDER_ACCESS_TOKEN) return;
  const keys = userKeys(payload);
  if (keys.length === 0) return;

  const entry: StoredTokenEntry = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: payload.expires_at || Date.now() + 3600_000,
    updated_at: Date.now(),
  };

  const disk = loadDiskTokens();
  for (const k of keys) {
    memoryTokenStore.set(k, entry);
    disk[k] = entry;
  }
  saveDiskTokens(disk);
}

function getServerSideTidTokens(payload: { sub?: string; email?: string }): StoredTokenEntry | null {
  const keys = userKeys(payload);
  for (const k of keys) {
    const mem = memoryTokenStore.get(k);
    if (mem) return mem;
  }
  const disk = loadDiskTokens();
  for (const k of keys) {
    const d = disk[k];
    if (d) {
      memoryTokenStore.set(k, d);
      return d;
    }
  }
  return null;
}

export function tidAccessTokenFromCookie(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionCookiePayload;
    const token = typeof parsed.access_token === 'string' ? parsed.access_token : '';
    if (token && token !== LOCAL_PLACEHOLDER_ACCESS_TOKEN) {
      if (!parsed.expires_at || Date.now() < parsed.expires_at) {
        return token;
      }
    }
    const cached = getServerSideTidTokens(parsed);
    if (cached && cached.access_token && Date.now() < cached.expires_at) {
      return cached.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getValidTidAccessToken(
  raw: string | undefined,
): Promise<{ token: string | null; refreshedSession?: SessionCookiePayload }> {
  if (!raw) {
    return { token: null };
  }

  try {
    const parsed = JSON.parse(raw) as SessionCookiePayload;
    if (parsed.access_token === LOCAL_PLACEHOLDER_ACCESS_TOKEN) {
      return { token: null };
    }

    const now = Date.now();
    const cached = getServerSideTidTokens(parsed);

    // Prefer fresher server-side cached token if available
    const effectiveAccessToken =
      cached && (!parsed.expires_at || cached.expires_at >= parsed.expires_at)
        ? cached.access_token
        : parsed.access_token;
    const effectiveRefreshToken = cached?.refresh_token || parsed.refresh_token;
    const effectiveExpiresAt =
      cached && (!parsed.expires_at || cached.expires_at >= parsed.expires_at)
        ? cached.expires_at
        : parsed.expires_at;

    const isExpired = effectiveExpiresAt ? now >= effectiveExpiresAt - 120_000 : false;

    if (effectiveAccessToken && !isExpired) {
      return { token: effectiveAccessToken };
    }

    if (cached?.refresh_failed_until && now < cached.refresh_failed_until) {
      return { token: null };
    }

    if (effectiveRefreshToken) {
      const lockKey = userKeys(parsed)[0] || `rt:${effectiveRefreshToken.slice(-16)}`;
      let inflight = inFlightRefreshes.get(lockKey);
      if (!inflight) {
        inflight = (async () => {
          try {
            const tokens = await refreshTIDTokens(effectiveRefreshToken);
            const newExpiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;
            const entry: StoredTokenEntry = {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || effectiveRefreshToken,
              expires_at: newExpiresAt,
              updated_at: Date.now(),
            };
            saveServerSideTidTokens({
              sub: parsed.sub,
              email: parsed.email,
              access_token: entry.access_token,
              refresh_token: entry.refresh_token,
              expires_at: entry.expires_at,
            });
            return entry;
          } catch (err) {
            console.error('[TID refresh error]', err);
            const failedEntry: StoredTokenEntry = {
              access_token: '',
              refresh_token: effectiveRefreshToken,
              expires_at: 0,
              updated_at: Date.now(),
              // Back off for 5 minutes so concurrent/subsequent page loads do not hammer id.trimble.com
              refresh_failed_until: Date.now() + 5 * 60_000,
            };
            for (const k of userKeys(parsed)) {
              memoryTokenStore.set(k, failedEntry);
            }
            return null;
          } finally {
            inFlightRefreshes.delete(lockKey);
          }
        })();
        inFlightRefreshes.set(lockKey, inflight);
      }

      const refreshed = await inflight;
      if (refreshed && refreshed.access_token) {
        const updated: SessionCookiePayload = {
          ...parsed,
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: refreshed.expires_at,
        };
        return { token: refreshed.access_token, refreshedSession: updated };
      }
      return { token: null };
    }

    return { token: isExpired ? null : (effectiveAccessToken || null) };
  } catch {
    return { token: null };
  }
}
