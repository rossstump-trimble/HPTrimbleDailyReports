import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { transcribeAudioFromBuffer } from './transcribe-audio';

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
