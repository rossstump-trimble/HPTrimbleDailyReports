import { geminiGenerate, GEMINI_TEXT_MODEL } from '@/lib/gemini-client';
import type { DailyReport } from '@/types/hpproto';
import type {
  SuperdailyReport,
  TradeFavor,
  TradeFavorType,
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
Trade ${i + 1}: ${r.tradePartnerName}
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
1. Executive Summary: A concise, authoritative overview of the jobsite tempo, major milestones achieved, and areas of high activity.
2. Inter-Trade Favors & Coordination: Scrutinize all subcontractor notes for instances of mutual aid, equipment sharing (e.g. boom lifts, scissor lifts, crane time), shared access, material staging handoffs, or manpower coordination.
3. Delays & Roadblocks: Explicitly call out any delays, material shortages, or weather disruptions noted by trades.
4. Safety & STAs: Summarize safety meeting / STA compliance.

Return ONLY a valid JSON object matching this schema:
{
  "executiveSummary": "string",
  "interTradeFavors": [
    {
      "providingTrade": "string",
      "receivingTrade": "string",
      "description": "string",
      "type": "equipment_sharing" | "material_handling" | "access_handover" | "manpower_assist" | "general"
    }
  ],
  "delaysAndRoadblocks": ["string"],
  "safetyNotes": "string"
}`;
}

export function extractInterTradeFavorsFromNotes(reports: DailyReport[]): TradeFavor[] {
  const favors: TradeFavor[] = [];
  const favorRegex = /(loaned|borrowed|shared|assisted|helped|handed over|crane hoist|boom lift|scissor lift|staging)/i;

  for (const r of reports) {
    const notes = r.notes || '';
    if (favorRegex.test(notes)) {
      let type: TradeFavorType = 'general';
      if (/lift|crane|equipment|generator|forklift/i.test(notes)) {
        type = 'equipment_sharing';
      } else if (/staging|laydown|material|unloaded/i.test(notes)) {
        type = 'material_handling';
      } else if (/handover|handed over|access|cleared space/i.test(notes)) {
        type = 'access_handover';
      } else if (/assisted|helped|crew|manpower/i.test(notes)) {
        type = 'manpower_assist';
      }

      // Detect potential trade mentioned in notes
      let otherTrade = 'Subcontractor';
      for (const other of reports) {
        if (other.id !== r.id && notes.toLowerCase().includes(other.tradePartnerName.toLowerCase())) {
          otherTrade = other.tradePartnerName;
          break;
        }
      }

      const isBorrowing = /borrowed|received|got access/i.test(notes);
      favors.push({
        providingTrade: isBorrowing ? otherTrade : r.tradePartnerName,
        receivingTrade: isBorrowing ? r.tradePartnerName : otherTrade,
        description: notes.slice(0, 160),
        type,
      });
    }
  }

  return favors;
}

export function synthesizeDeterministicFallback(
  projectId: string,
  projectName: string,
  date: string,
  reports: DailyReport[],
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
      delays.push(`${r.tradePartnerName}: ${r.notes.slice(0, 120)}`);
    }

    return {
      tradePartnerId: r.tradePartnerId,
      tradePartnerName: r.tradePartnerName,
      workerCount: r.workerCount || 0,
      totalHours: r.totalHours || 0,
      locationDescription: r.locationDescription || 'Site general',
      workPerformed: r.notes || 'Routine trade activities reported.',
      equipment: r.equipment || [],
      staCompleted: Boolean(r.staCompleted),
      notes: r.notes,
    };
  });

  const interTradeFavors = extractInterTradeFavorsFromNotes(reports);

  return {
    id: `superdaily-${projectId}-${date}-${Date.now()}`,
    projectId,
    projectName,
    date,
    generatedAt: new Date().toISOString(),
    executiveSummary: `On ${date}, ${reports.length} subcontractor trades reported on site with a total manpower of ${totalHeadcount} workers logging ${totalManHours} man-hours. Operations proceeded smoothly across designated work zones with ${interTradeFavors.length} noted instances of inter-trade equipment sharing and logistics coordination.`,
    totalHeadcount,
    totalManHours,
    activeTradeCount: reports.length,
    tradeSummaries,
    interTradeFavors,
    delaysAndRoadblocks: delays,
    safetyAndStas: {
      allCompleted: allStas,
      staNotes: allStas
        ? 'All on-site subcontractors confirmed completion of morning STAs and safety briefings.'
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
): SuperdailyReport {
  const fallback = synthesizeDeterministicFallback(projectId, projectName, date, reports);
  try {
    const clean = jsonText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(clean);

    return {
      ...fallback,
      executiveSummary: parsed.executiveSummary || fallback.executiveSummary,
      interTradeFavors: Array.isArray(parsed.interTradeFavors) && parsed.interTradeFavors.length > 0
        ? parsed.interTradeFavors
        : fallback.interTradeFavors,
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
): Promise<SuperdailyReport> {
  if (reports.length === 0) {
    return synthesizeDeterministicFallback(projectId, projectName, date, []);
  }

  const prompt = buildSuperdailyPrompt(projectName, date, reports);

  try {
    const res = await geminiGenerate({
      model: GEMINI_TEXT_MODEL,
      parts: [{ text: prompt }],
    });

    if (res?.text) {
      return parseSuperdailyResponse(res.text, projectId, projectName, date, reports);
    }
  } catch (err) {
    console.warn('[superdaily] Gemini synthesis failed, falling back to deterministic mode', err);
  }

  return synthesizeDeterministicFallback(projectId, projectName, date, reports);
}
