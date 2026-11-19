import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/gemini-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gemini-client')>();
  return { ...actual, geminiGenerate: vi.fn() };
});

import { geminiGenerate } from '@/lib/gemini-client';
import { extractDailyFromTranscript } from './extract-daily';

const mockedGenerate = vi.mocked(geminiGenerate);

function sentText(): string {
  return mockedGenerate.mock.calls[0][0].parts
    .map((part) => ('text' in part ? part.text : ''))
    .join('\n');
}

describe('extractDailyFromTranscript language', () => {
  beforeEach(() => {
    mockedGenerate.mockReset();
    mockedGenerate.mockResolvedValue({ text: '{"notes":"x"}', inlineData: null });
  });

  it('tells the model to keep free text in the spoken language', async () => {
    await extractDailyFromTranscript('Hoy instalamos tubería', undefined, 'es');

    expect(sentText()).toContain('The source is in Spanish');
    expect(sentText()).toContain('Do NOT translate');
  });

  it('adds no language instruction for English', async () => {
    await extractDailyFromTranscript('We installed piping today');

    expect(sentText()).not.toContain('The source is in');
  });
});
