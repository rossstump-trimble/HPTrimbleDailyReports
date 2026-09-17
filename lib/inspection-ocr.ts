import { geminiGenerate, GEMINI_TEXT_MODEL, type GeminiPart } from '@/lib/gemini-client';
import type {
  ExtractedInspectionItem,
  InspectionExtractionResult,
  InspectionItemResult,
  InspectionRecord,
} from '@/types/inspections';

export function buildInspectionExtractionPrompt(knownChecklists?: InspectionRecord[]): string {
  const checklistsContext = knownChecklists?.length
    ? `KNOWN CHECKLISTS on this project (match against one of these by checklistNumber / title, and correlate each row to its itemNumber / prompt):\n${knownChecklists
        .map(
          (ck) =>
            `- Checklist: ${ck.number} | Title: "${ck.title}"\n  Items:\n${(ck.items || [])
              .map((it) => `    * Item ${it.itemNumber}: "${it.prompt}"`)
              .join('\n')}`,
        )
        .join('\n\n')}`
    : 'No active project checklists provided. Extract whatever checklist header and line items appear on the sheet.';

  return `You are an expert construction inspector and quality control auditor.
Analyze the handwritten or printed inspection checklist document image/scan and extract all line items, checkboxes, handwritten remarks, inspector details, and overall inspection status.

${checklistsContext}

For the document:
1. Identify the Checklist Number (e.g. "CK-0042"), Title, Inspector Name, and Date.
2. For each checklist item row:
   - itemNumber: The integer index (1, 2, 3...)
   - prompt: The text description of the requirement being inspected.
   - result: "Pass", "Fail", "N/A", or "Unchecked".
     * Look carefully at handwritten checkmarks (✓), 'X' marks, crosses, circles, or fill-ins in Pass/Fail/NA columns.
   - comment: Any handwritten notes, deviations, measurements, or inspector observations for this line.
   - confidence: A decimal score between 0.0 and 1.0 indicating OCR certainty.
   - needsReview: Set to true if handwriting is ambiguous, checkbox is smudged/corrected, or confidence < 0.85.

Return ONLY a valid JSON object matching this schema (no markdown formatting, no code fences):
{
  "checklistNumber": "CK-0042",
  "checklistGuid": "guid-if-matched-or-null",
  "title": "Pre-Pour Concrete Inspection",
  "inspectorName": "Inspector Name or null",
  "date": "YYYY-MM-DD or null",
  "overallConfidence": 0.95,
  "rawVisionNotes": "brief summary of sheet quality and findings",
  "items": [
    {
      "itemNumber": 1,
      "prompt": "Rebar placement verified",
      "result": "Pass",
      "comment": "Ties spaced at 12 in OC",
      "confidence": 0.95,
      "needsReview": false
    }
  ]
}`;
}

