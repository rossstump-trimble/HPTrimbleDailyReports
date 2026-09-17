import * as XLSX from 'xlsx';
import { isAudioMedia } from '@/lib/audio-mime';
import { geminiGenerate, GEMINI_TEXT_MODEL, type GeminiPart } from '@/lib/gemini-client';
import { type ExtractedDaily, type SourcePageText } from '@/lib/extract-response';
import { transcribeAudioFromBuffer } from '@/lib/transcribe-audio';

export type { ExtractedDaily } from '@/lib/extract-response';

const EXTRACTION_PROMPT = `You are a construction daily report parser. Extract structured data from this daily report document.

Return a JSON object with ONLY these fields (omit fields you cannot find or are unsure about):
{
  "tradePartnerName": "company name string",
  "date": "YYYY-MM-DD format",
  "locationDescription": "location or area worked",
  "workerCount": number (headcount — total workers on site),
  "totalHours": number (total worker-hours for the day),
  "crewBreakdown": [{ "craft": "trade name", "count": number }],
  "tierSubcontractors": [{ "name": "subcontractor company", "count": number, "trade": "trade/craft" }],
  "tierSubsSummary": "summary of tier subcontractors or 'None'",
  "equipment": ["equipment item 1", "equipment item 2"],
  "notes": "combined string including delays, coordination items, discrepancies, and safety observations",
  "staCompleted": true or false (Short-Term Anchor / safety task assignment completed),
  "ocrPages": ["verbatim text from page 1", "verbatim text from page 2"]
}

tradePartnerName must be the company printed or written on the form, even if it is unfamiliar. Never replace it with an example contractor name.

ocrPages must transcribe ALL readable text on each page, in reading order. Use one array entry per page. If there is only one page, still return a one-element array. Do not put OCR into notes.

Return ONLY the JSON object. No markdown fences, no explanation.`;

const SPOKEN_EXTRACTION_PROMPT = `You are a construction daily report parser. The following is a speech-to-text transcript of a field foreman speaking their daily report.

Extract structured data. Infer reasonable values when the speaker is informal (e.g. "eight guys" → workerCount 8, "STA is done" → staCompleted true).

tradePartnerName must be the company the speaker named, even if it is unfamiliar or not a well-known contractor. Never replace it with an example company from a list.

Return a JSON object with ONLY these fields (omit fields you cannot find or are unsure about):
{
  "tradePartnerName": "company name string",
  "date": "YYYY-MM-DD format",
  "locationDescription": "location or area worked",
  "workerCount": number (headcount — total workers on site),
  "totalHours": number (total worker-hours for the day),
  "crewBreakdown": [{ "craft": "trade name", "count": number }],
  "tierSubcontractors": [{ "name": "subcontractor company", "count": number, "trade": "trade/craft" }],
  "tierSubsSummary": "summary of tier subcontractors or 'None'",
  "equipment": ["equipment item 1", "equipment item 2"],
  "notes": "combined string including delays, coordination items, discrepancies, and safety observations",
  "staCompleted": true or false (Short-Term Anchor / safety task assignment completed)
}

Return ONLY the JSON object. No markdown fences, no explanation.`;

export function parseGeminiDailyJson(text: string): ExtractedDaily {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const result: ExtractedDaily = {};

    if (typeof parsed.tradePartnerName === 'string') result.tradePartnerName = parsed.tradePartnerName;
    if (typeof parsed.date === 'string') result.date = parsed.date;
    if (typeof parsed.locationDescription === 'string') result.locationDescription = parsed.locationDescription;
    if (typeof parsed.workerCount === 'number') result.workerCount = parsed.workerCount;
    if (typeof parsed.totalHours === 'number') result.totalHours = parsed.totalHours;
    if (Array.isArray(parsed.crewBreakdown)) {
      result.crewBreakdown = (parsed.crewBreakdown as { craft?: unknown; count?: unknown }[])
        .filter(e => typeof e.craft === 'string' && typeof e.count === 'number')
        .map(e => ({ craft: e.craft as string, count: e.count as number }));
    }
    if (Array.isArray(parsed.tierSubcontractors)) {
      result.tierSubcontractors = (parsed.tierSubcontractors as { name?: unknown; count?: unknown; trade?: unknown }[])
        .filter(e => typeof e.name === 'string' && typeof e.count === 'number')
        .map(e => ({
          name: e.name as string,
          count: e.count as number,
          trade: typeof e.trade === 'string' ? e.trade : undefined,
        }));
    }
    if (typeof parsed.tierSubsSummary === 'string') result.tierSubsSummary = parsed.tierSubsSummary;
    if (Array.isArray(parsed.equipment)) {
      result.equipment = (parsed.equipment as unknown[]).filter(e => typeof e === 'string') as string[];
    }
    if (typeof parsed.notes === 'string') result.notes = parsed.notes;
    if (typeof parsed.staCompleted === 'boolean') result.staCompleted = parsed.staCompleted;
    if (Array.isArray(parsed.emailRecipients)) {
      result.emailRecipients = (parsed.emailRecipients as unknown[]).filter(e => typeof e === 'string') as string[];
    }
    const sourcePages = parseSourcePages(parsed);
    if (sourcePages) result.sourcePages = sourcePages;

    return result;
  } catch {
    return {};
  }
}

