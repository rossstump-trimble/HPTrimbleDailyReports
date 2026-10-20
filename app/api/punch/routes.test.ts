import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET as getItems } from './[projectId]/items/route';
import { POST as commitItems } from './[projectId]/commit/route';
import { getDefaultDbPath } from '@/lib/store';
import fs from 'fs';
import path from 'path';

function cleanupTestDb() {
  const dbPath = getDefaultDbPath();
  if (dbPath.includes('test') && fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }
}

describe('Punch List API Endpoints', () => {
  beforeEach(() => {
    cleanupTestDb();
  });

  afterEach(() => {
    cleanupTestDb();
  });
  it('returns items from local store when ProjectSight is not connected', async () => {
    const req = new Request('http://localhost:3000/api/punch/1025/items');
    const res = await getItems(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('commits items and saves to store', async () => {
    const req = new Request('http://localhost:3000/api/punch/1025/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            action: 'create',
            item: {
              description: 'Loose outlet cover',
              tradeName: 'Electrical Sub',
              locationDescription: 'Breakroom',
              importance: 'normal',
              status: 'open',
            },
          },
        ],
      }),
    });
    const res = await commitItems(req, { params: { projectId: '1025' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.createdCount).toBe(1);
  });
});
