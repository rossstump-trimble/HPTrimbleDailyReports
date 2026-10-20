import fs from 'fs';
import path from 'path';

export function uploadRoot(): string {
  if (process.env.HPPROTO_UPLOAD_ROOT) {
    return process.env.HPPROTO_UPLOAD_ROOT;
  }
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return path.join(process.cwd(), 'data', 'test-uploads');
  }
  return path.join(process.cwd(), 'data', 'uploads');
}

function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.length > 0 ? base : 'fog617.bin';
}

export function saveUpload(dailyId: string, originalName: string, bytes: Buffer): string {
  const safeId = dailyId.replace(/[^a-zA-Z0-9._-]/g, '_');
  const baseName = sanitizeFileName(originalName);
  const dir = path.join(uploadRoot(), safeId);
  fs.mkdirSync(dir, { recursive: true });

  let fileName = baseName;
  let counter = 1;
  const ext = path.extname(baseName);
  const stem = path.basename(baseName, ext);

  while (fs.existsSync(path.join(dir, fileName))) {
    const existing = fs.readFileSync(path.join(dir, fileName));
    if (existing.equals(bytes)) {
      return `${safeId}/${fileName}`;
    }
    fileName = `${stem}_${counter}${ext}`;
    counter++;
  }

  fs.writeFileSync(path.join(dir, fileName), bytes);
  return `${safeId}/${fileName}`;
}

export function saveStagingUpload(originalName: string, bytes: Buffer): string {
  const baseName = sanitizeFileName(originalName);
  const dir = path.join(uploadRoot(), 'staging');
  fs.mkdirSync(dir, { recursive: true });

  const timestamp = Date.now();
  const ext = path.extname(baseName);
  const stem = path.basename(baseName, ext);
  const fileName = `${timestamp}_${stem}${ext}`;

  fs.writeFileSync(path.join(dir, fileName), bytes);
  return `staging/${fileName}`;
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
