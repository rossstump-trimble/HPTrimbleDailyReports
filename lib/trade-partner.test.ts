import { describe, expect, it } from 'vitest';
import { resolveTradePartner, slugTradePartnerId } from './trade-partner';

const partners = [
  { id: 'titan-electric', name: 'Titan Electric' },
  { id: 'alc', name: 'ALC' },
];

describe('slugTradePartnerId', () => {
  it('builds a stable id from a typed company name', () => {
    expect(slugTradePartnerId('Pacific Millwork LLC')).toBe('pacific-millwork-llc');
  });
});

describe('resolveTradePartner', () => {
  it('matches a known partner without requiring the dropdown', () => {
    expect(resolveTradePartner('titan electric', partners)).toEqual({
      tradePartnerId: 'titan-electric',
      tradePartnerName: 'Titan Electric',
    });
  });

  it('preserves trailing spaces while typing so mobile spacebar works', () => {
    expect(resolveTradePartner('Three ', partners)).toEqual({
      tradePartnerId: 'three',
      tradePartnerName: 'Three ',
    });
    expect(resolveTradePartner('Three Star ', partners)).toEqual({
      tradePartnerId: 'three-star',
      tradePartnerName: 'Three Star ',
    });
  });

  it('keeps a spoken or typed company that is not on the example list', () => {
    expect(resolveTradePartner('Harbor Glass', partners)).toEqual({
      tradePartnerId: 'harbor-glass',
      tradePartnerName: 'Harbor Glass',
    });
  });

  it('does not overwrite a spoken name with a previously selected list partner', () => {
    expect(
      resolveTradePartner('Harbor Glass', partners, {
        id: 'alc',
        name: 'ALC',
      }),
    ).toEqual({
      tradePartnerId: 'harbor-glass',
      tradePartnerName: 'Harbor Glass',
    });
  });

  it('falls back to the current selection only when no name was captured', () => {
    expect(
      resolveTradePartner(undefined, partners, { id: 'alc', name: 'ALC' }),
    ).toEqual({
      tradePartnerId: 'alc',
      tradePartnerName: 'ALC',
    });
  });
});
