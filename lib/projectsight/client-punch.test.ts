import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizePunchItem,
  createPunchItem,
  updatePunchItem,
} from './client';

describe('ProjectSight Punch Item API Client', () => {
  const origFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    global.fetch = origFetch;
  });

  it('normalizes raw ProjectSight punch item payloads', () => {
    const raw = {
      PunchItemId: 'ps-p-1',
      ItemNumber: '0042',
      Description: 'Fix door latch',
      Status: 'Open',
      Importance: 'High',
      Location: { Description: 'Room 101' },
      AssignedToCompany: { Name: 'Apex Painting' },
      DateCreated: '2026-09-17T12:00:00Z',
    };

    const normalized = normalizePunchItem(raw, '1025');
    expect(normalized.id).toBe('ps-p-1');
    expect(normalized.itemNumber).toBe('0042');
    expect(normalized.description).toBe('Fix door latch');
    expect(normalized.status).toBe('open');
    expect(normalized.importance).toBe('high');
    expect(normalized.tradeName).toBe('Apex Painting');
    expect(normalized.locationDescription).toBe('Room 101');
  });

  it('creates punch item via POST', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ PunchItemId: 'ps-new-1', Number: '0099' }),
    });

    const res = await createPunchItem('token-123', 'port-1', 'proj-1', {
      Description: 'Touch up paint',
      Status: 'Open',
    });

    expect(res.id).toBe('ps-new-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/port-1/proj-1/punchitems'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updates punch item status via PATCH/PUT', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ PunchItemId: 'ps-new-1', Status: 'Resolved' }),
    });

    const res = await updatePunchItem('token-123', 'port-1', 'proj-1', 'ps-new-1', {
      Status: 'Resolved',
    });

    expect(res.id).toBe('ps-new-1');
  });
});
