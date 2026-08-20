import { describe, it, expect } from 'vitest';
import { buildDailyNarrative, buildDailyTitle, mapFog617ToProjectSightBody } from './map-daily';

const capture = {
  tradePartnerName: 'Black Roofing',
  date: '2026-08-20',
  locationDescription: 'Sector 4 TPO',
  workerCount: 12,
  totalHours: 96,
  crewBreakdown: [
    { craft: 'Roofer', count: 10 },
    { craft: 'Foreman', count: 2 },
  ],
  equipment: ['Crane', 'Torch Cart'],
  notes: 'Lightning delay 45 min.',
  staCompleted: true,
};

describe('mapFog617ToProjectSightBody', () => {
  it('sets Date, Title, and Description from the FOG 617 capture set', () => {
    const body = mapFog617ToProjectSightBody(capture);
    expect(body.Date).toBe('2026-08-20');
    expect(body.Title).toBe(buildDailyTitle(capture));
    expect(body.Title).toContain('Black Roofing');
    expect(body.Description).toBe(buildDailyNarrative(capture));
    expect(String(body.Description)).toContain('Headcount: 12');
    expect(String(body.Description)).toContain('STA completed: yes');
    expect(String(body.Description)).toContain('Crane');
  });

  it('omits empty title pieces and defaults missing STA to no', () => {
    const body = mapFog617ToProjectSightBody({ date: '2026-08-01' });
    expect(body.Date).toBe('2026-08-01');
    expect(String(body.Description)).toContain('STA completed: no');
  });
});
