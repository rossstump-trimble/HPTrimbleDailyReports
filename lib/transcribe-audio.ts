import Groq, { toFile as groqToFile } from 'groq-sdk';
import OpenAI, { toFile as openaiToFile } from 'openai';
import { audioUploadFilename, normalizeAudioMime } from '@/lib/audio-mime';
import { geminiGenerate, GEMINI_TEXT_MODEL } from '@/lib/gemini-client';
import { errorMessage, previewText, voiceLog } from '@/lib/voice-log';

const WHISPER_PROMPT =
  'Construction trade-partner daily report. Terms: crew count, manhours, equipment, location, delays, STA, safety task analysis.';

const GEMINI_TRANSCRIBE_PROMPT =
  'Transcribe this spoken construction daily report verbatim. Return only the transcript text, with no commentary or markdown.';

function groqKey(): string | undefined {
  return process.env.GROQ_API_KEY;
}

function openaiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

async function transcribeWithGroq(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  requestId?: string,
): Promise<string> {
  const apiKey = groqKey();
  if (!apiKey) {
    voiceLog('stt', 'info', 'skip groq: GROQ_API_KEY unset', { requestId });
    return '';
  }

  const started = Date.now();
  const groq = new Groq({ apiKey });
  const file = await groqToFile(buffer, filename, { type: mimeType });
  const result = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'en',
    prompt: WHISPER_PROMPT,
  });
  const text = result.text.trim();
  voiceLog('stt', 'info', text ? 'groq whisper ok' : 'groq whisper empty transcript', {
    requestId,
    elapsedMs: Date.now() - started,
    chars: text.length,
    preview: previewText(text),
  });
  return text;
}

async function transcribeWithOpenAI(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  requestId?: string,
): Promise<string> {
  const apiKey = openaiKey();
  if (!apiKey) {
    voiceLog('stt', 'info', 'skip openai: OPENAI_API_KEY unset', { requestId });
    return '';
  }

  const started = Date.now();
  const openai = new OpenAI({ apiKey });
  const file = await openaiToFile(buffer, filename, { type: mimeType });
  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
    prompt: WHISPER_PROMPT,
  });
  const text = result.text.trim();
  voiceLog('stt', 'info', text ? 'openai whisper ok' : 'openai whisper empty transcript', {
    requestId,
    elapsedMs: Date.now() - started,
    chars: text.length,
    preview: previewText(text),
  });
  return text;
}

async function transcribeWithGemini(
  buffer: Buffer,
  mimeType: string,
  requestId?: string,
): Promise<string> {
  const started = Date.now();
  const result = await geminiGenerate({
    model: GEMINI_TEXT_MODEL,
    requestId,
    parts: [
      { text: GEMINI_TRANSCRIBE_PROMPT },
      { inlineData: { data: buffer.toString('base64'), mimeType } },
    ],
  });
  const text = result?.text.trim() ?? '';
  voiceLog('stt', text ? 'info' : 'warn', text ? 'gemini transcribe ok' : 'gemini transcribe empty', {
    requestId,
    model: GEMINI_TEXT_MODEL,
    elapsedMs: Date.now() - started,
    chars: text.length,
    preview: previewText(text),
  });
  return text;
}

/**
 * Speech-to-text for phone recordings.
 * Groq Whisper → OpenAI Whisper → Gemini (API key or Vertex ADC on the VM).
 */
export async function transcribeAudioFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename = '',
  requestId?: string,
): Promise<string> {
  const normalizedMime = normalizeAudioMime(mimeType);
  const uploadName = audioUploadFilename(normalizedMime, filename);

  voiceLog('stt', 'info', 'transcribe start', {
    requestId,
    bytes: buffer.length,
    mimeType,
    normalizedMime,
    filename: uploadName,
    groq: Boolean(groqKey()),
    openai: Boolean(openaiKey()),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
  });

  const providers: Array<{ name: string; run: () => Promise<string> }> = [
    { name: 'groq', run: () => transcribeWithGroq(buffer, normalizedMime, uploadName, requestId) },
    { name: 'openai', run: () => transcribeWithOpenAI(buffer, normalizedMime, uploadName, requestId) },
    { name: 'gemini', run: () => transcribeWithGemini(buffer, normalizedMime, requestId) },
  ];

    for (const provider of providers) {
      if ((provider.name === 'groq' || provider.name === 'openai') && process.env.ALLOW_PUBLIC_STT_FALLBACK !== 'true') {
        continue;
      }
      try {
      const text = await provider.run();
      if (text) {
        voiceLog('stt', 'info', 'transcribe succeeded', {
          requestId,
          provider: provider.name,
          chars: text.length,
        });
        return text;
      }
    } catch (err) {
      voiceLog('stt', 'error', `${provider.name} threw`, {
        requestId,
        error: errorMessage(err),
      });
    }
  }

  voiceLog('stt', 'error', 'all STT providers failed or returned empty', { requestId });
  return '';
}
