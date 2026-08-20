import fs from 'fs';
import path from 'path';

export function uploadRoot(): string {
  return process.env.HPPROTO_UPLOAD_ROOT || path.join(process.cwd(), 'data', 'uploads');
}

function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.length > 0 ? base : 'fog617.bin';
}

export function saveUpload(dailyId: string, originalName: string, bytes: Buffer): string {
  const safeId = dailyId.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = sanitizeFileName(originalName);
  const dir = path.join(uploadRoot(), safeId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), bytes);
  return `${safeId}/${fileName}`;
}

export function readUpload(relativePath: string): Buffer | null {
  if (!relativePath || relativePath.includes('..') || path.isAbsolute(relativePath)) {
    return null;
  }
  const root = path.resolve(uploadRoot());
  const full = path.resolve(path.join(root, relativePath));
  if (full !== root && !full.startsWith(root + path.sep)) {
    return null;
  }
  if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    return null;
  }
  return fs.readFileSync(full);
}
