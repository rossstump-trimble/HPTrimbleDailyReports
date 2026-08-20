import { describe, it, expect, beforeEach } from 'vitest';
import { getStore, saveStore, upsertDailyReport, getProjectById, getBowlingMatrix } from './store';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'hpproto-test-db.json');

describe('HPproto Local Store', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it('initializes default seeded projects and trade partners', () => {
    const store = getStore(TEST_DB_PATH);
    expect(store.projects.length).toBeGreaterThan(0);
    const cys07 = getProjectById('cys07', TEST_DB_PATH);
    expect(cys07).toBeDefined();
    expect(cys07?.tradePartners.length).toBeGreaterThan(0);
  });

  it('seeds cys07 with all six expected trade partners', () => {
    const cys07 = getProjectById('cys07', TEST_DB_PATH);
    expect(cys07).toBeDefined();
    const ids = cys07!.tradePartners.map(tp => tp.id);
    expect(ids).toContain('alc');
    expect(ids).toContain('black-roofing');
    expect(ids).toContain('apex-steel');
    expect(ids).toContain('titan-electric');
    expect(ids).toContain('cascade-plumbing');
    expect(ids).toContain('precision-drywall');
  });

  it('upserts a daily report and replaces previous submission on the same date', () => {
    const report1 = {
      id: 'rpt-1',
      projectId: 'cys07',
      tradePartnerId: 'alc',
      tradePartnerName: 'ALC',
      date: '2026-08-20',
      submittedAt: new Date().toISOString(),
      locationDescription: 'Building A 2nd Floor',
      workerCount: 5,
      totalHours: 40,
      crewBreakdown: [{ craft: 'Electrician', count: 5 }],
      equipment: ['Scissor Lift'],
      notes: 'No delays',
      staCompleted: true,
      emailRecipients: ['test@alc.com'],
    };

    upsertDailyReport(report1, TEST_DB_PATH);
    const matrix = getBowlingMatrix('cys07', '2026-08', TEST_DB_PATH);
    const alcRow = matrix.rows.find(r => r.tradePartner.id === 'alc');
    expect(alcRow).toBeDefined();
    const cell20 = alcRow?.cells.find(c => c.date === '2026-08-20');
    expect(cell20?.status).toBe('submitted');
    expect(cell20?.workerCount).toBe(5);
    expect(cell20?.totalHours).toBe(40);

    // Upsert replacement for same trade partner + date
    const report2 = { ...report1, id: 'rpt-2', workerCount: 8, totalHours: 64 };
    upsertDailyReport(report2, TEST_DB_PATH);
    const updatedMatrix = getBowlingMatrix('cys07', '2026-08', TEST_DB_PATH);
    const updatedCell = updatedMatrix.rows
      .find(r => r.tradePartner.id === 'alc')
      ?.cells.find(c => c.date === '2026-08-20');
    expect(updatedCell?.workerCount).toBe(8);
    expect(updatedCell?.totalHours).toBe(64);
  });

  it('missing days show status missing in the bowling matrix', () => {
    const matrix = getBowlingMatrix('cys07', '2026-08', TEST_DB_PATH);
    const alcRow = matrix.rows.find(r => r.tradePartner.id === 'alc');
    expect(alcRow).toBeDefined();
    // No reports inserted; every cell must be missing
    alcRow!.cells.forEach(cell => {
      expect(cell.status).toBe('missing');
    });
  });

  it('bowling matrix has 31 days for August 2026', () => {
    const matrix = getBowlingMatrix('cys07', '2026-08', TEST_DB_PATH);
    expect(matrix.daysInMonth).toBe(31);
    expect(matrix.rows[0].cells.length).toBe(31);
  });

  it('atomic write: store file remains valid JSON after saveStore', () => {
    const store = getStore(TEST_DB_PATH);
    store.dailyReports.push({
      id: 'rpt-atomic',
      projectId: 'cys07',
      tradePartnerId: 'alc',
      tradePartnerName: 'ALC',
      date: '2026-08-01',
      submittedAt: new Date().toISOString(),
      locationDescription: 'Site',
      workerCount: 3,
      totalHours: 24,
      crewBreakdown: [],
      equipment: [],
      notes: '',
      staCompleted: false,
      emailRecipients: [],
    });
    saveStore(store, TEST_DB_PATH);
    const reloaded = getStore(TEST_DB_PATH);
    expect(reloaded.dailyReports.find(r => r.id === 'rpt-atomic')).toBeDefined();
  });
});
