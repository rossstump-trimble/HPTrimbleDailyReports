import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll } from 'vitest';

// Test files run in parallel. Without private data directories they share one database file
// and clear each other's reports mid-test.
const isolatedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hp-test-'));
process.env.HPPROTO_DB_PATH = path.join(isolatedDir, 'db.json');
process.env.HPPROTO_BACKUP_ROOT = path.join(isolatedDir, 'backups');
process.env.HPPROTO_UPLOAD_ROOT = path.join(isolatedDir, 'uploads');

afterAll(() => {
  fs.rmSync(isolatedDir, { recursive: true, force: true });
});
