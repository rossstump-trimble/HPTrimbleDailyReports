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
      expectedTradeCount: 4,
      weather: {
        temp: 74,
        tempMax: 80,
        tempMin: 65,
        conditions: 'Sunny',
        humidity: 35,
        windVelocity: 8,
        rainfall: 0,
        snowfall: 0,
        weatherNotes: 'Sunny, High 80°F, Low 65°F.',
      },
      missingTrades: [
        {
          tradePartnerId: 'drywall-sub',
          tradePartnerName: 'Drywall Specialist Co',
          category: 'Drywall',
        },
      ],
      tradeSummaries: [
        {
          tradePartnerId: 'apex-painting',
          tradePartnerName: 'Apex Painting',
          workerCount: 4,
          totalHours: 32,
          locationDescription: 'Corridor Level 2',
          workPerformed: 'Crews applied prime and finish coats across drywall partitions.',
          equipment: ['Ladders'],
          staCompleted: true,
        },
      ],
      delaysAndRoadblocks: [],
      safetyAndStas: {
        allCompleted: true,
        staNotes: 'All STAs completed',
        incidentsReported: false,
      },
    };

    const element = SuperdailyPrintDocument({
      report: sampleReport,
      hiddenSectionKeys: ['weather'],
      hiddenTradeIds: ['other-trade'],
    });

    expect(element).toBeDefined();
    expect(element.props.className).toContain('superdaily-print-only');
  });
});
