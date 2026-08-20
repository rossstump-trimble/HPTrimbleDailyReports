import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { saveUpload, readUpload } from './upload-store';

const dir = path.join(process.cwd(), 'data', 'uploads-test');

describe('upload-store', () => {
  beforeEach(() => {
    process.env.HPPROTO_UPLOAD_ROOT = dir;
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    delete process.env.HPPROTO_UPLOAD_ROOT;
  });

  it('saves bytes and reads them back via relative path', () => {
    const relative = saveUpload('rpt-1', 'FOG617.xlsx', Buffer.from('abc'));
    expect(relative).toContain('rpt-1');
    expect(readUpload(relative)?.toString()).toBe('abc');
  });

  it('rejects path traversal on read', () => {
    expect(readUpload('../hpproto-db.json')).toBeNull();
  });
});
