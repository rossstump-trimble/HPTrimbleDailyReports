import { afterEach, describe, expect, it, vi } from 'vitest';
import { geminiGenerate, resetGeminiAuthCache } from './gemini-client';
import { synthesizeSpeechWav } from './gemini-tts';

describe('geminiGenerate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetGeminiAuthCache();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  it('returns null when no API key is configured (Vertex skipped in tests)', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    const result = await geminiGenerate({
      model: 'gemini-3.7-flash',
      parts: [{ text: 'hi' }],
    });
    expect(result).toBeNull();
  });

  it('posts to the Gemini API and reads text plus inline audio', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                { text: 'ok' },
                { inlineData: { mimeType: 'audio/L16;rate=24000', data: 'AQID' } },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await geminiGenerate({
      model: 'gemini-3.7-flash',
      parts: [{ text: 'hello' }],
    });

    expect(result?.text).toBe('ok');
    expect(result?.inlineData?.data).toBe('AQID');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain('gemini-3.7-flash');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
  });
});

describe('synthesizeSpeechWav', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetGeminiAuthCache();
    delete process.env.GEMINI_API_KEY;
  });

  it('returns a wav buffer from Gemini TTS inline PCM', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const pcm = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: pcm.toString('base64') } }],
              },
            },
          ],
        }),
      }),
    );

    const wav = await synthesizeSpeechWav('Which trade company is this daily for?');
    expect(wav).not.toBeNull();
    expect(wav!.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(wav!.subarray(44).equals(pcm)).toBe(true);
  });

  it('returns null for blank text without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await synthesizeSpeechWav('   ')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
