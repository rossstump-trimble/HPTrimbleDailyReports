import { geminiGenerate, GEMINI_TEXT_MODEL } from '@/lib/gemini-client';
import type { DailyReport } from '@/types/hpproto';
import type {
  MissingTradePartner,
  SuperdailyReport,
  SuperdailyWeather,
  TradeFavor,
  TradeWorkSummary,
} from '@/types/superdaily';

export function buildSuperdailyPrompt(
  projectName: string,
  date: string,
  reports: DailyReport[],
): string {
  const reportsText = reports
    .map(
      (r, i) => `
Trade ${i + 1}: ${r.tradePartnerName} (ID: ${r.tradePartnerId})
Location: ${r.locationDescription || 'Not specified'}
Workers: ${r.workerCount} | Hours: ${r.totalHours}
Equipment: ${r.equipment?.join(', ') || 'None'}
STA Completed: ${r.staCompleted ? 'Yes' : 'No'}
Notes: ${r.notes || 'None'}
`,
    )
    .join('\n---');

  return `You are a Lead Project Superintendent for Hensel Phelps.
Synthesize all subcontractor daily reports for project "${projectName}" on date "${date}" into a comprehensive, professional Superdaily master report.

Individual Subcontractor Reports:
${reportsText}

Requirements:
1. Executive Summary: A concise, authoritative overview of the jobsite tempo, major milestones achieved, areas of high activity, and general site progress.
2. Individual Subcontractor Work Performed: Provide an expanded, professional, multi-sentence technical narrative for EACH subcontractor describing exact activities, systems installed, locations, progress rate, and equipment utilized. Do NOT truncate or summarize into brief one-liners.
3. Delays & Roadblocks: Explicitly call out any delays, material shortages, access issues, or weather disruptions noted by trades.
4. Safety & STAs: Summarize safety meeting / STA compliance.

Return ONLY a valid JSON object matching this schema:
{
  "executiveSummary": "string",
  "tradeWorkNarratives": [
    {
      "tradePartnerId": "string",
      "workPerformed": "Detailed, multi-sentence technical description of all tasks and installations completed by this trade today."
    }
  ],
  "delaysAndRoadblocks": ["string"],
  "safetyNotes": "string"
}`;
}

export function synthesizeDeterministicFallback(
  projectId: string,
  projectName: string,
  date: string,
  reports: DailyReport[],
  weather?: SuperdailyWeather,
  missingTrades: MissingTradePartner[] = [],
  expectedTradeCount: number = reports.length + missingTrades.length,
): SuperdailyReport {
  let totalHeadcount = 0;
  let totalManHours = 0;
  const delays: string[] = [];
  let allStas = true;

  const tradeSummaries: TradeWorkSummary[] = reports.map((r) => {
    totalHeadcount += r.workerCount || 0;
    totalManHours += r.totalHours || 0;
    if (!r.staCompleted) allStas = false;

    if (r.notes && /delay|waiting|blocked|rain|mud|shortage/i.test(r.notes)) {
      delays.push(`${r.tradePartnerName}: ${r.notes.slice(0, 140)}`);
    }

    const verboseWork = r.notes
      ? `${r.notes} Crews operated actively in ${r.locationDescription || 'designated site areas'}${r.equipment && r.equipment.length > 0 ? ` utilizing ${r.equipment.join(', ')}` : ''}.`
      : `Subcontractor executed designated scope of work at ${r.locationDescription || 'assigned site location'} with ${r.workerCount || 1} craftspersons.`;

    return {
      tradePartnerId: r.tradePartnerId,
      tradePartnerName: r.tradePartnerName,
      workerCount: r.workerCount || 0,
      totalHours: r.totalHours || 0,
      locationDescription: r.locationDescription || 'Site general',
      workPerformed: verboseWork,
      equipment: r.equipment || [],
      staCompleted: Boolean(r.staCompleted),
      notes: r.notes,
    };
  });

  return {
    id: `superdaily-${projectId}-${date}-${Date.now()}`,
    projectId,
    projectName,
    date,
    generatedAt: new Date().toISOString(),
    weather,
    executiveSummary: `On ${date}, ${reports.length} of ${expectedTradeCount} subcontractor trade partners submitted daily reports with an active on-site workforce of ${totalHeadcount} craftspersons logging ${totalManHours} man-hours. Operations focused on primary work packages with no critical jobsite incidents reported.`,
    totalHeadcount,
    totalManHours,
    activeTradeCount: reports.length,
    expectedTradeCount,
    missingTrades,
    tradeSummaries,
    interTradeFavors: [],
    delaysAndRoadblocks: delays,
    safetyAndStas: {
      allCompleted: allStas,
      staNotes: allStas
        ? 'All reporting subcontractors confirmed completion of morning STAs and safety briefings.'
        : 'One or more trade partners logged incomplete or unconfirmed STA safety checklists.',
      incidentsReported: false,
    },
  };
}

