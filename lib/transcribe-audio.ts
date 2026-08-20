import Groq, { toFile as groqToFile } from 'groq-sdk';
import OpenAI, { toFile as openaiToFile } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { audioUploadFilename, normalizeAudioMime } from '@/lib/audio-mime';

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

function geminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
}

async function transcribeWithGroq(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  const apiKey = groqKey();
  if (!apiKey) return '';

  const groq = new Groq({ apiKey });
  const file = await groqToFile(buffer, filename, { type: mimeType });
  const result = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'en',
    prompt: WHISPER_PROMPT,
  });
  return result.text.trim();
}

async function transcribeWithOpenAI(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  const apiKey = openaiKey();
  if (!apiKey) return '';

  const openai = new OpenAI({ apiKey });
  const file = await openaiToFile(buffer, filename, { type: mimeType });
  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
    prompt: WHISPER_PROMPT,
  });
  return result.text.trim();
}

async function transcribeWithGemini(buffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = geminiKey();
  if (!apiKey) return '';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const response = await model.generateContent([
    GEMINI_TRANSCRIBE_PROMPT,
    { inlineData: { data: buffer.toString('base64'), mimeType } },
  ]);
  return response.response.text().trim();
}

/**
 * Speech-to-text for phone recordings. Tries Groq Whisper, then OpenAI Whisper,
 * then Gemini audio. Returns '' when no provider is configured or all fail.
 */
export async function transcribeAudioFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename = '',
): Promise<string> {
  const normalizedMime = normalizeAudioMime(mimeType);
  const uploadName = audioUploadFilename(normalizedMime, filename);

  const providers: Array<() => Promise<string>> = [
    () => transcribeWithGroq(buffer, normalizedMime, uploadName),
    () => transcribeWithOpenAI(buffer, normalizedMime, uploadName),
    () => transcribeWithGemini(buffer, normalizedMime),
  ];

  for (const run of providers) {
    try {
      const text = await run();
      if (text) return text;
    } catch (err) {
      console.error('[transcribe-audio]', err);
    }
  }

  return '';
}
