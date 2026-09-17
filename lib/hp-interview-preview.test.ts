import { describe, it, expect } from 'vitest';
import { interviewFieldPreview } from '@/lib/fog617-interview';

describe('HP staff interview slots and field preview', () => {
  it('shows only HP relevant slots (no crew/staff, no STA) for HP audience', () => {
    const preview = interviewFieldPreview({}, 'hp');
    const slotIds = preview.map((p) => p.id);
    expect(slotIds).toContain('date');
    expect(slotIds).toContain('tradesAndFavors');
    expect(slotIds).toContain('notes');
    expect(slotIds).not.toContain('crew');
    expect(slotIds).not.toContain('totalHours');
    expect(slotIds).not.toContain('staCompleted');
  });

  it('keeps crew and sta slots for trade audience', () => {
    const preview = interviewFieldPreview({}, 'trade');
    const slotIds = preview.map((p) => p.id);
    expect(slotIds).toContain('crew');
    expect(slotIds).toContain('staCompleted');
  });
});
