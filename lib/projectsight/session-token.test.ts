import { describe, it, expect } from 'vitest';
import { getValidTidAccessToken, tidAccessTokenFromCookie } from './session-token';

describe('tidAccessTokenFromCookie', () => {
  it('returns the access_token from a TID session cookie', () => {
    const raw = JSON.stringify({ access_token: 'tid-real', expires_at: Date.now() + 60_000 });
    expect(tidAccessTokenFromCookie(raw)).toBe('tid-real');
  });

  it('rejects missing cookie, invalid JSON, empty token, and local placeholder', () => {
    expect(tidAccessTokenFromCookie(undefined)).toBeNull();
    expect(tidAccessTokenFromCookie('{')).toBeNull();
    expect(tidAccessTokenFromCookie(JSON.stringify({ access_token: '' }))).toBeNull();
    expect(tidAccessTokenFromCookie(JSON.stringify({ access_token: 'local-dev-no-tid' }))).toBeNull();
  });

  it('returns valid unexpired token directly from getValidTidAccessToken', async () => {
    const raw = JSON.stringify({ access_token: 'valid-token', expires_at: Date.now() + 300_000 });
    const res = await getValidTidAccessToken(raw);
    expect(res.token).toBe('valid-token');
  });
});
