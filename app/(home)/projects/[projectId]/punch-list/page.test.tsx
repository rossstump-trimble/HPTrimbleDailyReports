import { describe, it, expect } from 'vitest';
import { getNavigationItemsForProject } from '@/lib/projectsight/navigationData';

describe('Punch List Navigation & Page Integration', () => {
  it('includes Punch List in project navigation items', () => {
    const items = getNavigationItemsForProject('1025');
    const punchTab = items.find((item) => item.id === 'punch-list');
    expect(punchTab).toBeDefined();
    expect(punchTab?.path).toBe('/projects/1025/punch-list');
    expect(punchTab?.name).toBe('Punch List');
  });
});
