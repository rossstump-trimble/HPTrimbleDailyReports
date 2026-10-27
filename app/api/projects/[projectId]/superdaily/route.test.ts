import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from './summarize/route';
import { getDefaultDbPath } from '@/lib/store';
import fs from 'fs';

function cleanupTestDb() {
  const dbPath = getDefaultDbPath();
  if (dbPath.includes('test') && fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }
}

describe('Superdaily Summarize API Route', () => {
  beforeEach(() => {
    cleanupTestDb();
  });

  afterEach(() => {
    cleanupTestDb();
  });
  it('rejects invalid date formats', async () => {
    const req = new Request('http://localhost:3000/api/projects/1025/superdaily/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: 'invalid-date' }),
    });

    const res = await POST(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('summarizes reports for a valid date', async () => {
    const req = new Request('http://localhost:3000/api/projects/1025/superdaily/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-17' }),
    });

    const res = await POST(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.report).toBeDefined();
    expect(data.report.projectId).toBe('1025');
    expect(Array.isArray(data.availableLocations)).toBe(true);
  });

  it('filters superdaily reports by location when location is specified', async () => {
    const { upsertDailyReport } = await import('@/lib/store');
    upsertDailyReport({
      id: 'dr-loc-1',
      projectId: '1025',
      tradePartnerId: 'titan-electric',
      tradePartnerName: 'Titan Electric',
      date: '2026-09-18',
      submittedAt: new Date().toISOString(),
      locationDescription: 'Building A - Level 2',
      workerCount: 6,
      totalHours: 48,
      crewBreakdown: [],
      equipment: [],
      notes: 'Installed conduit in Building A',
      staCompleted: true,
      emailRecipients: [],
    });
    upsertDailyReport({
      id: 'dr-loc-2',
      projectId: '1025',
      tradePartnerId: 'apex-plumbing',
      tradePartnerName: 'Apex Plumbing',
      date: '2026-09-18',
      submittedAt: new Date().toISOString(),
      locationDescription: 'Building B - Basement',
      workerCount: 4,
      totalHours: 32,
      crewBreakdown: [],
      equipment: [],
      notes: 'Rough-in piping in Building B',
      staCompleted: true,
      emailRecipients: [],
    });

    const req = new Request('http://localhost:3000/api/projects/1025/superdaily/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-18', location: 'Building A - Level 2' }),
    });

    const res = await POST(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reportsCount).toBe(1);
    expect(data.availableLocations).toContain('Building A - Level 2');
    expect(data.availableLocations).toContain('Building B - Basement');
    expect(data.report.tradeSummaries).toHaveLength(1);
    expect(data.report.tradeSummaries[0].tradePartnerName).toBe('Titan Electric');
  });
});