function parseSourcePages(parsed: Record<string, unknown>): SourcePageText[] | undefined {
  if (Array.isArray(parsed.ocrPages)) {
    const pages: SourcePageText[] = [];
    parsed.ocrPages.forEach((entry, index) => {
      if (typeof entry === 'string' && entry.trim()) {
        pages.push({ page: index + 1, text: entry });
        return;
      }
      if (entry && typeof entry === 'object') {
        const rec = entry as { page?: unknown; text?: unknown };
        if (typeof rec.text === 'string' && rec.text.trim()) {
          const page = typeof rec.page === 'number' && rec.page > 0 ? rec.page : index + 1;
          pages.push({ page, text: rec.text });
        }
      }
    });
    return pages.length > 0 ? pages : undefined;
  }
  if (typeof parsed.ocrText === 'string' && parsed.ocrText.trim()) {
    return [{ page: 1, text: parsed.ocrText }];
  }
  return undefined;
}

// ─── XLSX extraction ──────────────────────────────────────────────────────────

type CellRow = (string | number | boolean | Date | null)[];

/** Return cell value as a trimmed string, or '' if blank. */
function cellStr(v: string | number | boolean | Date | null | undefined): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

/** Search all rows for a label regex; return the next non-empty cell in the same row. */
function findNextCell(rows: CellRow[], label: RegExp): (string | number | boolean | Date | null) | undefined {
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      if (label.test(cellStr(row[i]))) {
        for (let j = i + 1; j < row.length; j++) {
          if (row[j] != null && cellStr(row[j]) !== '') return row[j];
        }
      }
    }
  }
  return undefined;
}

function toNumber(v: string | number | boolean | Date | null | undefined): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === 'number' ? v : parseFloat(cellStr(v));
  return isNaN(n) ? undefined : n;
}

function toDateString(v: string | number | boolean | Date | null | undefined): string | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = cellStr(v);
  if (!s) return undefined;
  // XLSX serial number
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? s : parsed.toISOString().slice(0, 10);
}

function extractFromXlsx(buffer: Buffer): ExtractedDaily {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const result: ExtractedDaily = {};

  const allRows: CellRow[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<CellRow>(sheet, { header: 1, defval: null });
    for (const row of rows) {
      if (row.some(c => c != null && cellStr(c) !== '')) {
        allRows.push(row);
      }
    }
  }

  const tpRaw = findNextCell(allRows, /trade\s*partner|company|contractor|subcontract/i);
  if (tpRaw != null) result.tradePartnerName = cellStr(tpRaw);

  const dateRaw = findNextCell(allRows, /^date$|work\s*date|report\s*date/i);
  const dateStr = toDateString(dateRaw);
  if (dateStr) result.date = dateStr;

  const locRaw = findNextCell(allRows, /location|area|zone|work\s*area/i);
  if (locRaw != null) result.locationDescription = cellStr(locRaw);

  const wkRaw = findNextCell(allRows, /worker\s*count|headcount|workers?\s*on\s*site|manpower|total\s*workers?/i);
  const wkNum = toNumber(wkRaw);
  if (wkNum !== undefined) result.workerCount = wkNum;

  const hrRaw = findNextCell(allRows, /total\s*hours?|man[\s-]?hours?|worker[\s-]?hours?/i);
  const hrNum = toNumber(hrRaw);
  if (hrNum !== undefined) result.totalHours = hrNum;

  const staRaw = findNextCell(allRows, /sta\s*completed?|safety\s*task\s*assign/i);
  if (staRaw != null) result.staCompleted = /yes|true|1|x/i.test(cellStr(staRaw));

  const noteParts: string[] = [];
  const noteLabels: RegExp[] = [
    /delay/i,
    /coordination/i,
    /discrepanc/i,
    /safety\s*obs/i,
    /^notes?$/i,
    /^comments?$/i,
    /remarks?/i,
  ];
  for (const label of noteLabels) {
    const val = findNextCell(allRows, label);
    if (val != null) {
      const s = cellStr(val);
      if (s && !noteParts.includes(s)) noteParts.push(s);
    }
  }
  if (noteParts.length > 0) result.notes = noteParts.join('; ');

  const dump = allRows
    .map((row) => row.map((cell) => cellStr(cell)).filter(Boolean).join('\t'))
    .filter(Boolean)
    .join('\n');
  if (dump && Object.keys(result).length > 0) {
    result.sourcePages = [{ page: 1, text: dump }];
  }

  return result;
}

// ─── Gemini vision / PDF extraction ──────────────────────────────────────────

async function extractWithGemini(buffer: Buffer, mimeType: string): Promise<ExtractedDaily> {
  const result = await geminiGenerate({
    model: GEMINI_TEXT_MODEL,
    parts: [
      { text: EXTRACTION_PROMPT },
      { inlineData: { data: buffer.toString('base64'), mimeType } },
    ],
  });
  if (!result?.text) return {};
  return parseGeminiDailyJson(result.text);
}

