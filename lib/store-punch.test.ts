import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getPunchItems, upsertPunchItem, batchCommitPunchItems } from './store';
import type { PunchItem } from '@/types/punch';

const TEST_DB = path.join(__dirname, '..', 'data', 'test-punch-db.json');

describe('HPproto Punch List Local Store', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });
  afterEach(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  it('stores and retrieves punch items for a project', () => {
    const item: PunchItem = {
      id: 'punch-1',
      projectId: '1025',
      itemNumber: 'P-101',
      description: 'Missing drywall tape at corner bead',
      status: 'open',
      tradeName: 'Three Star Drywall',
      locationDescription: 'Level 2 Room 204',
      importance: 'high',
      reportedDate: '2026-09-17',
    };

    upsertPunchItem('1025', item, TEST_DB);
    const items = getPunchItems('1025', TEST_DB);
    expect(items.length).toBe(1);
    expect(items[0].description).toBe('Missing drywall tape at corner bead');
  });

  it('batches new items and resolution updates', () => {
    const item1: PunchItem = {
      id: 'p-1',
      projectId: '1025',
      itemNumber: 'P-01',
      description: 'Touch up paint',
      status: 'open',
      tradeName: 'Apex Painting',
      locationDescription: 'Corridor A',
      importance: 'normal',
    };
    upsertPunchItem('1025', item1, TEST_DB);

    const result = batchCommitPunchItems(
      '1025',
      [
        {
          action: 'resolve',
          targetItemId: 'p-1',
          notes: 'Signed off by inspector on site',
        },
        {
          action: 'create',
          item: {
            description: 'Caulk baseboards',
            tradeName: 'Apex Painting',
            locationDescription: 'Corridor B',
            importance: 'low',
            status: 'open',
          },
        },
      ],
      TEST_DB,
    );

    expect(result.createdCount).toBe(1);
    expect(result.updatedCount).toBe(1);

    const all = getPunchItems('1025', TEST_DB);
    expect(all.length).toBe(2);
    const updated = all.find((p) => p.id === 'p-1');
    expect(updated?.status).toBe('resolved');
  });
});