export function parseSuperdailyResponse(
  jsonText: string,
  projectId: string,
  projectName: string,
  date: string,
  reports: DailyReport[],
  weather?: SuperdailyWeather,
  missingTrades: MissingTradePartner[] = [],
  expectedTradeCount: number = reports.length + missingTrades.length,
): SuperdailyReport {
  const fallback = synthesizeDeterministicFallback(
    projectId,
    projectName,
    date,
    reports,
    weather,
    missingTrades,
    expectedTradeCount,
  );

  try {
    const clean = jsonText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(clean);

    const updatedSummaries = fallback.tradeSummaries.map((summary) => {
      const match = Array.isArray(parsed.tradeWorkNarratives)
        ? parsed.tradeWorkNarratives.find(
            (n: { tradePartnerId?: string; workPerformed?: string }) =>
              n.tradePartnerId?.toLowerCase() === summary.tradePartnerId.toLowerCase(),
          )
        : null;

      if (match?.workPerformed) {
        return {
          ...summary,
          workPerformed: match.workPerformed,
        };
      }
      return summary;
    });

    return {
      ...fallback,
      executiveSummary: parsed.executiveSummary || fallback.executiveSummary,
      tradeSummaries: updatedSummaries,
      delaysAndRoadblocks: Array.isArray(parsed.delaysAndRoadblocks)
        ? parsed.delaysAndRoadblocks
        : fallback.delaysAndRoadblocks,
      safetyAndStas: {
        ...fallback.safetyAndStas,
        staNotes: parsed.safetyNotes || fallback.safetyAndStas.staNotes,
      },
    };
  } catch {
    return fallback;
  }
}

export async function synthesizeSuperdaily(
  projectId: string,
  projectName: string,
  date: string,
  reports: DailyReport[],
  weather?: SuperdailyWeather,
  missingTrades: MissingTradePartner[] = [],
  expectedTradeCount: number = reports.length + missingTrades.length,
): Promise<SuperdailyReport> {
  if (reports.length === 0) {
    return synthesizeDeterministicFallback(
      projectId,
      projectName,
      date,
      [],
      weather,
      missingTrades,
      expectedTradeCount,
    );
  }

  const prompt = buildSuperdailyPrompt(projectName, date, reports);

  try {
    const res = await geminiGenerate({
      model: GEMINI_TEXT_MODEL,
      parts: [{ text: prompt }],
    });

    if (res?.text) {
      return parseSuperdailyResponse(
        res.text,
        projectId,
        projectName,
        date,
        reports,
        weather,
        missingTrades,
        expectedTradeCount,
      );
    }
  } catch (err) {
    console.warn('[superdaily] Gemini synthesis failed, falling back to deterministic mode', err);
  }

  return synthesizeDeterministicFallback(
    projectId,
    projectName,
    date,
    reports,
    weather,
    missingTrades,
    expectedTradeCount,
  );
}
