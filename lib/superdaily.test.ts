import { describe, it, expect } from 'vitest';
import {
  buildSuperdailyPrompt,
  parseSuperdailyResponse,
  synthesizeDeterministicFallback,
  extractInterTradeFavorsFromNotes,
} from './superdaily';
import type { DailyReport } from '@/types/hpproto';

describe('Superdaily Summarization Engine', () => {
  const mockReports: DailyReport[] = [
    {
      id: 'dr-1',
      projectId: '1025',
      tradePartnerId: 'apex-painting',
      tradePartnerName: 'Apex Painting',
      date: '2026-09-17',
      submittedAt: '2026-09-17T16:00:00Z',
      locationDescription: 'Corridor B Level 2',
      workerCount: 4,
      totalHours: 32,
      crewBreakdown: [{ craft: 'Painter', count: 4 }],
      equipment: ['Ladders', 'Sprayer'],
      notes: 'Steel Erector loaned us their 60ft boom lift so we could paint the high structural deck. Finished prime coat on time.',
      staCompleted: true,
      emailRecipients: [],
    },
    {
      id: 'dr-2',
      projectId: '1025',
      tradePartnerId: 'steel-erector',
      tradePartnerName: 'Steel Erector Inc',
      date: '2026-09-17',
      submittedAt: '2026-09-17T16:30:00Z',
      locationDescription: 'Main Atrium Level 2',
      workerCount: 8,
      totalHours: 64,
      crewBreakdown: [{ craft: 'Ironworker', count: 8 }],
      equipment: ['60ft Boom Lift', 'Crane 100T'],
      notes: 'Assisted painting crew with boom lift sharing. Crane hoist used to place 4 structural steel beams at Atrium grid 4-G.',
      staCompleted: true,
      emailRecipients: [],
    },
  ];

  it('builds grounded Gemini prompt with all trade reports', () => {
    const prompt = buildSuperdailyPrompt('Hensel Phelps Demo Project', '2026-09-17', mockReports);
    expect(prompt).toContain('Hensel Phelps Demo Project');
    expect(prompt).toContain('Apex Painting');
    expect(prompt).toContain('Steel Erector Inc');
    expect(prompt).toContain('interTradeFavors');
  });

  it('extracts inter-trade favors deterministically from notes', () => {
    const favors = extractInterTradeFavorsFromNotes(mockReports);
    expect(favors.length).toBeGreaterThan(0);
    const liftFavor = favors.find((f) => f.description.toLowerCase().includes('boom lift'));
    expect(liftFavor).toBeDefined();
    expect(liftFavor?.type).toBe('equipment_sharing');
  });

  it('synthesizes valid fallback report when offline or Gemini is unset', () => {
    const report = synthesizeDeterministicFallback('1025', 'Hensel Phelps Demo', '2026-09-17', mockReports);
    expect(report.totalHeadcount).toBe(12);
    expect(report.totalManHours).toBe(96);
    expect(report.activeTradeCount).toBe(2);
    expect(report.tradeSummaries.length).toBe(2);
    expect(report.interTradeFavors.length).toBeGreaterThan(0);
    expect(report.safetyAndStas.allCompleted).toBe(true);
  });

  it('parses structured JSON Gemini response cleanly', () => {
    const sampleAiJson = JSON.stringify({
      executiveSummary: 'Substantial progress made across Level 2 structural steel and coating operations.',
      interTradeFavors: [
        {
          providingTrade: 'Steel Erector Inc',
          receivingTrade: 'Apex Painting',
          description: 'Loaned 60ft boom lift for overhead deck painting',
          type: 'equipment_sharing',
        },
      ],
      delaysAndRoadblocks: [],
      safetyNotes: 'All trade STAs completed prior to shift start.',
    });

    const parsed = parseSuperdailyResponse(sampleAiJson, '1025', 'Demo Proj', '2026-09-17', mockReports);
    expect(parsed.executiveSummary).toContain('Substantial progress');
    expect(parsed.interTradeFavors.length).toBe(1);
    expect(parsed.interTradeFavors[0].providingTrade).toBe('Steel Erector Inc');
  });
});
