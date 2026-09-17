import fs from 'fs';
import path from 'path';
import type { DailyReport } from '@/types/hpproto';

export function defaultBackupRoot(): string {
  return process.env.HPPROTO_BACKUP_ROOT || path.join(process.cwd(), 'data', 'ingested-dailies');
}

export interface IngestedFileAttachment {
  name: string;
  buffer: Buffer;
}

export interface IngestedBackupBundle {
  report: DailyReport;
  metadata: {
    backedUpAt: string;
    fileCount: number;
  };
  files: string[];
}

export function backupIngestedDaily(
  report: DailyReport,
  files?: IngestedFileAttachment[],
  backupRoot: string = defaultBackupRoot(),
): string {
  const safeProject = (report.projectId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeDate = (report.date || 'no-date').replace(/[^0-9-]/g, '_');
  const safeDailyId = (report.id || `daily-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');

  const targetDir = path.join(backupRoot, safeProject, safeDate, safeDailyId);
  fs.mkdirSync(targetDir, { recursive: true });

  const recordJson = JSON.stringify(report, null, 2);
  fs.writeFileSync(path.join(targetDir, 'daily-record.json'), recordJson, 'utf-8');

  const filesDir = path.join(targetDir, 'files');
  fs.mkdirSync(filesDir, { recursive: true });

  const savedFiles: string[] = [];
  if (Array.isArray(files) && files.length > 0) {
    for (const f of files) {
      const safeName = path.basename(f.name).replace(/[^a-zA-Z0-9._-]/g, '_');
      fs.writeFileSync(path.join(filesDir, safeName), f.buffer);
      savedFiles.push(safeName);
    }
  }

  const meta = {
    backedUpAt: new Date().toISOString(),
    fileCount: savedFiles.length,
    projectId: report.projectId,
    date: report.date,
    dailyId: report.id,
    tradePartnerName: report.tradePartnerName,
  };
  fs.writeFileSync(path.join(targetDir, 'metadata.json'), JSON.stringify(meta, null, 2), 'utf-8');

  return targetDir;
}

export function listLocalIngestedDailies(
  projectId: string,
  date: string,
  backupRoot: string = defaultBackupRoot(),
): DailyReport[] {
  const safeProject = (projectId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeDate = (date || 'no-date').replace(/[^0-9-]/g, '_');
  const dir = path.join(backupRoot, safeProject, safeDate);

  if (!fs.existsSync(dir)) return [];

  const subdirs = fs.readdirSync(dir, { withFileTypes: true });
  const reports: DailyReport[] = [];

  for (const d of subdirs) {
    if (!d.isDirectory()) continue;
    const recordFile = path.join(dir, d.name, 'daily-record.json');
    if (fs.existsSync(recordFile)) {
      try {
        const raw = fs.readFileSync(recordFile, 'utf-8');
        reports.push(JSON.parse(raw) as DailyReport);
      } catch {
        // Skip unreadable record
      }
    }
  }

  return reports;
}

export function readIngestedDailyBackup(
  projectId: string,
  date: string,
  dailyId: string,
  backupRoot: string = defaultBackupRoot(),
): IngestedBackupBundle | null {
  const safeProject = (projectId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeDate = (date || 'no-date').replace(/[^0-9-]/g, '_');
  const safeDailyId = (dailyId || '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetDir = path.join(backupRoot, safeProject, safeDate, safeDailyId);

  const recordFile = path.join(targetDir, 'daily-record.json');
  if (!fs.existsSync(recordFile)) return null;

  try {
    const report = JSON.parse(fs.readFileSync(recordFile, 'utf-8')) as DailyReport;
    const filesDir = path.join(targetDir, 'files');
    const files = fs.existsSync(filesDir) ? fs.readdirSync(filesDir) : [];
    const metaFile = path.join(targetDir, 'metadata.json');
    const metadata = fs.existsSync(metaFile)
      ? JSON.parse(fs.readFileSync(metaFile, 'utf-8'))
      : { backedUpAt: new Date().toISOString(), fileCount: files.length };

    return { report, metadata, files };
  } catch {
    return null;
  }
}
