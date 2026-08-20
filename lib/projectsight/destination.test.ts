import { describe, it, expect } from 'vitest';
import { destinationFromSearchParams, parseDestinationJson } from './destination';

describe('destination', () => {
  const cookie = {
    portfolioId: 'pf-cookie',
    projectId: 'pr-cookie',
    portfolioName: 'Cookie PF',
    projectName: 'Cookie PR',
  };

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
});
