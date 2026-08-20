type VoiceLogLevel = 'info' | 'warn' | 'error';

const SECRET_FIELD =
  /(?:apiKey|access_token|accessToken|^token$|secret|authorization|bearer|password)$/i;

export function newVoiceRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `voice-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function previewText(value: string, max = 120): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function redact(value: unknown): string {
  if (typeof value !== 'string' || !value) return value == null ? 'unset' : '[redacted]';
  if (value.length <= 8) return `[set len=${value.length}]`;
  return `[set len=${value.length} suffix=${value.slice(-4)}]`;
}

function sanitizeValue(key: string, value: unknown): unknown {
  if (SECRET_FIELD.test(key)) return redact(value);
  if (typeof value === 'string' && value.length > 240) return previewText(value, 160);
  return value;
}

export function sanitizeVoiceFields(
  extra?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!extra) return extra;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extra)) {
    out[key] = sanitizeValue(key, value);
  }
  return out;
}

export function voiceLog(
  scope: string,
  level: VoiceLogLevel,
  message: string,
  extra?: Record<string, unknown>,
): void {
  const fields = sanitizeVoiceFields(extra) ?? {};
  const line = `[voice:${scope}] ${message} ${JSON.stringify(fields)}`;
  switch (level) {
    case 'error':
      console.error(line);
      return;
    case 'warn':
      console.warn(line);
      return;
    case 'info':
      console.info(line);
      return;
    default: {
      const _exhaustive: never = level;
      console.info(line);
      return _exhaustive;
    }
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
