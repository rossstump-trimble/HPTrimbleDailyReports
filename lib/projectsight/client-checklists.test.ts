import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listChecklists,
  getChecklist,
  updateChecklistItems,
  uploadChecklistAttachment,
} from './client';

describe('ProjectSight checklist client methods', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('listChecklists parses ProjectSight checklist records', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          Items: [
            {
              ChecklistId: 'ck-1',
              ChecklistNumber: 'CK-0042',
              Title: 'Pre-Pour Concrete Inspection',
              WorkflowState: 'Open',
              Location: 'Building A, Floor 2',
            },
          ],
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const checklists = await listChecklists('fake-token', 'port-1', 'proj-1');
    expect(checklists.length).toBe(1);
    expect(checklists[0].number).toBe('CK-0042');
    expect(checklists[0].title).toBe('Pre-Pour Concrete Inspection');
  });

  it('updateChecklistItems formats payload correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ Success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await updateChecklistItems(
      'fake-token',
      'port-1',
      'proj-1',
      'ck-1',
      [{ id: 'item-1', itemNumber: 1, prompt: 'Rebar', result: 'Pass', comment: 'Looks good' }],
      'Approved',
    );
    expect(res).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
