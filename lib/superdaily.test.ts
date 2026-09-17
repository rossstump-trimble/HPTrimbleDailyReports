import { describe, it, expect } from 'vitest';
import {
  buildSuperdailyPrompt,
  parseSuperdailyResponse,
  synthesizeDeterministicFallback,
  synthesizeSuperdaily,
} from './superdaily';
import type { DailyReport } from '@/types/hpproto';
import type { MissingTradePartner, SuperdailyWeather } from '@/types/superdaily';

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
      notes: 'Completed primer coat along corridor walls grid lines 1-5. Ready for inspection.',
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
      notes: 'Crane hoist placed 4 structural steel beams at Atrium grid 4-G. Bolting and torque checks underway.',
      staCompleted: true,
      emailRecipients: [],
    },
  ];

  const mockWeather: SuperdailyWeather = {
    temp: 74,
    tempMax: 82,
    tempMin: 65,
    conditions: 'Partly Cloudy',
    humidity: 45,
    windVelocity: 7,
    rainfall: 0,
    snowfall: 0,
    weatherNotes: 'Partly Cloudy, High 82°F / Low 65°, Wind 7 mph.',
  };

  const mockMissingTrades: MissingTradePartner[] = [
    {
      tradePartnerId: 'plumbing-corp',
      tradePartnerName: 'Superior Plumbing',
      category: 'Plumbing',
    },
  ];

  it('builds grounded Gemini prompt with all trade reports and verbose work instructions', () => {
    const prompt = buildSuperdailyPrompt('Hensel Phelps Demo Project', '2026-09-17', mockReports);
    expect(prompt).toContain('Hensel Phelps Demo Project');
    expect(prompt).toContain('Apex Painting');
    expect(prompt).toContain('Steel Erector Inc');
    expect(prompt).toContain('tradeWorkNarratives');
    expect(prompt).not.toContain('interTradeFavors');
  });

  it('synthesizes valid fallback report with weather, missing trades, and verbose descriptions', () => {
    const report = synthesizeDeterministicFallback(
      '1025',
      'Hensel Phelps Demo',
      '2026-09-17',
      mockReports,
      mockWeather,
      mockMissingTrades,
      3,
    );
    expect(report.totalHeadcount).toBe(12);
    expect(report.totalManHours).toBe(96);
    expect(report.activeTradeCount).toBe(2);
    expect(report.expectedTradeCount).toBe(3);
    expect(report.missingTrades.length).toBe(1);
    expect(report.missingTrades[0].tradePartnerName).toBe('Superior Plumbing');
    expect(report.weather?.conditions).toBe('Partly Cloudy');
    expect(report.tradeSummaries.length).toBe(2);
    expect(report.tradeSummaries[0].workPerformed.length).toBeGreaterThan(30);
    expect(report.safetyAndStas.allCompleted).toBe(true);
  });

  it('parses structured JSON Gemini response cleanly and populates verbose narratives', () => {
    const sampleAiJson = JSON.stringify({
      executiveSummary: 'Substantial progress made across Level 2 structural steel and coating operations.',
      tradeWorkNarratives: [
        {
          tradePartnerId: 'apex-painting',
          workPerformed: 'Crews advanced surface preparation and completed anti-corrosive primer coating along Corridor B Level 2 grid lines 1 through 5.',
        },
        {
          tradePartnerId: 'steel-erector',
          workPerformed: 'Ironworkers utilized 100T crane to hoist and secure 4 major structural steel beams across the Main Atrium grid 4-G.',
        },
      ],
      delaysAndRoadblocks: [],
      safetyNotes: 'All trade STAs completed prior to shift start.',
    });

    const parsed = parseSuperdailyResponse(
      sampleAiJson,
      '1025',
      'Demo Proj',
      '2026-09-17',
      mockReports,
      mockWeather,
      mockMissingTrades,
      3,
    );
    expect(parsed.executiveSummary).toContain('Substantial progress');
    expect(parsed.tradeSummaries[0].workPerformed).toContain('anti-corrosive primer coating');
    expect(parsed.tradeSummaries[1].workPerformed).toContain('Ironworkers utilized 100T crane');
    expect(parsed.missingTrades.length).toBe(1);
  });

  it('synthesizes superdaily with empty reports cleanly', async () => {
    const report = await synthesizeSuperdaily('1025', 'Demo Proj', '2026-09-17', []);
    expect(report.totalHeadcount).toBe(0);
    expect(report.activeTradeCount).toBe(0);
  });
});