export function parseInspectionOcrResponse(
  text: string,
  knownChecklists?: InspectionRecord[],
): InspectionExtractionResult {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    const items: ExtractedInspectionItem[] = [];

    rawItems.forEach((row, idx) => {
      if (!row || typeof row !== 'object') return;
      const r = row as Record<string, unknown>;

      const resStr = String(r.result || 'Unchecked').toLowerCase();
      let result: InspectionItemResult = 'Unchecked';
      if (resStr.includes('pass') || resStr === 'yes' || resStr === 'ok') result = 'Pass';
      else if (resStr.includes('fail') || resStr === 'no') result = 'Fail';
      else if (resStr.includes('n/a') || resStr === 'na' || resStr.includes('not applicable')) result = 'N/A';

      const confidence = typeof r.confidence === 'number' && !isNaN(r.confidence) ? r.confidence : 0.85;
      const needsReview = typeof r.needsReview === 'boolean' ? r.needsReview : confidence < 0.85;

      items.push({
        itemNumber: typeof r.itemNumber === 'number' ? r.itemNumber : idx + 1,
        prompt: String(r.prompt || `Inspection item ${idx + 1}`),
        result,
        comment: r.comment ? String(r.comment) : undefined,
        confidence,
        needsReview,
      });
    });

    const checklistNumber = parsed.checklistNumber ? String(parsed.checklistNumber) : undefined;
    const title = parsed.title ? String(parsed.title) : undefined;
    let checklistGuid = parsed.checklistGuid ? String(parsed.checklistGuid) : undefined;

    if (!checklistGuid && checklistNumber && knownChecklists?.length) {
      const match = knownChecklists.find(
        (ck) => ck.number.toLowerCase() === checklistNumber.toLowerCase(),
      );
      if (match) checklistGuid = match.psRecordId || match.id;
    }

    return {
      checklistNumber,
      checklistGuid,
      title,
      inspectorName: parsed.inspectorName ? String(parsed.inspectorName) : undefined,
      date: parsed.date ? String(parsed.date) : undefined,
      items,
      overallConfidence:
        typeof parsed.overallConfidence === 'number' ? parsed.overallConfidence : 0.9,
      rawVisionNotes: parsed.rawVisionNotes ? String(parsed.rawVisionNotes) : undefined,
    };
  } catch {
    return {
      checklistNumber: undefined,
      checklistGuid: undefined,
      title: 'Failed to parse sheet',
      items: [],
      overallConfidence: 0.0,
      rawVisionNotes: 'Invalid model response',
    };
  }
}

export async function extractInspectionSheet(
  imageBuffer: Buffer,
  mimeType: string,
  filename: string,
  knownChecklists?: InspectionRecord[],
  forceFixture: boolean = false,
): Promise<InspectionExtractionResult> {
  const mode = process.env.PROJECTSIGHT_MODE || '';
  if (forceFixture || mode.toLowerCase() === 'fixture') {
    const matched = (knownChecklists && knownChecklists[0]) || {
      number: 'CK-0042',
      title: 'Pre-Pour Concrete Inspection',
      psRecordId: 'ck-fix-001',
      items: [
        { id: 'it-1', itemNumber: 1, prompt: 'Rebar placement, spacing, and sizing verified per structural drawings' },
        { id: 'it-2', itemNumber: 2, prompt: 'Clear cover to formwork verified (chairs & standoffs positioned)' },
        { id: 'it-3', itemNumber: 3, prompt: 'Embedded items, anchor bolts, and penetrations located and secured' },
        { id: 'it-4', itemNumber: 4, prompt: 'Forms clean of debris, tie wire, and standing water' },
        { id: 'it-5', itemNumber: 5, prompt: 'Vapor barrier sealed and free from punctures or tears' },
        { id: 'it-6', itemNumber: 6, prompt: 'Pre-pour survey elevation marks established on bulkheads' },
      ],
    };

    const items: ExtractedInspectionItem[] = (matched.items || []).map((it, idx) => ({
      itemNumber: it.itemNumber || idx + 1,
      prompt: it.prompt,
      result: 'Pass',
      comment: idx === 0 ? 'Verified 12 in OC rebar with inspector' : '',
      confidence: 0.95,
      needsReview: false,
    }));

    return {
      checklistNumber: matched.number,
      checklistGuid: matched.psRecordId || ('id' in matched ? String((matched as { id?: unknown }).id) : matched.psRecordId),
      title: matched.title,
      inspectorName: 'Field Superintendent',
      date: new Date().toISOString().split('T')[0],
      items,
      overallConfidence: 0.95,
      rawVisionNotes: 'Fixture grounded inspection extraction',
    };
  }

  const prompt = buildInspectionExtractionPrompt(knownChecklists);
  const parts: GeminiPart[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBuffer.toString('base64'),
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
        title: 'Empty extraction',
        items: [],
        overallConfidence: 0.0,
        rawVisionNotes: 'No response from multimodal vision model',
      };
    }

    return parseInspectionOcrResponse(result.text, knownChecklists);
  } catch (err) {
    return {
      title: 'Extraction error',
      items: [],
      overallConfidence: 0.0,
      rawVisionNotes: err instanceof Error ? err.message : String(err),
    };
  }
}