async function extractWithGeminiMultiple(
  files: { buffer: Buffer; mimeType: string; filename: string }[],
): Promise<ExtractedDaily> {
  const parts: GeminiPart[] = [
    { text: EXTRACTION_PROMPT },
  ];

  files.forEach((f, idx) => {
    parts.push({
      text: `\n--- PAGE / IMAGE ${idx + 1} of ${files.length} (Filename: ${f.filename}) ---\n`,
    });
    const safeMime =
      f.mimeType && (f.mimeType.startsWith('image/') || f.mimeType === 'application/pdf')
        ? f.mimeType
        : 'image/jpeg';
    parts.push({
      inlineData: {
        data: f.buffer.toString('base64'),
        mimeType: safeMime,
      },
    });
  });

  const result = await geminiGenerate({
    model: GEMINI_TEXT_MODEL,
    parts,
  });

  if (!result?.text) return {};
  const extracted = parseGeminiDailyJson(result.text);

  if (files.length > 1) {
    const existingPages = extracted.sourcePages ?? [];
    const pageMap = new Map(existingPages.map((p) => [p.page, p.text]));
    const fullPages: SourcePageText[] = [];
    for (let i = 1; i <= files.length; i++) {
      fullPages.push({
        page: i,
        text: pageMap.get(i) || `[Page ${i}: ${files[i - 1].filename}]`,
      });
    }
    extracted.sourcePages = fullPages;
  }

  return extracted;
}

function mergeTranscriptNotes(extracted: ExtractedDaily, transcript: string): ExtractedDaily {
  const notes = extracted.notes?.trim();
  return {
    ...extracted,
    spokenTranscript: transcript,
    notes: notes && notes.length > 0 ? notes : transcript,
  };
}

export async function extractDailyFromTranscript(
  transcript: string,
  requestId?: string,
): Promise<ExtractedDaily> {
  const trimmed = transcript.trim();
  if (!trimmed) return {};

  const result = await geminiGenerate({
    model: GEMINI_TEXT_MODEL,
    requestId,
    parts: [
      { text: SPOKEN_EXTRACTION_PROMPT },
      { text: `TRANSCRIPT:\n"""\n${trimmed}\n"""` },
    ],
  });
  if (!result?.text) return mergeTranscriptNotes({}, trimmed);
  return mergeTranscriptNotes(parseGeminiDailyJson(result.text), trimmed);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ExtractInputFile {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

export async function extractDailyFromMultipleFiles(
  files: ExtractInputFile[],
): Promise<ExtractedDaily> {
  if (!files || files.length === 0) return {};
  if (files.length === 1) {
    return extractDailyFromBuffer(files[0].buffer, files[0].mimeType, files[0].filename);
  }

  const audioFiles = files.filter((f) => isAudioMedia(f.mimeType, f.filename));
  const docFiles = files.filter((f) => !isAudioMedia(f.mimeType, f.filename));

  let combined: ExtractedDaily = {};

  if (docFiles.length > 0) {
    const xlsxFiles = docFiles.filter((f) => {
      const lower = f.filename.toLowerCase();
      return lower.endsWith('.xlsx') || lower.endsWith('.xls');
    });
    const imageDocFiles = docFiles.filter((f) => {
      const lower = f.filename.toLowerCase();
      return !lower.endsWith('.xlsx') && !lower.endsWith('.xls');
    });

    if (imageDocFiles.length === 1) {
      combined = await extractDailyFromBuffer(
        imageDocFiles[0].buffer,
        imageDocFiles[0].mimeType,
        imageDocFiles[0].filename,
      );
    } else if (imageDocFiles.length > 1) {
      combined = await extractWithGeminiMultiple(imageDocFiles);
    }

    for (const xf of xlsxFiles) {
      try {
        const xExtracted = extractFromXlsx(xf.buffer);
        combined = { ...xExtracted, ...combined };
      } catch {}
    }
  }

  for (const af of audioFiles) {
    try {
      const tr = await transcribeAudioFromBuffer(af.buffer, af.mimeType, af.filename);
      if (tr) {
        const aExtracted = await extractDailyFromTranscript(tr);
        combined = {
          ...combined,
          ...aExtracted,
          notes: [combined.notes, aExtracted.notes].filter(Boolean).join('; '),
        };
      }
    } catch {}
  }

  return combined;
}

export async function extractDailyFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<ExtractedDaily> {
  if (isAudioMedia(mimeType, filename)) {
    const transcript = await transcribeAudioFromBuffer(buffer, mimeType, filename);
    return extractDailyFromTranscript(transcript);
  }

  const lower = filename.toLowerCase();
  const isSpreadsheet =
    lower.endsWith('.xlsx') ||
    lower.endsWith('.xls') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel';

  if (isSpreadsheet) {
    try {
      return extractFromXlsx(buffer);
    } catch {
      return {};
    }
  }

  return extractWithGemini(buffer, mimeType);
}
