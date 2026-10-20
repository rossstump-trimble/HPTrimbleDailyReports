import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from './submit/route';
import { listLocalIngestedDailies, readIngestedDailyBackup, defaultBackupRoot } from '@/lib/ingest-backup';
import { getDefaultDbPath } from '@/lib/store';
import { uploadRoot } from '@/lib/upload-store';
import fs from 'fs';

function cleanupTestArtifacts() {
  const dbPath = getDefaultDbPath();
  if (dbPath.includes('test') && fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }
  const backupDir = defaultBackupRoot();
  if (backupDir.includes('test') && fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }
  const upDir = uploadRoot();
  if (upDir.includes('test') && fs.existsSync(upDir)) {
    fs.rmSync(upDir, { recursive: true, force: true });
  }
}

describe('Intake Submit Backup Hook', () => {
  beforeEach(() => {
    cleanupTestArtifacts();
  });

  afterEach(() => {
    cleanupTestArtifacts();
  });
  it('creates an on-disk backup when submitting a daily report via JSON', async () => {
    const testDate = `2026-09-${Math.floor(Math.random() * 10) + 10}`;
    const req = new Request('http://localhost:3000/api/intake/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: '1025',
        tradePartnerName: 'Three Star Drywall',
        date: testDate,
        workerCount: 5,
        totalHours: 40,
        notes: 'Drywall framing complete. Handed over corridor to electrical.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const backups = listLocalIngestedDailies('1025', testDate);
    expect(backups.length).toBeGreaterThan(0);
    const saved = backups.find((b) => b.tradePartnerName === 'Three Star Drywall');
    expect(saved).toBeDefined();
    expect(saved?.notes).toContain('Drywall framing complete');
  });

  it('creates an on-disk backup with file attachments when submitting via FormData', async () => {
    const testDate = `2026-09-${Math.floor(Math.random() * 10) + 20}`;
    const formData = new FormData();
    formData.append('projectId', '1025');
    formData.append('tradePartnerName', 'Apex Electric');
    formData.append('date', testDate);
    formData.append('workerCount', '4');
    formData.append('totalHours', '32');
    formData.append('notes', 'Rough-in electrical panel completed on Floor 2.');

    const fakeFile = new File([Buffer.from('sample photo bytes')], 'electrical-panel.jpg', {
      type: 'image/jpeg',
    });
    formData.append('files', fakeFile);

    const req = new Request('http://localhost:3000/api/intake/submit', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.report).toBeDefined();

    const backups = listLocalIngestedDailies('1025', testDate);
    expect(backups.length).toBeGreaterThan(0);
    const saved = backups.find((b) => b.tradePartnerName === 'Apex Electric');
    expect(saved).toBeDefined();
    expect(saved?.notes).toContain('Rough-in electrical panel');

    const bundle = readIngestedDailyBackup('1025', testDate, json.report.id);
    expect(bundle).not.toBeNull();
    expect(bundle?.files).toContain('electrical-panel.jpg');
    expect(bundle?.metadata.fileCount).toBe(1);
  });
});
