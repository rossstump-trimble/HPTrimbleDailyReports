import { errorMessage, previewText, voiceLog } from '@/lib/voice-log';

export const GEMINI_TEXT_MODEL =
  process.env.GEMINI_MODEL || process.env.VERTEX_MODEL || 'gemini-3.7-flash';

export const GEMINI_TTS_MODELS = [
  process.env.GEMINI_TTS_MODEL,
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
].filter((model): model is string => Boolean(model));

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export interface GeminiGenerateOptions {
  model: string;
  parts: GeminiPart[];
  requestId?: string;
  responseModalities?: string[];
  speechConfig?: {
    voiceConfig: { prebuiltVoiceConfig: { voiceName: string } };
  };
}

export interface GeminiGenerateResult {
  text: string;
  inlineData: { mimeType: string; data: string } | null;
}

interface GeminiTransport {
  mode: 'apikey' | 'vertex';
  project?: string;
  url: (model: string) => string;
  headers: Record<string, string>;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

function apiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  return key?.trim() || undefined;
}

function skipVertex(): boolean {
  return process.env.VITEST === 'true' || process.env.GEMINI_USE_VERTEX === '0';
}

function partSummary(parts: GeminiPart[]): Record<string, unknown> {
  return {
    partCount: parts.length,
    textChars: parts.reduce((sum, part) => sum + ('text' in part ? part.text.length : 0), 0),
    inlineBytes: parts.reduce(
      (sum, part) => sum + ('inlineData' in part ? Buffer.byteLength(part.inlineData.data, 'base64') : 0),
      0,
    ),
    inlineMime: parts.find((part) => 'inlineData' in part)?.inlineData.mimeType,
  };
}

async function fetchJson(
  url: string,
  init: RequestInit,
  label: string,
): Promise<Record<string, unknown> | null> {
  const started = Date.now();
  try {
    const res = await fetch(url, init);
    const elapsedMs = Date.now() - started;
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      voiceLog('gemini-auth', 'warn', `${label} HTTP ${res.status}`, {
        elapsedMs,
        status: res.status,
        body: previewText(detail, 200),
      });
      return null;
    }
    voiceLog('gemini-auth', 'info', `${label} ok`, { elapsedMs, status: res.status });
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    voiceLog('gemini-auth', 'warn', `${label} failed`, {
      elapsedMs: Date.now() - started,
      error: errorMessage(err),
    });
    return null;
  }
}

async function gceAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    voiceLog('gemini-auth', 'info', 'using cached GCE access token', {
      expiresInSec: Math.round((cachedToken.expiresAt - now) / 1000),
    });
    return cachedToken.token;
  }

  const payload = await fetchJson(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    {
      headers: { 'Metadata-Flavor': 'Google' },
      signal: AbortSignal.timeout(3000),
    },
    'GCE metadata token',
  );
  const token = typeof payload?.access_token === 'string' ? payload.access_token : '';
  const expiresIn = typeof payload?.expires_in === 'number' ? payload.expires_in : 0;
  if (!token) {
    voiceLog('gemini-auth', 'warn', 'GCE metadata token missing access_token', {
      keys: payload ? Object.keys(payload) : [],
    });
    return null;
  }
  cachedToken = { token, expiresAt: now + expiresIn * 1000 };
  return token;
}

async function gceProjectId(): Promise<string | null> {
  const fromEnv = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (fromEnv?.trim()) return fromEnv.trim();
  try {
    const res = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/project/project-id',
      {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!res.ok) {
      voiceLog('gemini-auth', 'warn', 'GCE project-id HTTP error', { status: res.status });
      return null;
    }
    const project = (await res.text()).trim();
    return project || null;
  } catch (err) {
    voiceLog('gemini-auth', 'warn', 'GCE project-id fetch failed', { error: errorMessage(err) });
    return null;
  }
}

