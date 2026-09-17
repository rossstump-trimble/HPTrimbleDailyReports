import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './[projectId]/route';
import { POST as commitPost } from './[projectId]/[inspectionId]/commit/route';
import { saveInspectionRecord, getInspectionById } from '@/lib/store';

describe('Inspections API Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET returns inspections list for project', async () => {
    const req = new Request('http://localhost:3000/api/inspections/1025');
    const res = await GET(req, { params: { projectId: '1025' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.inspections)).toBe(true);
    expect(json.inspections.length).toBeGreaterThan(0);
  });

  it('commit updates checklist items and status', async () => {
    saveInspectionRecord({
      id: 'test-insp-route-1',
      projectId: '1025',
      number: 'CK-0042',
      title: 'Pre-Pour Concrete Inspection',
      status: 'open',
      items: [
        { id: 'item-1', itemNumber: 1, prompt: 'Rebar placement', result: 'Unchecked' },
      ],
      source: 'upload',
      createdAt: '2026-09-17T00:00:00.000Z',
      updatedAt: '2026-09-17T00:00:00.000Z',
    });

    const body = {
      status: 'approved',
      items: [
        { id: 'item-1', itemNumber: 1, prompt: 'Rebar placement', result: 'Pass', comment: 'Verified' },
      ],
    };

    const req = new Request('http://localhost:3000/api/inspections/1025/test-insp-route-1/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await commitPost(req, {
      params: { projectId: '1025', inspectionId: 'test-insp-route-1' },
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.inspection.status).toBe('approved');
    expect(json.inspection.items[0].result).toBe('Pass');

    const updated = getInspectionById('test-insp-route-1');
    expect(updated?.status).toBe('approved');
  });
});
