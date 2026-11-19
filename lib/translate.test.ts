import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DailyReport } from '@/types/hpproto';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hp-translate-'));

vi.mock('@/lib/gemini-client', () => ({
  GEMINI_TEXT_MODEL: 'test-model',
  geminiGenerate: vi.fn(),
}));
vi.mock('@/lib/store', () => ({
  getDefaultDbPath: () => path.join(tempDir, 'hpproto-db.json'),
}));

import { geminiGenerate } from '@/lib/gemini-client';
import {
  applyEnglishTranslation,
  resetUiTranslationCacheForTests,
  translateTexts,
  translateUiStrings,
} from './translate';

const mockedGenerate = vi.mocked(geminiGenerate);

function modelReturns(strings: string[] | null): void {
  mockedGenerate.mockResolvedValueOnce(
    strings === null ? null : { text: JSON.stringify(strings), inlineData: null },
  );
}

function report(overrides: Partial<DailyReport> = {}): DailyReport {
  return {
    id: 'r1',
    projectId: 'p1',
    tradePartnerId: 't1',
    tradePartnerName: 'Acme',
    date: '2026-11-19',
    submittedAt: '2026-11-19T00:00:00Z',
    locationDescription: 'Piso 2 - instalamos tubería',
    workerCount: 3,
    totalHours: 24,
    crewBreakdown: [{ craft: 'Electricista', count: 3 }],
    tierSubcontractors: [{ name: 'Sub Uno', count: 2, trade: 'Plomería' }],
    tierSubsSummary: '',
    equipment: ['Elevador de tijera'],
    notes: 'Retraso por lluvia',
    tradesAndFavors: '',
    staCompleted: true,
    emailRecipients: [],
    ...overrides,
  };
}

describe('translate', () => {
  beforeEach(() => {
    mockedGenerate.mockReset();
    resetUiTranslationCacheForTests();
    fs.rmSync(path.join(tempDir, 'ui-translations.json'), { force: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('translateTexts', () => {
    it('returns the translations in order', async () => {
      modelReturns(['Hello', 'Goodbye']);

      expect(await translateTexts(['Hola', 'Adiós'], { from: 'es', to: 'en', purpose: 'report' })).toEqual([
        'Hello',
        'Goodbye',
      ]);
    });

    it('accepts a response wrapped in a markdown fence', async () => {
      mockedGenerate.mockResolvedValueOnce({ text: '```json\n["Hello"]\n```', inlineData: null });

      expect(await translateTexts(['Hola'], { from: 'es', to: 'en', purpose: 'report' })).toEqual(['Hello']);
    });

    it('returns null when the model returns the wrong number of items', async () => {
      modelReturns(['Only one']);

      expect(await translateTexts(['a', 'b'], { from: 'es', to: 'en', purpose: 'ui' })).toBeNull();
    });

    it('returns null when the model is unavailable', async () => {
      modelReturns(null);

      expect(await translateTexts(['a'], { from: 'en', to: 'es', purpose: 'ui' })).toBeNull();
    });

    it('does not call the model for an empty list', async () => {
      expect(await translateTexts([], { from: 'en', to: 'es', purpose: 'ui' })).toEqual([]);
      expect(mockedGenerate).not.toHaveBeenCalled();
    });
  });

  describe('translateUiStrings', () => {
    it('translates once and serves repeats from the cache, including after a restart', async () => {
      modelReturns(['Enviar informe']);

      const first = await translateUiStrings('es', ['Submit Report']);
      resetUiTranslationCacheForTests();
      const second = await translateUiStrings('es', ['Submit Report']);

      expect(first).toEqual({ 'Submit Report': 'Enviar informe' });
      expect(second).toEqual(first);
      expect(mockedGenerate).toHaveBeenCalledTimes(1);
    });

    it('omits strings that could not be translated so the page keeps the English', async () => {
      modelReturns(null);

      expect(await translateUiStrings('ar', ['Submit Report'])).toEqual({});
    });

    it('keeps languages separate', async () => {
      modelReturns(['Enviar informe']);
      modelReturns(['Soumettre']);

      await translateUiStrings('es', ['Submit Report']);
      const french = await translateUiStrings('fr', ['Submit Report']);

      expect(french).toEqual({ 'Submit Report': 'Soumettre' });
    });
  });

  describe('applyEnglishTranslation', () => {
    it('replaces the free text with English and keeps the original wording', async () => {
      // Order sent: location, notes, equipment, craft, trade (empty fields are not sent)
      modelReturns(['Floor 2 - installed piping', 'Rain delay', 'Scissor lift', 'Electrician', 'Plumbing']);

      const result = await applyEnglishTranslation(report(), 'es');

      expect(result.locationDescription).toBe('Floor 2 - installed piping');
      expect(result.notes).toBe('Rain delay');
      expect(result.equipment).toEqual(['Scissor lift']);
      expect(result.crewBreakdown[0]).toEqual({ craft: 'Electrician', count: 3 });
      expect(result.tierSubcontractors?.[0]).toEqual({ name: 'Sub Uno', count: 2, trade: 'Plumbing' });
      expect(result.tradesAndFavors).toBe('');
      expect(result.originalLanguage).toBe('es');
      expect(result.translationStatus).toBe('translated');
      expect(result.originalText).toEqual({
        locationDescription: 'Piso 2 - instalamos tubería',
        notes: 'Retraso por lluvia',
        tradesAndFavors: '',
        tierSubsSummary: '',
        equipment: ['Elevador de tijera'],
        crewCrafts: ['Electricista'],
        tierTrades: ['Plomería'],
      });
    });

    it('keeps the submitted text and flags the report when translation is unavailable', async () => {
      modelReturns(null);
      const original = report();

      const result = await applyEnglishTranslation(original, 'es');

      expect(result.locationDescription).toBe(original.locationDescription);
      expect(result.notes).toBe(original.notes);
      expect(result.translationStatus).toBe('failed');
      expect(result.originalLanguage).toBe('es');
    });

    it('never counts a tier subcontractor name as translatable wording', async () => {
      modelReturns(['a', 'b', 'c', 'd', 'e']);

      await applyEnglishTranslation(report(), 'es');

      const sent = JSON.parse((mockedGenerate.mock.calls[0][0].parts[1] as { text: string }).text) as string[];
      expect(sent).not.toContain('Sub Uno');
    });
  });
});
