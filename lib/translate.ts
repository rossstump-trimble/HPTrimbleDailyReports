import fs from 'fs';
import path from 'path';
import { geminiGenerate, GEMINI_TEXT_MODEL } from '@/lib/gemini-client';
import { getIntakeLanguage } from '@/lib/intake-languages';
import { getDefaultDbPath } from '@/lib/store';
import type { DailyReport, OriginalReportText } from '@/types/hpproto';
import { errorMessage, voiceLog } from '@/lib/voice-log';

const UI_BATCH_SIZE = 60;
const PRESERVED_TERMS = 'Hensel Phelps, Trimble, ProjectSight, STA, QR, PDF, AI';

type TranslationPurpose = 'ui' | 'report';

const PURPOSE_RULES: Record<TranslationPurpose, string> = {
  ui: 'These are short user-interface labels, buttons and instructions in a construction field app used by trade-partner foremen. Keep them short and natural for field workers.',
  report:
    'These are fields from a construction daily report written by a field foreman. Translate faithfully: do not summarize, add or drop information. Keep trade names, equipment names, locations and quantities accurate.',
};

function buildPrompt(
  count: number,
  sourceName: string,
  targetName: string,
  purpose: TranslationPurpose,
  keepTerms: string[],
): string {
  const terms = [PRESERVED_TERMS, ...keepTerms].filter(Boolean).join(', ');
  return [
    `Translate each string in the JSON array from ${sourceName} to ${targetName}.`,
    PURPOSE_RULES[purpose],
    `Leave numbers, dates, emails, URLs, file names, symbols and these terms unchanged: ${terms}.`,
    'Keep surrounding punctuation such as ellipses, arrows, asterisks and parentheses.',
    `Return ONLY a JSON array of exactly ${count} strings in the same order. No markdown fences, no commentary.`,
  ].join('\n');
}

function parseStringArray(text: string, expectedLength: number): string[] | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (
      Array.isArray(parsed) &&
      parsed.length === expectedLength &&
      parsed.every((item) => typeof item === 'string')
    ) {
      return parsed as string[];
    }
  } catch {
    // fall through
  }
  return null;
}

/** Null when the model is unavailable or returns something that can't be matched back to the input. */
export async function translateTexts(
  texts: string[],
  options: {
    from: string;
    to: string;
    purpose: TranslationPurpose;
    keepTerms?: string[];
  },
): Promise<string[] | null> {
  if (texts.length === 0) return [];
  const prompt = buildPrompt(
    texts.length,
    getIntakeLanguage(options.from).name,
    getIntakeLanguage(options.to).name,
    options.purpose,
    options.keepTerms ?? [],
  );
  try {
    const result = await geminiGenerate({
      model: GEMINI_TEXT_MODEL,
      parts: [{ text: prompt }, { text: JSON.stringify(texts) }],
    });
    if (!result?.text) return null;
    const translated = parseStringArray(result.text, texts.length);
    if (!translated) {
      voiceLog('translate', 'warn', 'translation response did not match input shape', {
        purpose: options.purpose,
        to: options.to,
        count: texts.length,
      });
    }
    return translated;
  } catch (err) {
    voiceLog('translate', 'error', 'translation threw', { error: errorMessage(err) });
    return null;
  }
}

// ─── UI string cache ───────────────────────────────────────────────────────────

type UiTranslationCache = Record<string, Record<string, string>>;

let uiCache: UiTranslationCache | null = null;

function uiCachePath(): string {
  return path.join(path.dirname(getDefaultDbPath()), 'ui-translations.json');
}

function loadUiCache(): UiTranslationCache {
  if (uiCache) return uiCache;
  try {
    uiCache = JSON.parse(fs.readFileSync(uiCachePath(), 'utf8')) as UiTranslationCache;
  } catch {
    uiCache = {};
  }
  return uiCache;
}

function saveUiCache(): void {
  try {
    fs.writeFileSync(uiCachePath(), JSON.stringify(uiCache ?? {}));
  } catch (err) {
    voiceLog('translate', 'warn', 'could not persist UI translation cache', { error: errorMessage(err) });
  }
}

export function resetUiTranslationCacheForTests(): void {
  uiCache = null;
}

