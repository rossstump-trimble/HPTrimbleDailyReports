import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DESTINATION,
  destinationFromSearchParams,
  parseDestinationJson,
  destinationFromCookieValue,
  destinationFromCookieWithFallback,
} from './destination';

describe('destination', () => {
  const cookie = {
    portfolioId: 'pf-cookie',
    projectId: 'pr-cookie',
    portfolioName: 'Cookie PF',
    projectName: 'Cookie PR',
  };

  it('defaults to the Hensel Phelps demo project', () => {
    expect(DEFAULT_DESTINATION.portfolioId).toBe('8fddbe9f-933a-43b9-8b5e-17ff16f14598');
    expect(DEFAULT_DESTINATION.projectId).toBe('1025');
  });

  it('falls back to DEFAULT_DESTINATION when no cookie is set', () => {
    expect(destinationFromCookieWithFallback(null)).toEqual(DEFAULT_DESTINATION);
    expect(destinationFromCookieWithFallback(undefined)).toEqual(DEFAULT_DESTINATION);
    expect(destinationFromCookieWithFallback('')).toEqual(DEFAULT_DESTINATION);
  });

  it('parses a valid cookie payload', () => {
    expect(parseDestinationJson(JSON.stringify(cookie))).toEqual(cookie);
    expect(parseDestinationJson('')).toBeNull();
    expect(parseDestinationJson('{')).toBeNull();
  });

  it('lets query params win over the cookie', () => {
    const params = new URLSearchParams('psPortfolio=pf-q&psProject=pr-q');
    expect(destinationFromSearchParams(params, cookie)).toEqual({
      portfolioId: 'pf-q',
      projectId: 'pr-q',
      portfolioName: 'Cookie PF',
      projectName: 'Cookie PR',
    });
  });

  it('falls back to cookie when query is empty', () => {
    expect(destinationFromSearchParams(new URLSearchParams(), cookie)).toEqual(cookie);
  });

  it('decodes the URL-encoded destination cookie value', () => {
    const encoded = encodeURIComponent(JSON.stringify(cookie));
    expect(destinationFromCookieValue(encoded)).toEqual(cookie);
    expect(destinationFromCookieValue(undefined)).toBeNull();
  });
});