export async function resolveGeminiTransport(): Promise<GeminiTransport | null> {
  const key = apiKey();
  if (key) {
    voiceLog('gemini-auth', 'info', 'using Gemini API key transport', {
      keySource: process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'GOOGLE_API_KEY',
      apiKey: key,
    });
    return {
      mode: 'apikey',
      url: (model) =>
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
    };
  }

  if (skipVertex()) {
    voiceLog('gemini-auth', 'info', 'Vertex skipped', {
      vitest: process.env.VITEST === 'true',
      geminiUseVertex: process.env.GEMINI_USE_VERTEX ?? 'unset',
    });
    return null;
  }

  const [token, project] = await Promise.all([gceAccessToken(), gceProjectId()]);
  if (!token || !project) {
    voiceLog('gemini-auth', 'error', 'no Gemini transport: missing API key and Vertex ADC', {
      hasToken: Boolean(token),
      project: project ?? 'unset',
      gcpProjectEnv: process.env.GCP_PROJECT ?? 'unset',
    });
    return null;
  }

  const defaultLocation = process.env.GCP_LOCATION || 'global';
  const ttsLocation = process.env.GCP_TTS_LOCATION || 'us-central1';
  voiceLog('gemini-auth', 'info', 'using Vertex ADC transport', {
    project,
    defaultLocation,
    ttsLocation,
  });

  return {
    mode: 'vertex',
    project,
    url: (model) => {
      const location = /tts/i.test(model) ? ttsLocation : defaultLocation;
      const host =
        location === 'global'
          ? 'https://aiplatform.googleapis.com'
          : `https://${location}-aiplatform.googleapis.com`;
      return `${host}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
}

function asParts(parts: GeminiPart[]): Array<Record<string, unknown>> {
  return parts.map((part) => {
    if ('text' in part) return { text: part.text };
    return { inlineData: part.inlineData };
  });
}

function candidateMeta(body: Record<string, unknown>): Record<string, unknown> {
  const promptFeedback = body.promptFeedback ?? body.prompt_feedback;
  const candidates = Array.isArray(body.candidates) ? body.candidates : [];
  const first = candidates[0] as Record<string, unknown> | undefined;
  const content = first?.content as Record<string, unknown> | undefined;
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  return {
    candidateCount: candidates.length,
    finishReason: first?.finishReason ?? first?.finish_reason ?? null,
    blockReason:
      promptFeedback && typeof promptFeedback === 'object'
        ? (promptFeedback as Record<string, unknown>).blockReason ??
          (promptFeedback as Record<string, unknown>).block_reason ??
          null
        : null,
    partCount: parts.length,
    partKeys: parts
      .filter((part): part is Record<string, unknown> => Boolean(part) && typeof part === 'object')
      .map((part) => Object.keys(part)),
  };
}

function extractResult(body: Record<string, unknown>): GeminiGenerateResult | null {
  const candidates = body.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const first = candidates[0] as Record<string, unknown>;
  const content = first.content as Record<string, unknown> | undefined;
  const parts = content?.parts;
  if (!Array.isArray(parts)) return null;

  let text = '';
  let inlineData: GeminiGenerateResult['inlineData'] = null;
  for (const raw of parts) {
    if (!raw || typeof raw !== 'object') continue;
    const part = raw as Record<string, unknown>;
    if (typeof part.text === 'string') text += part.text;
    const inline = part.inlineData ?? part.inline_data;
    if (inline && typeof inline === 'object') {
      const rec = inline as Record<string, unknown>;
      const data = typeof rec.data === 'string' ? rec.data : '';
      const mimeType =
        typeof rec.mimeType === 'string'
          ? rec.mimeType
          : typeof rec.mime_type === 'string'
            ? rec.mime_type
            : 'audio/L16;rate=24000';
      if (data) inlineData = { mimeType, data };
    }
  }
  if (!text && !inlineData) return null;
  return { text, inlineData };
}

export async function geminiGenerate(
  options: GeminiGenerateOptions,
): Promise<GeminiGenerateResult | null> {
  const requestId = options.requestId;
  const transport = await resolveGeminiTransport();
  if (!transport) {
    voiceLog('gemini-client', 'error', 'generate skipped: no transport', {
      requestId,
      model: options.model,
    });
    return null;
  }

  const generationConfig: Record<string, unknown> = {};
  if (options.responseModalities?.length) {
    generationConfig.responseModalities = options.responseModalities;
  }
  if (options.speechConfig) {
    generationConfig.speechConfig = options.speechConfig;
  }

  const payload: Record<string, unknown> = {
    contents: [{ role: 'user', parts: asParts(options.parts) }],
  };
  if (Object.keys(generationConfig).length > 0) {
    payload.generationConfig = generationConfig;
  }

  const url = transport.url(options.model);
  const started = Date.now();
  voiceLog('gemini-client', 'info', 'generate start', {
    requestId,
    model: options.model,
    mode: transport.mode,
    project: transport.project,
    url,
    responseModalities: options.responseModalities ?? [],
    ...partSummary(options.parts),
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: transport.headers,
      body: JSON.stringify(payload),
    });
    const elapsedMs = Date.now() - started;
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      voiceLog('gemini-client', 'error', 'generate HTTP error', {
        requestId,
        model: options.model,
        mode: transport.mode,
        status: res.status,
        elapsedMs,
        body: previewText(detail, 400),
      });
      return null;
    }
    const body = (await res.json()) as Record<string, unknown>;
    const result = extractResult(body);
    const meta = candidateMeta(body);
    if (!result) {
      voiceLog('gemini-client', 'error', 'generate returned no usable parts', {
        requestId,
        model: options.model,
        mode: transport.mode,
        elapsedMs,
        ...meta,
      });
      return null;
    }
    voiceLog('gemini-client', 'info', 'generate ok', {
      requestId,
      model: options.model,
      mode: transport.mode,
      elapsedMs,
      textChars: result.text.length,
      audioMime: result.inlineData?.mimeType ?? null,
      audioBytes: result.inlineData
        ? Buffer.byteLength(result.inlineData.data, 'base64')
        : 0,
      ...meta,
    });
    return result;
  } catch (err) {
    voiceLog('gemini-client', 'error', 'generate threw', {
      requestId,
      model: options.model,
      elapsedMs: Date.now() - started,
      error: errorMessage(err),
    });
    return null;
  }
}

/** Reset cached GCE tokens — used by tests. */
export function resetGeminiAuthCache(): void {
  cachedToken = null;
}