/** Strings that could not be translated are omitted so the client leaves them in English. */
export async function translateUiStrings(
  language: string,
  strings: string[],
): Promise<Record<string, string>> {
  const cache = loadUiCache();
  const forLanguage = (cache[language] ??= {});
  const missing = Array.from(new Set(strings)).filter((s) => forLanguage[s] === undefined);

  let changed = false;
  for (let i = 0; i < missing.length; i += UI_BATCH_SIZE) {
    const batch = missing.slice(i, i + UI_BATCH_SIZE);
    const translated = await translateTexts(batch, { from: 'en', to: language, purpose: 'ui' });
    if (!translated) continue;
    batch.forEach((source, index) => {
      forLanguage[source] = translated[index];
    });
    changed = true;
  }
  if (changed) saveUiCache();

  const result: Record<string, string> = {};
  for (const s of strings) {
    if (forLanguage[s] !== undefined) result[s] = forLanguage[s];
  }
  return result;
}

// ─── Report translation ────────────────────────────────────────────────────────

function flattenReportText(text: OriginalReportText): string[] {
  return [
    text.locationDescription,
    text.notes,
    text.tradesAndFavors,
    text.tierSubsSummary,
    ...text.equipment,
    ...text.crewCrafts,
    ...text.tierTrades,
  ];
}

function rebuildReportText(
  shape: OriginalReportText,
  flat: string[],
): OriginalReportText {
  let cursor = 0;
  const take = (): string => flat[cursor++];
  return {
    locationDescription: take(),
    notes: take(),
    tradesAndFavors: take(),
    tierSubsSummary: take(),
    equipment: shape.equipment.map(take),
    crewCrafts: shape.crewCrafts.map(take),
    tierTrades: shape.tierTrades.map(take),
  };
}

/** Translates only the non-empty fields; null when translation was unavailable so callers keep the original. */
export async function translateReportToEnglish(
  text: OriginalReportText,
  fromLanguage: string,
  keepTerms: string[] = [],
): Promise<OriginalReportText | null> {
  const flat = flattenReportText(text);
  const indexes = flat.flatMap((value, index) => (value.trim() ? [index] : []));
  if (indexes.length === 0) return text;

  const translated = await translateTexts(
    indexes.map((i) => flat[i]),
    { from: fromLanguage, to: 'en', purpose: 'report', keepTerms },
  );
  if (!translated) return null;

  const merged = [...flat];
  indexes.forEach((flatIndex, position) => {
    merged[flatIndex] = translated[position];
  });
  return rebuildReportText(text, merged);
}

/**
 * Moves the foreman's wording into `originalText` and replaces the live fields with English.
 * If translation is unavailable the report is still accepted untouched and flagged, because losing a field report is worse than an untranslated one.
 */
export async function applyEnglishTranslation(
  report: DailyReport,
  language: string,
  keepTerms: string[] = [],
): Promise<DailyReport> {
  const original: OriginalReportText = {
    locationDescription: report.locationDescription,
    notes: report.notes,
    tradesAndFavors: report.tradesAndFavors ?? '',
    tierSubsSummary: report.tierSubsSummary ?? '',
    equipment: report.equipment,
    crewCrafts: report.crewBreakdown.map((entry) => entry.craft),
    tierTrades: (report.tierSubcontractors ?? []).map((sub) => sub.trade ?? ''),
  };

  const english = await translateReportToEnglish(original, language, keepTerms);
  if (!english) {
    return { ...report, originalLanguage: language, originalText: original, translationStatus: 'failed' };
  }

  return {
    ...report,
    locationDescription: english.locationDescription,
    notes: english.notes,
    tradesAndFavors: english.tradesAndFavors,
    tierSubsSummary: english.tierSubsSummary,
    equipment: english.equipment,
    crewBreakdown: report.crewBreakdown.map((entry, i) => ({
      ...entry,
      craft: english.crewCrafts[i] || entry.craft,
    })),
    tierSubcontractors: report.tierSubcontractors?.map((sub, i) => ({
      ...sub,
      trade: english.tierTrades[i] || undefined,
    })),
    originalLanguage: language,
    originalText: original,
    translationStatus: 'translated',
  };
}
