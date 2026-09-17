import { geminiGenerate, GEMINI_TEXT_MODEL, type GeminiPart } from '@/lib/gemini-client';
import type {
  ExtractedPunchItem,
  PunchAction,
  PunchExtractResponse,
  PunchImportance,
  PunchStatus,
} from '@/types/punch';

export interface PunchGroundingContext {
  knownTrades?: string[];
  openItems?: {
    id: string;
    itemNumber?: string;
    description: string;
    tradeName?: string;
    locationDescription?: string;
  }[];
}

export function buildPunchExtractionPrompt(context?: PunchGroundingContext): string {
  const trades = context?.knownTrades?.length
    ? `\nKNOWN TRADE PARTNERS on this project (prefer these exact names if handwriting matches closely):\n${context.knownTrades.map((t) => `- ${t}`).join('\n')}`
    : '';

  const openItems = context?.openItems?.length
    ? `\nEXISTING OPEN PUNCH ITEMS on this project (if the sheet refers to resolving, signing off, back-punching, or re-inspecting one of these items, match its itemNumber or targetItemId):\n${context.openItems
        .map(
          (item) =>
            `- ID: ${item.id} | Number: ${item.itemNumber ?? 'N/A'} | Trade: ${item.tradeName ?? 'Unknown'} | Desc: ${item.description}`,
        )
        .join('\n')}`
    : '';

  return `You are an expert construction punch list and back-punch auditor.
Analyze the handwritten or printed punch list document image/scan and extract all defect items and resolution sign-offs.

${trades}
${openItems}

For each line item or defect row identified on the sheet:
1. Determine the action:
   - "create": A new defect or punch item to be added to the project.
   - "resolve": An existing punch item that has been corrected, signed off, back-punched, or marked completed/resolved on the sheet.
   - "reinspect": An item that failed reinspection or needs rework.
2. If the action is "resolve" or "reinspect", identify the targetItemNumber (e.g. "P-101", "0042") or targetItemId if matched to known open items.
3. Extract:
   - tradeName: Responsible subcontractor/company (standardize against known trades where possible).
   - description: What needs fixing or what was inspected/resolved.
   - locationDescription: Room, floor, grid line, or specific location noted.
   - status: "open" (for new defects), "resolved" (for signed off/completed items), or "closed".
   - importance: "low", "normal", "high", or "urgent".
   - confidence: A decimal score between 0.0 and 1.0 indicating OCR reading confidence for this row.

Classify the overall sheetType as:
- "new_defects": If primarily new defects.
- "back_punch": If primarily resolution sign-offs on existing items.
- "mixed": Both new defects and resolutions.

Return ONLY a valid JSON object matching this schema (no markdown formatting, no code fences):
{
  "sheetType": "new_defects" | "back_punch" | "mixed",
  "items": [
    {
      "tempId": "temp-1",
      "action": "create" | "resolve" | "reinspect",
      "targetItemNumber": "string or null",
      "targetItemId": "string or null",
      "description": "description text",
      "tradeName": "trade partner name",
      "locationDescription": "location details",
      "status": "open" | "resolved" | "closed",
      "importance": "low" | "normal" | "high" | "urgent",
      "confidence": 0.95,
      "notes": "optional notes"
    }
  ]
}`;
}

export function parsePunchOcrResponse(text: string): PunchExtractResponse {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    const items: ExtractedPunchItem[] = [];

    rawItems.forEach((row, idx) => {
      if (!row || typeof row !== 'object') return;
      const r = row as Record<string, unknown>;

      const actionStr = String(r.action || 'create').toLowerCase();
      let action: PunchAction = 'create';
      if (actionStr === 'resolve') action = 'resolve';
      else if (actionStr === 'reinspect') action = 'reinspect';

      const statusStr = String(r.status || (action === 'resolve' ? 'resolved' : 'open')).toLowerCase();
      let status: PunchStatus = 'open';
      if (statusStr.includes('resolv')) status = 'resolved';
      else if (statusStr.includes('close')) status = 'closed';
      else if (statusStr.includes('reopen')) status = 'reopened';

      const impStr = String(r.importance || 'normal').toLowerCase();
      let importance: PunchImportance = 'normal';
      if (impStr === 'high') importance = 'high';
      else if (impStr === 'urgent') importance = 'urgent';
      else if (impStr === 'low') importance = 'low';

      const confidence = typeof r.confidence === 'number' && !isNaN(r.confidence) ? r.confidence : 0.85;

      items.push({
        tempId: String(r.tempId || `temp-${idx + 1}`),
        action,
        targetItemNumber: r.targetItemNumber ? String(r.targetItemNumber) : undefined,
        targetItemId: r.targetItemId ? String(r.targetItemId) : undefined,
        description: String(r.description || 'Defect item'),
        tradeName: String(r.tradeName || 'Unassigned'),
        locationDescription: String(r.locationDescription || ''),
        status,
        importance,
        confidence,
        notes: r.notes ? String(r.notes) : undefined,
      });
    });

    const sheetTypeRaw = String(parsed.sheetType || 'mixed').toLowerCase();
    let sheetType: 'new_defects' | 'back_punch' | 'mixed' = 'mixed';
    if (sheetTypeRaw === 'new_defects') sheetType = 'new_defects';
    else if (sheetTypeRaw === 'back_punch') sheetType = 'back_punch';

    return {
      success: true,
      sheetType,
      items,
      rawText: cleaned,
    };
  } catch {
    return {
      success: false,
      sheetType: 'mixed',
      items: [],
      error: 'Failed to parse model response into JSON',
      rawText: text,
    };
  }
}

export async function extractPunchSheetFromBuffer(
  buffer: Buffer,
  mimeType: string,
  context?: PunchGroundingContext,
): Promise<PunchExtractResponse> {
  const prompt = buildPunchExtractionPrompt(context);

  const parts: GeminiPart[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: buffer.toString('base64'),
      },
    },
  ];

  try {
    const result = await geminiGenerate({
      model: GEMINI_TEXT_MODEL,
      parts,
    });

    if (!result?.text) {
      return {
        success: false,
        sheetType: 'mixed',
        items: [],
        error: 'No text generated from vision model',
      };
    }

    return parsePunchOcrResponse(result.text);
  } catch (err) {
    return {
      success: false,
      sheetType: 'mixed',
      items: [],
      error: err instanceof Error ? err.message : 'Punch OCR extraction failed',
    };
  }
}
