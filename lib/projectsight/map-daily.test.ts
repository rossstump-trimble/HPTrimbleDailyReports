import { describe, it, expect } from 'vitest';
import {
  buildDailyNarrative,
  buildDailyTitle,
  mapFog617ToProjectSightBody,
  type Fog617Capture,
} from './map-daily';

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

  it('accepts reporter attribution and per-craft hours in Fog617Capture', () => {
    const captureWithReporter: Fog617Capture = {
      tradePartnerName: 'Apex Electric',
      submittedBy: 'Evan Grimm, Foreman',
      date: '2026-09-17',
      crewBreakdown: [
        { craft: 'Journeyman Electrician', count: 4, hoursPerWorker: 8, totalHours: 32 },
        { craft: 'Apprentice Electrician', count: 2, hoursPerWorker: 4, totalHours: 8 },
      ],
      workerCount: 6,
      totalHours: 40,
      staCompleted: true,
      staFiles: [{ fileName: 'sta.jpg', filePath: '/tmp/sta.jpg' }],
    };
    const body = mapFog617ToProjectSightBody(captureWithReporter);
    expect(body.Date).toBe('2026-09-17');
    expect(body.Title).toBe('Apex Electric');
  });

  it('outputs separate DailyWorks items for each craft with exact total hours', () => {
    const capture: Fog617Capture = {
      tradePartnerName: 'Titan Iron',
      submittedBy: 'Evan Grimm',
      date: '2026-09-17',
      locationDescription: 'Sector B Column Line 4',
      crewBreakdown: [
        { craft: 'Ironworker Journeyman', count: 4, hoursPerWorker: 8, totalHours: 32 },
        { craft: 'Welder', count: 2, hoursPerWorker: 10, totalHours: 20 },
      ],
      workerCount: 6,
      totalHours: 52,
      staCompleted: true,
    };

    const body = mapFog617ToProjectSightBody(capture);
    expect(body.Description).toContain('Reporter: Evan Grimm');
    expect(body.Description).toContain('Ironworker Journeyman (4) @ 8h = 32h');
    expect(body.Description).toContain('Welder (2) @ 10h = 20h');
    expect(body.TotalWorkersApproved).toBe(6);
    expect(body.TotalWorkApproved).toBe(52);

    const works = body.DailyWorks as Record<string, unknown>[];
    expect(works).toHaveLength(2);
    expect(works[0].Trade).toBe('Ironworker Journeyman');
    expect(works[0].Workers).toBe(4);
    expect(works[0].HoursPerDay).toBe(8);
    expect(works[0].TotalWork).toBe(32);

    expect(works[1].Trade).toBe('Welder');
    expect(works[1].Workers).toBe(2);
    expect(works[1].HoursPerDay).toBe(10);
    expect(works[1].TotalWork).toBe(20);
  });

  it('includes CompanyID on DailyWorks when psCompanyId is provided and omits it for manual companies', () => {
    const syncedCapture: Fog617Capture = {
      tradePartnerName: 'Custom Synced Sub',
      psCompanyId: 4412,
      date: '2026-10-27',
      workerCount: 5,
      totalHours: 40,
    };
    const syncedBody = mapFog617ToProjectSightBody(syncedCapture);
    const syncedWorks = syncedBody.DailyWorks as Record<string, unknown>[];
    expect(syncedWorks[0].CompanyID).toBe(4412);
    expect(syncedWorks[0].CompanyName).toBe('Custom Synced Sub');

    const manualCapture: Fog617Capture = {
      tradePartnerName: 'Brand New Manual Sub',
      date: '2026-10-27',
      workerCount: 5,
      totalHours: 40,
    };
    const manualBody = mapFog617ToProjectSightBody(manualCapture);
    const manualWorks = manualBody.DailyWorks as Record<string, unknown>[];
    expect(manualWorks[0].CompanyID).toBeUndefined();
    expect(manualWorks[0].CompanyName).toBe('Brand New Manual Sub');
  });
});
