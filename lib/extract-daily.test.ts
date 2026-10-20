import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as XLSX from 'xlsx';
import { parseGeminiDailyJson, extractDailyFromBuffer, extractDailyFromTranscript } from './extract-daily';

// ─── parseGeminiDailyJson ────────────────────────────────────────────────────

describe('parseGeminiDailyJson', () => {
  it('parses a well-formed JSON response', () => {
    const payload = {
      tradePartnerName: 'Apex Steel',
      date: '2026-08-15',
      locationDescription: 'Building A – 3rd Floor',
      workerCount: 8,
      totalHours: 64,
      crewBreakdown: [{ craft: 'Iron Worker', count: 8 }],
      equipment: ['Crane', 'Forklift'],
      notes: 'No delays observed.',
      staCompleted: true,
    };
    const result = parseGeminiDailyJson(JSON.stringify(payload));
    expect(result.tradePartnerName).toBe('Apex Steel');
    expect(result.date).toBe('2026-08-15');
    expect(result.locationDescription).toBe('Building A – 3rd Floor');
    expect(result.workerCount).toBe(8);
    expect(result.totalHours).toBe(64);
    expect(result.crewBreakdown).toEqual([{ craft: 'Iron Worker', count: 8 }]);
    expect(result.equipment).toEqual(['Crane', 'Forklift']);
    expect(result.notes).toBe('No delays observed.');
    expect(result.staCompleted).toBe(true);
  });

  it('strips ```json ... ``` markdown fences', () => {
    const wrapped = '```json\n{"tradePartnerName":"ALC","workerCount":3}\n```';
    const result = parseGeminiDailyJson(wrapped);
    expect(result.tradePartnerName).toBe('ALC');
    expect(result.workerCount).toBe(3);
  });

  it('strips plain ``` fences', () => {
    const wrapped = '```\n{"tradePartnerName":"Titan Electric"}\n```';
    const result = parseGeminiDailyJson(wrapped);
    expect(result.tradePartnerName).toBe('Titan Electric');
  });

  it('returns an empty object for invalid JSON', () => {
    expect(parseGeminiDailyJson('not json')).toEqual({});
    expect(parseGeminiDailyJson('')).toEqual({});
    expect(parseGeminiDailyJson('{ bad }')).toEqual({});
  });

  it('ignores fields whose values have the wrong type', () => {
    const json = JSON.stringify({
      workerCount: 'not-a-number',
      totalHours: null,
      staCompleted: 'yes',
      tradePartnerName: 42,
    });
    const result = parseGeminiDailyJson(json);
    expect(result.workerCount).toBeUndefined();
    expect(result.totalHours).toBeUndefined();
    expect(result.staCompleted).toBeUndefined();
    expect(result.tradePartnerName).toBeUndefined();
  });

  it('filters invalid crewBreakdown entries', () => {
    const json = JSON.stringify({
      crewBreakdown: [
        { craft: 'Electrician', count: 4 },
        { craft: 'Laborer' }, // missing count
        { count: 2 }, // missing craft
        'bad entry',
      ],
    });
    const result = parseGeminiDailyJson(json);
    expect(result.crewBreakdown).toHaveLength(1);
    expect(result.crewBreakdown?.[0]).toEqual({ craft: 'Electrician', count: 4 });
  });

  it('filters non-string equipment entries', () => {
    const json = JSON.stringify({ equipment: ['Scissor Lift', 42, null, 'Forklift'] });
    const result = parseGeminiDailyJson(json);
    expect(result.equipment).toEqual(['Scissor Lift', 'Forklift']);
  });

  it('handles partial data — only present fields populated', () => {
    const json = JSON.stringify({ tradePartnerName: 'Cascade Plumbing' });
    const result = parseGeminiDailyJson(json);
    expect(result.tradePartnerName).toBe('Cascade Plumbing');
    expect(result.date).toBeUndefined();
    expect(result.workerCount).toBeUndefined();
  });

  it('maps ocrPages strings onto 1-based sourcePages and leaves notes alone', () => {
    const result = parseGeminiDailyJson(
      JSON.stringify({
        tradePartnerName: 'ALC',
        notes: 'No delays.',
        ocrPages: ['Page one company ALC', 'Page two 6 electricians'],
      }),
    );
    expect(result.notes).toBe('No delays.');
    expect(result.sourcePages).toEqual([
      { page: 1, text: 'Page one company ALC' },
      { page: 2, text: 'Page two 6 electricians' },
    ]);
  });

  it('treats a single ocrText string as page 1', () => {
    const result = parseGeminiDailyJson(JSON.stringify({ ocrText: 'ALC six guys 48 hours' }));
    expect(result.sourcePages).toEqual([{ page: 1, text: 'ALC six guys 48 hours' }]);
  });
});

// ─── extractDailyFromBuffer — xlsx ──────────────────────────────────────────

