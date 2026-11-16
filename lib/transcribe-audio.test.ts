import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { transcribeAudioFromBuffer, normalizeProjectTranscript } from './transcribe-audio';

describe('normalizeProjectTranscript', () => {
  it('corrects data center colo misheard as color when colo is in keywords', () => {
    const raw = 'We pulled feeder cable into the color room and checked the color 2 switchgear.';
    const normalized = normalizeProjectTranscript(raw, ['colo', 'MPOE']);
    expect(normalized).toBe('We pulled feeder cable into the colo room and checked the colo 2 switchgear.');
  });

  it('capitalizes project acronyms like MPOE, AHU, VAV', () => {
    const raw = 'Installed ductwork at ahu 4 and connected mpoe fiber lines.';
    const normalized = normalizeProjectTranscript(raw, ['MPOE', 'AHU', 'VAV']);
    expect(normalized).toBe('Installed ductwork at AHU 4 and connected MPOE fiber lines.');
  });
});

describe('transcribeAudioFromBuffer – no provider keys', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ['GROQ_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY']) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value !== undefined) process.env[key] = value;
      else delete process.env[key];
    }
  });

  it('returns an empty string when no STT keys are configured', async () => {
    const text = await transcribeAudioFromBuffer(
      Buffer.from('not-real-audio'),
      'audio/webm',
      'clip.webm',
    );
    expect(text).toBe('');
  });
});
