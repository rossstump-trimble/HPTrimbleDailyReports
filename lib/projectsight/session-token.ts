import { fetchClientCredentialsToken, refreshTIDTokens } from '@/lib/tid-auth';

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
}

export function tidAccessTokenFromCookie(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionCookiePayload;
    const token = typeof parsed.access_token === 'string' ? parsed.access_token : '';
    if (!token) return null;
    if (token === LOCAL_PLACEHOLDER_ACCESS_TOKEN) return null;
    return token;
  } catch {
    return null;
  }
}

export async function getValidTidAccessToken(
  raw: string | undefined,
): Promise<{ token: string | null; refreshedSession?: SessionCookiePayload }> {
  if (!raw) {
    try {
      const ccToken = await fetchClientCredentialsToken();
      return { token: ccToken };
    } catch {
      return { token: null };
    }
  }

  try {
    const parsed = JSON.parse(raw) as SessionCookiePayload;
    if (parsed.access_token === LOCAL_PLACEHOLDER_ACCESS_TOKEN) {
      return { token: null };
    }

    const now = Date.now();
    const isExpired = parsed.expires_at ? now >= parsed.expires_at - 120000 : false;

    if (parsed.access_token && !isExpired) {
      return { token: parsed.access_token };
    }

    if (parsed.refresh_token) {
      try {
        const tokens = await refreshTIDTokens(parsed.refresh_token);
        const updated: SessionCookiePayload = {
          ...parsed,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || parsed.refresh_token,
          expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
        };
        return { token: tokens.access_token, refreshedSession: updated };
      } catch (err) {
        console.error('[TID refresh error, falling back to client credentials]', err);
      }
    }

    try {
      const ccToken = await fetchClientCredentialsToken();
      return { token: ccToken };
    } catch {
      return { token: parsed.access_token || null };
    }
  } catch {
    return { token: null };
  }
}
