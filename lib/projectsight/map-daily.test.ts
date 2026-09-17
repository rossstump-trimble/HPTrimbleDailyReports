import { describe, it, expect } from 'vitest';
import {
  buildDailyNarrative,
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
  it('populates ProjectSight daily report with subject, narrative, works, labor, and equipment', () => {
    const body = mapFog617ToProjectSightBody(capture);
    const narrative = buildDailyNarrative(capture);
    expect(body.Date).toBe('2026-08-20');
    expect(body.Subject).toBe('[AI Generated] Black Roofing — Sector 4 TPO');
    expect(body.Title).toBe('[AI Generated] Black Roofing — Sector 4 TPO');
    expect(body.Description).toBe(narrative);
    expect(body.TotalWorkApproved).toBe(96);
    expect(body.TotalWorkersApproved).toBe(12);

    // DailyWorks
    const works = body.DailyWorks as Record<string, unknown>[];
    expect(works).toHaveLength(1);
    expect(works[0].CompanyName).toBe('Black Roofing');
    expect(works[0].Location).toBe('Sector 4 TPO');
    expect(works[0].Workers).toBe(12);
    expect(works[0].ManpowerQty).toBe(96);
    expect(works[0].WorkDescription).toContain('Sector 4 TPO');
    expect(works[0].WorkDescription).toContain('Crew: Roofer (10), Foreman (2)');
    expect(works[0].WorkDescription).toContain('Equipment on Site: Crane, Torch Cart');
    expect(works[0].WorkDescription).toContain('STA Safety Completed: Yes');

    expect(body.WeatherNotes).toBeDefined();
    expect(body.Weathers).toBeDefined();
    expect(body.EquipmentRecords).toBeDefined();
    expect(body.TotalEquipmentQty).toBe(2);

    const comments = body.RecordComments as { Comments: string }[];
    expect(comments).toHaveLength(1);
    expect(comments[0].Comments).toBe(narrative);
    expect(narrative).toContain('Black Roofing');
    expect(narrative).toContain('Headcount: 12');
  });

  it('defaults Location to Jobsite when locationDescription is empty', () => {
    const emptyLocCapture = {
      tradePartnerName: 'Black Roofing',
      date: '2026-08-20',
      workerCount: 5,
      totalHours: 40,
    };
    const body = mapFog617ToProjectSightBody(emptyLocCapture);
    expect(body.Location).toBe('Jobsite');
    const works = body.DailyWorks as Record<string, unknown>[];
    expect(works[0].Location).toBe('Jobsite');
  });

  it('preserves reporter attribution and per-craft hours in Fog617Capture mapping', () => {
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
    };
    const body = mapFog617ToProjectSightBody(captureWithReporter);
    expect(body.Description).toContain('Reporter: Evan Grimm, Foreman');
    expect(body.TotalWorkApproved).toBe(40);
    expect(body.TotalWorkersApproved).toBe(6);
  });
});
