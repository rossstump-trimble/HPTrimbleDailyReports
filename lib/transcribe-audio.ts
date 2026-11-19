import Groq, { toFile as groqToFile } from 'groq-sdk';
import OpenAI, { toFile as openaiToFile } from 'openai';
import { audioUploadFilename, normalizeAudioMime } from '@/lib/audio-mime';
import { geminiGenerate, GEMINI_TEXT_MODEL } from '@/lib/gemini-client';
import { getIntakeLanguage } from '@/lib/intake-languages';
import { errorMessage, previewText, voiceLog } from '@/lib/voice-log';

const BASE_WHISPER_PROMPT =
  'Construction trade-partner daily report. Terms: crew count, manhours, equipment, location, delays, STA, safety task analysis.';

const BASE_GEMINI_TRANSCRIBE_PROMPT =
  'Transcribe this spoken construction daily report verbatim. Return only the transcript text, with no commentary or markdown.';

export function normalizeProjectTranscript(text: string, keywords: string[] = []): string {
  if (!text) return text;
  let normalized = text;

  // Specific data-center and construction phonetic corrections
  const keywordSet = new Set(keywords.map(k => k.trim().toLowerCase()));

  // 1. Data Center "colo" (colocation) vs "color"
  if (keywordSet.has('colo') || /colo\b/i.test(keywords.join(' '))) {
    normalized = normalized.replace(/\bthe color\b/gi, 'the colo');
    normalized = normalized.replace(/\bcolor room\b/gi, 'colo room');
    normalized = normalized.replace(/\bcolor hall\b/gi, 'colo hall');
    normalized = normalized.replace(/\bcolor (\d+)\b/gi, 'colo $1');
    normalized = normalized.replace(/\bcolor\b/gi, (match, offset, str) => {
      // If preceded by in/to/at/inside/outside or followed by space/hall/room/1..9
      const before = str.slice(Math.max(0, offset - 12), offset).toLowerCase();
      const after = str.slice(offset + match.length, offset + match.length + 12).toLowerCase();
      if (/\b(in|at|to|into|inside|outside|data|server)\s+$/i.test(before) || /^\s+(room|hall|space|area|\d+)/i.test(after)) {
        return 'colo';
      }
      return match;
    });
  }

  // 2. Acronym capitalization for project keywords
  for (const kw of keywords) {
    const clean = kw.trim();
    if (clean.length >= 2 && clean === clean.toUpperCase()) {
      const regex = new RegExp(`\\b${clean}\\b`, 'gi');
      normalized = normalized.replace(regex, clean);
    }
  }

  return normalized;
}

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
  keywordsPrompt = '',
): Promise<string> {
  const apiKey = groqKey();
  if (!apiKey) {
    voiceLog('stt', 'info', 'skip groq: GROQ_API_KEY unset', { requestId });
    return '';
  }

  const prompt = keywordsPrompt
    ? `${BASE_WHISPER_PROMPT} Project-specific keywords and terminology: ${keywordsPrompt}.`
    : BASE_WHISPER_PROMPT;

  const started = Date.now();
  const groq = new Groq({ apiKey });
  const file = await groqToFile(buffer, filename, { type: mimeType });
  const result = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'en',
    prompt,
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
  keywordsPrompt = '',
): Promise<string> {
  const apiKey = openaiKey();
  if (!apiKey) {
    voiceLog('stt', 'info', 'skip openai: OPENAI_API_KEY unset', { requestId });
    return '';
  }

  const prompt = keywordsPrompt
    ? `${BASE_WHISPER_PROMPT} Project-specific keywords and terminology: ${keywordsPrompt}.`
    : BASE_WHISPER_PROMPT;

  const started = Date.now();
  const openai = new OpenAI({ apiKey });
  const file = await openaiToFile(buffer, filename, { type: mimeType });
  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
    prompt,
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
  keywordsPrompt = '',
  language?: string,
): Promise<string> {
  const started = Date.now();
  const basePrompt = language
    ? `${BASE_GEMINI_TRANSCRIBE_PROMPT} The speaker is speaking ${getIntakeLanguage(language).name}; transcribe it in that language and do not translate it to English.`
    : BASE_GEMINI_TRANSCRIBE_PROMPT;
  const promptText = keywordsPrompt
    ? `${basePrompt} Ensure accurate transcription of industry & project nomenclature: ${keywordsPrompt}. Note: 'colo' refers to data center colocation space, not 'color'. Return only the transcript text.`
    : basePrompt;

  const result = await geminiGenerate({
    model: GEMINI_TEXT_MODEL,
    requestId,
    parts: [
      { text: promptText },
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
  projectKeywords: string[] = [],
  language?: string,
): Promise<string> {
  const normalizedMime = normalizeAudioMime(mimeType);
  const uploadName = audioUploadFilename(normalizedMime, filename);
  const keywordsPrompt = projectKeywords.filter(Boolean).join(', ');

  voiceLog('stt', 'info', 'transcribe start', {
    requestId,
    bytes: buffer.length,
    mimeType,
    normalizedMime,
    filename: uploadName,
    keywordsCount: projectKeywords.length,
    groq: Boolean(groqKey()),
    openai: Boolean(openaiKey()),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
  });

  const providers: Array<{ name: string; run: () => Promise<string> }> = [
    { name: 'groq', run: () => transcribeWithGroq(buffer, normalizedMime, uploadName, requestId, keywordsPrompt) },
    { name: 'openai', run: () => transcribeWithOpenAI(buffer, normalizedMime, uploadName, requestId, keywordsPrompt) },
    { name: 'gemini', run: () => transcribeWithGemini(buffer, normalizedMime, requestId, keywordsPrompt, language) },
  ];

    for (const provider of providers) {
      // The Whisper calls above are pinned to English, so they are only valid for English audio.
      if ((provider.name === 'groq' || provider.name === 'openai') && (process.env.ALLOW_PUBLIC_STT_FALLBACK !== 'true' || language)) {
        continue;
      }
      try {
      const rawText = await provider.run();
      if (rawText) {
        const text = normalizeProjectTranscript(rawText, projectKeywords);
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
