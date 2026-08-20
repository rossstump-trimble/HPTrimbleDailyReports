import { describe, it, expect } from 'vitest';
import { extractedDailyHasContent, unwrapExtractResponse } from './extract-response';

describe('unwrapExtractResponse', () => {
  it('reads the nested extracted object from the API payload', () => {
    const result = unwrapExtractResponse({
      success: true,
      extracted: { tradePartnerName: 'ALC', workerCount: 4 },
    });
    expect(result.tradePartnerName).toBe('ALC');
    expect(result.workerCount).toBe(4);
  });

  it('accepts a flat extracted object', () => {
    const result = unwrapExtractResponse({ notes: 'No delays', staCompleted: true });
    expect(result.notes).toBe('No delays');
    expect(result.staCompleted).toBe(true);
  });

  it('returns empty object for invalid payloads', () => {
    expect(unwrapExtractResponse(null)).toEqual({});
    expect(unwrapExtractResponse('nope')).toEqual({});
  });
});

describe('extractedDailyHasContent', () => {
  it('is false for an empty object', () => {
    expect(extractedDailyHasContent({})).toBe(false);
  });

  it('is true when a spoken transcript was captured', () => {
    expect(extractedDailyHasContent({ spokenTranscript: 'six electricians on the roof' })).toBe(true);
  });

  it('is true for worker counts', () => {
    expect(extractedDailyHasContent({ workerCount: 3 })).toBe(true);
    expect(extractedDailyHasContent({ workerCount: 0 })).toBe(false);
  });
});