function makeSampleXlsx(overrides: Record<string, unknown> = {}): Buffer {
  const defaults: Record<string, unknown> = {
    'Trade Partner': 'Apex Steel',
    Date: '2026-08-20',
    Location: 'Building B – Roof Level',
    'Worker Count': 12,
    'Total Hours': 96,
    'STA Completed': 'Yes',
    Notes: 'Crane inspection completed.',
  };
  const data = Object.entries({ ...defaults, ...overrides }).map(([k, v]) => [k, v]);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

describe('extractDailyFromBuffer – xlsx', () => {
  it('extracts tradePartnerName', async () => {
    const result = await extractDailyFromBuffer(
      makeSampleXlsx(),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'daily.xlsx',
    );
    expect(result.tradePartnerName).toBe('Apex Steel');
  });

  it('extracts workerCount as a number', async () => {
    const result = await extractDailyFromBuffer(makeSampleXlsx(), 'application/xlsx', 'report.xlsx');
    expect(result.workerCount).toBe(12);
  });

  it('extracts totalHours as a number', async () => {
    const result = await extractDailyFromBuffer(makeSampleXlsx(), 'application/xlsx', 'report.xlsx');
    expect(result.totalHours).toBe(96);
  });

  it('extracts locationDescription', async () => {
    const result = await extractDailyFromBuffer(makeSampleXlsx(), 'application/xlsx', 'report.xlsx');
    expect(result.locationDescription).toBe('Building B – Roof Level');
  });

  it('extracts staCompleted = true for "Yes"', async () => {
    const result = await extractDailyFromBuffer(makeSampleXlsx(), 'application/xlsx', 'report.xlsx');
    expect(result.staCompleted).toBe(true);
  });

  it('extracts staCompleted = false for "No"', async () => {
    const result = await extractDailyFromBuffer(
      makeSampleXlsx({ 'STA Completed': 'No' }),
      'application/xlsx',
      'report.xlsx',
    );
    expect(result.staCompleted).toBe(false);
  });

  it('extracts notes', async () => {
    const result = await extractDailyFromBuffer(makeSampleXlsx(), 'application/xlsx', 'report.xlsx');
    expect(result.notes).toContain('Crane inspection');
  });

  it('keeps a text dump of the sheet for source review', async () => {
    const result = await extractDailyFromBuffer(makeSampleXlsx(), 'application/xlsx', 'daily.xlsx');
    expect(result.sourcePages?.[0]?.text).toMatch(/Apex Steel/);
  });

  it('returns empty object for corrupt/non-xlsx buffer', async () => {
    const result = await extractDailyFromBuffer(
      Buffer.from('this-is-not-a-valid-xlsx-file'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'corrupt.xlsx',
    );
    expect(result).toEqual({});
  });

  it('uses filename extension .xls to trigger spreadsheet path', async () => {
    // Write as xls
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Worker Count', 5]]), 'S');
    const buf = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xls' }));
    const result = await extractDailyFromBuffer(buf, 'application/octet-stream', 'report.xls');
    expect(result.workerCount).toBe(5);
  });
});

// ─── extractDailyFromBuffer — Gemini fallback ────────────────────────────────

describe('extractDailyFromBuffer – Gemini API key absent', () => {
  let saved: string | undefined;

  beforeEach(() => {
    saved = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
    else delete process.env.GEMINI_API_KEY;
  });

  it('returns empty object for JPEG when key is missing', async () => {
    const result = await extractDailyFromBuffer(
      Buffer.from('fake-image-bytes'),
      'image/jpeg',
      'photo.jpg',
    );
    expect(result).toEqual({});
  });

  it('returns empty object for PDF when key is missing', async () => {
    const result = await extractDailyFromBuffer(
      Buffer.from('%PDF-1.4 fake'),
      'application/pdf',
      'daily-report.pdf',
    );
    expect(result).toEqual({});
  });

  it('returns empty object for PNG when key is missing', async () => {
    const result = await extractDailyFromBuffer(
      Buffer.from('PNG data'),
      'image/png',
      'screenshot.png',
    );
    expect(result).toEqual({});
  });
});

describe('extractDailyFromBuffer – audio without STT keys', () => {
  const keys = ['GROQ_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY'] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of keys) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of keys) {
      if (saved[key] !== undefined) process.env[key] = saved[key];
      else delete process.env[key];
    }
  });

  it('returns empty object for webm when no STT provider is configured', async () => {
    const result = await extractDailyFromBuffer(
      Buffer.from('fake-audio'),
      'audio/webm',
      'daily.webm',
    );
    expect(result).toEqual({});
  });

  it('returns empty object for iOS m4a when no STT provider is configured', async () => {
    const result = await extractDailyFromBuffer(
      Buffer.from('fake-audio'),
      'audio/mp4',
      'daily.m4a',
    );
    expect(result).toEqual({});
  });
});

describe('extractDailyFromTranscript – Gemini API key absent', () => {
  let saved: string | undefined;
  let savedGoogle: string | undefined;

  beforeEach(() => {
    saved = process.env.GEMINI_API_KEY;
    savedGoogle = process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  afterEach(() => {
    if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
    else delete process.env.GEMINI_API_KEY;
    if (savedGoogle !== undefined) process.env.GOOGLE_API_KEY = savedGoogle;
    else delete process.env.GOOGLE_API_KEY;
  });

  it('keeps the spoken words in notes when extraction is unavailable', async () => {
    const result = await extractDailyFromTranscript(
      'ALC, six electricians, 48 hours, STA is done, no delays.',
    );
    expect(result.spokenTranscript).toBe('ALC, six electricians, 48 hours, STA is done, no delays.');
    expect(result.notes).toBe('ALC, six electricians, 48 hours, STA is done, no delays.');
  });

  it('returns empty object for blank transcript', async () => {
    expect(await extractDailyFromTranscript('   ')).toEqual({});
  });
});
