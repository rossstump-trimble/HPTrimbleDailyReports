import { describe, it, expect } from 'vitest';
import { getNavigationItemsForProject } from '@/lib/projectsight/navigationData';
import { SuperdailyPrintDocument } from '@/components/superdaily/SuperdailyPrintDocument';
import type { SuperdailyReport } from '@/types/superdaily';

describe('Superdaily Integration & Print Component', () => {
  it('includes Superdaily in project navigation items at order 21', () => {
    const items = getNavigationItemsForProject('1025');
    const superdailyTab = items.find((item) => item.id === 'superdaily');
    expect(superdailyTab).toBeDefined();
    expect(superdailyTab?.path).toBe('/projects/1025/superdaily');
    expect(superdailyTab?.name).toBe('Superdaily');
    expect(superdailyTab?.order).toBe(21);
  });

  it('exports SuperdailyPrintDocument and renders report structure without crashing', () => {
    expect(SuperdailyPrintDocument).toBeDefined();

    const sampleReport: SuperdailyReport = {
      id: 'sd-1',
      projectId: '1025',
      projectName: 'Hensel Phelps Test Project',
      date: '2026-09-17',
      generatedAt: '2026-09-17T17:00:00Z',
      executiveSummary: 'Executive overview test',
      totalHeadcount: 15,
      totalManHours: 120,
      activeTradeCount: 3,
      tradeSummaries: [],
      interTradeFavors: [
        {
          providingTrade: 'Apex Painting',
          receivingTrade: 'Drywall Sub',
          description: 'Loaned scissor lift',
          type: 'equipment_sharing',
        },
      ],
      delaysAndRoadblocks: [],
      safetyAndStas: {
        allCompleted: true,
        staNotes: 'All STAs completed',
        incidentsReported: false,
      },
    };

    const element = SuperdailyPrintDocument({ report: sampleReport });
    expect(element).toBeDefined();
    expect(element.props.className).toContain('superdaily-print-only');
  });
});
