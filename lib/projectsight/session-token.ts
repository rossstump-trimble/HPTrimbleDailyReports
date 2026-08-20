const LOCAL_PLACEHOLDER_ACCESS_TOKEN = 'local-dev-no-tid';

export const SESSION_COOKIE = 'ps_session';

export function tidAccessTokenFromCookie(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { access_token?: unknown };
    const token = typeof parsed.access_token === 'string' ? parsed.access_token : '';
    if (!token) return null;
    if (token === LOCAL_PLACEHOLDER_ACCESS_TOKEN) return null;
    return token;
  } catch {
    return null;
  }
}
