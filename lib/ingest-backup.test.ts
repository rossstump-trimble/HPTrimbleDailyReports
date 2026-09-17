import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  backupIngestedDaily,
  listLocalIngestedDailies,
  readIngestedDailyBackup,
} from './ingest-backup';
import type { DailyReport } from '@/types/hpproto';

const TEST_BACKUP_DIR = path.join(process.cwd(), 'data', 'test-ingested-dailies');

describe('Ingestion Disaster-Recovery Backup', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_BACKUP_DIR)) {
      fs.rmSync(TEST_BACKUP_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_BACKUP_DIR)) {
      fs.rmSync(TEST_BACKUP_DIR, { recursive: true, force: true });
    }
  });

  it('backs up a daily report record and raw file attachments to disk', () => {
    const report: DailyReport = {
      id: 'dr-101',
      projectId: '1025',
      tradePartnerId: 'apex-painting',
      tradePartnerName: 'Apex Painting',
      date: '2026-09-17',
      submittedAt: '2026-09-17T14:30:00.000Z',
      locationDescription: 'Building B Level 3',
      workerCount: 6,
      totalHours: 48,
      crewBreakdown: [{ craft: 'Journeyman Painter', count: 6 }],
      equipment: ['Scissor Lift 32ft'],
      notes: 'Borrowed scissor lift from Steel Erector to finish primer coat at high ceilings.',
      staCompleted: true,
      emailRecipients: ['super@example.com'],
    };

    const mockFileBytes = Buffer.from('fake image content');
    const backupPath = backupIngestedDaily(
      report,
      [{ name: 'daily_sheet.jpg', buffer: mockFileBytes }],
      TEST_BACKUP_DIR,
    );

    expect(fs.existsSync(backupPath)).toBe(true);
    expect(fs.existsSync(path.join(backupPath, 'daily-record.json'))).toBe(true);
    expect(fs.existsSync(path.join(backupPath, 'files', 'daily_sheet.jpg'))).toBe(true);

    const savedRecord = JSON.parse(
      fs.readFileSync(path.join(backupPath, 'daily-record.json'), 'utf-8'),
    ) as DailyReport;
    expect(savedRecord.tradePartnerName).toBe('Apex Painting');
    expect(savedRecord.workerCount).toBe(6);

    const listed = listLocalIngestedDailies('1025', '2026-09-17', TEST_BACKUP_DIR);
    expect(listed.length).toBe(1);
    expect(listed[0].id).toBe('dr-101');

    const readBack = readIngestedDailyBackup('1025', '2026-09-17', 'dr-101', TEST_BACKUP_DIR);
    expect(readBack).not.toBeNull();
    expect(readBack?.report.notes).toContain('Borrowed scissor lift');
    expect(readBack?.files.length).toBe(1);
  });
});
