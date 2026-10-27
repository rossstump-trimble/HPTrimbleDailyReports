import { describe, it, expect } from 'vitest';
import {
  isAllowedLoginEmail,
  isAdminEmail,
  signSessionPayload,
  parseVerifiedSession,
  safeRedirectPath,
} from './local-session';

describe('domain login allowlist (@henselphelps.com and @trimble.com)', () => {
  it('allows @henselphelps.com and @trimble.com emails by default', () => {
    expect(isAllowedLoginEmail('user@henselphelps.com')).toBe(true);
    expect(isAllowedLoginEmail('ROSS_STUMP@TRIMBLE.COM')).toBe(true);
    expect(isAllowedLoginEmail('superintendent@henselphelps.com')).toBe(true);
  });

  it('rejects external email domains not in allowlist', () => {
    expect(isAllowedLoginEmail('attacker@gmail.com')).toBe(false);
    expect(isAllowedLoginEmail('user@henselphelps.com.evil.com')).toBe(false);
    expect(isAllowedLoginEmail('user@faketrimble.com')).toBe(false);
    expect(isAllowedLoginEmail('')).toBe(false);
    expect(isAllowedLoginEmail(null)).toBe(false);
  });

  it('supports custom explicitly allowed emails', () => {
    expect(
      isAllowedLoginEmail('partner@contractor.com', ['henselphelps.com', 'trimble.com'], ['partner@contractor.com']),
    ).toBe(true);
  });

  it('identifies admin emails strictly from the configured admin allowlist', () => {
    expect(isAdminEmail('ross_stump@trimble.com')).toBe(true);
    expect(isAdminEmail('nathan_patton@trimble.com')).toBe(true);
    expect(isAdminEmail('EGrim@henselphelps.com')).toBe(true);
    expect(isAdminEmail('egrim@henselphelps.com')).toBe(true);
    expect(isAdminEmail('super@henselphelps.com')).toBe(false);
    expect(isAdminEmail('super@henselphelps.com', ['super@henselphelps.com'])).toBe(true);
    expect(isAdminEmail('random@gmail.com')).toBe(false);
  });
});

describe('HMAC-SHA256 signed session verification', () => {
  it('signs and verifies a valid corporate session', () => {
    const signed = signSessionPayload({
      sub: 'u-123',
      email: 'clement@henselphelps.com',
      name: 'Clement',
      access_token: 'tok-xyz',
      isAdmin: false,
      allowed: true,
    });
    expect(signed.sig).toBeDefined();
    expect(signed.sig).toHaveLength(64); // SHA-256 hex

    const verified = parseVerifiedSession(JSON.stringify(signed));
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe('clement@henselphelps.com');
  });

  it('rejects unsigned cookies even if access_token has 3 dot-separated parts', () => {
    const forged = JSON.stringify({
      email: 'ross_stump@trimble.com',
      access_token: 'a.b.c',
      expires_at: Date.now() + 60000,
    });
    expect(parseVerifiedSession(forged)).toBeNull();
  });

  it('rejects tampered email or isAdmin flags in session cookies', () => {
    const signed = signSessionPayload({
      sub: 'u-123',
      email: 'clement@henselphelps.com',
      isAdmin: false,
    });
    expect(parseVerifiedSession(JSON.stringify({ ...signed, email: 'hacker@henselphelps.com' }))).toBeNull();
    expect(parseVerifiedSession(JSON.stringify({ ...signed, isAdmin: true }))).toBeNull();
  });

  it('honors admin-configured allowedEmails and domain removals via policy parameter', () => {
    const signedExternal = signSessionPayload({
      sub: 'u-ext',
      email: 'partner@external.com',
      allowed: true,
    });
    // Middleware check (no DB policy passed) trusts the signed `allowed: true` claim minted at login
    expect(parseVerifiedSession(JSON.stringify(signedExternal))).not.toBeNull();
    // Route check with policy enforces current allowlist
    expect(
      parseVerifiedSession(JSON.stringify(signedExternal), {
        allowedDomains: ['henselphelps.com'],
        allowedEmails: ['partner@external.com'],
      }),
    ).not.toBeNull();
    expect(
      parseVerifiedSession(JSON.stringify(signedExternal), {
        allowedDomains: ['henselphelps.com'],
        allowedEmails: [],
      }),
    ).toBeNull();
  });
});

describe('safeRedirectPath', () => {
  it('allows relative paths starting with a single slash and blocks open-redirect vectors', () => {
    expect(safeRedirectPath('/projects/1025/dashboard')).toBe('/projects/1025/dashboard');
    expect(safeRedirectPath('//evil.com')).toBe('/');
    expect(safeRedirectPath('https://evil.com')).toBe('/');
    expect(safeRedirectPath('/\\evil.com')).toBe('/');
    expect(safeRedirectPath('/\t/evil.com')).toBe('/');
    expect(safeRedirectPath('/\n/evil.com')).toBe('/');
  });
});
