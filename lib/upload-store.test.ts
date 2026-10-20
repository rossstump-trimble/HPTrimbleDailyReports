import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { saveUpload, readUpload, saveStagingUpload } from './upload-store';

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

  it('handles duplicate filenames with different content without overwriting', () => {
    const path1 = saveUpload('rpt-1', 'image.jpg', Buffer.from('photo-1'));
    const path2 = saveUpload('rpt-1', 'image.jpg', Buffer.from('photo-2'));
    expect(path1).not.toBe(path2);
    expect(readUpload(path1)?.toString()).toBe('photo-1');
    expect(readUpload(path2)?.toString()).toBe('photo-2');
  });

  it('saves staging uploads into staging folder', () => {
    const stagingPath = saveStagingUpload('site-photo.jpg', Buffer.from('camera-snap'));
    expect(stagingPath).toContain('staging');
    expect(stagingPath).toContain('site-photo.jpg');
    expect(readUpload(stagingPath)?.toString()).toBe('camera-snap');
  });

  it('rejects path traversal on read', () => {
    expect(readUpload('../hpproto-db.json')).toBeNull();
  });
});
