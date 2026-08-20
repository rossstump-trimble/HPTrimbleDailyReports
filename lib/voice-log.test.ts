import { describe, expect, it } from 'vitest';
import { previewText, sanitizeVoiceFields } from './voice-log';

describe('voice-log sanitizer', () => {
  it('redacts API keys and tokens without dropping them from the record', () => {
    const sanitized = sanitizeVoiceFields({
      apiKey: 'abcdefghijklmnop',
      access_token: 'tok_live_secret',
      keySource: 'GEMINI_API_KEY',
      hasGeminiKey: false,
      partKeys: [['text']],
      model: 'gemini-3.7-flash',
    });
    expect(sanitized?.apiKey).toMatch(/set len=16 suffix=mnop/);
    expect(String(sanitized?.access_token)).toMatch(/set len=/);
    expect(sanitized?.keySource).toBe('GEMINI_API_KEY');
    expect(sanitized?.hasGeminiKey).toBe(false);
    expect(sanitized?.partKeys).toEqual([['text']]);
    expect(sanitized?.model).toBe('gemini-3.7-flash');
  });

  it('truncates long transcripts', () => {
    expect(previewText('a'.repeat(200), 20)).toHaveLength(21);
    expect(previewText('short')).toBe('short');
  });
});
