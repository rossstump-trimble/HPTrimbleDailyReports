import fs from 'fs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/gemini-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gemini-client')>();
  return { ...actual, geminiGenerate: vi.fn() };
});

import { geminiGenerate } from '@/lib/gemini-client';
import { POST } from './submit/route';
import { defaultBackupRoot, listLocalIngestedDailies } from '@/lib/ingest-backup';
import { getDefaultDbPath } from '@/lib/store';
import { uploadRoot } from '@/lib/upload-store';

const mockedGenerate = vi.mocked(geminiGenerate);

function cleanupTestArtifacts() {
  for (const target of [getDefaultDbPath(), defaultBackupRoot(), uploadRoot()]) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function submit(body: Record<string, unknown>, date: string) {
  return POST(
    new Request('http://localhost:3000/api/intake/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: '1025',
        tradePartnerName: 'Lengua Electric',
        date,
        workerCount: 4,
        totalHours: 32,
        ...body,
      }),
    }),
  );
}

describe('Intake submit with a non-English report', () => {
  beforeEach(() => {
    mockedGenerate.mockReset();
    cleanupTestArtifacts();
  });

  afterEach(() => {
    cleanupTestArtifacts();
  });

  it('stores the English translation and keeps the original wording', async () => {
    mockedGenerate.mockResolvedValueOnce({ text: JSON.stringify(['Rain delay']), inlineData: null });

    const res = await submit({ notes: 'Retraso por lluvia', language: 'es' }, '2026-10-11');

    expect(res.status).toBe(200);
    const saved = listLocalIngestedDailies('1025', '2026-10-11').find(
      (r) => r.tradePartnerName === 'Lengua Electric',
    );
    expect(saved?.notes).toBe('Rain delay');
    expect(saved?.originalLanguage).toBe('es');
    expect(saved?.translationStatus).toBe('translated');
    expect(saved?.originalText?.notes).toBe('Retraso por lluvia');
  });

  it('still accepts the report, flagged, when translation is unavailable', async () => {
    mockedGenerate.mockResolvedValueOnce(null);

    const res = await submit({ notes: 'Retraso por lluvia', language: 'es' }, '2026-10-12');

    expect(res.status).toBe(200);
    const saved = listLocalIngestedDailies('1025', '2026-10-12').find(
      (r) => r.tradePartnerName === 'Lengua Electric',
    );
    expect(saved?.notes).toBe('Retraso por lluvia');
    expect(saved?.translationStatus).toBe('failed');
    expect(saved?.originalText?.notes).toBe('Retraso por lluvia');
  });

  it('does not translate English submissions or unsupported language codes', async () => {
    await submit({ notes: 'Rain delay', language: 'en' }, '2026-10-13');
    await submit({ notes: 'Rain delay', language: 'xx' }, '2026-10-14');

    expect(mockedGenerate).not.toHaveBeenCalled();
    const saved = listLocalIngestedDailies('1025', '2026-10-13').find(
      (r) => r.tradePartnerName === 'Lengua Electric',
    );
    expect(saved?.originalLanguage).toBeUndefined();
  });
});
