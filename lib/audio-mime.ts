/** MIME types phones actually produce when capturing audio. */
export const RECORDER_MIME_CANDIDATES = [
  'audio/mp4',
  'audio/aac',
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
] as const;

const AUDIO_MIME_PREFIXES = [
  'audio/',
  'video/webm',
  'video/mp4',
] as const;

const AUDIO_EXTENSIONS = /\.(webm|mp4|m4a|mp3|mpeg|wav|ogg|aac|flac)$/i;

export function isAudioMedia(mimeType: string, filename = ''): boolean {
  const mime = mimeType.split(';')[0].trim().toLowerCase();
  if (AUDIO_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix))) return true;
  return AUDIO_EXTENSIONS.test(filename);
}

export function pickRecorderMimeType(
  isSupported: (mime: string) => boolean,
): string {
  return RECORDER_MIME_CANDIDATES.find((mime) => isSupported(mime)) ?? '';
}

export function extensionForAudioMime(mimeType: string): string {
  const base = mimeType.split(';')[0].trim().toLowerCase();
  if (base.includes('mp4') || base.includes('aac') || base.includes('m4a')) return 'm4a';
  if (base.includes('mpeg') || base.includes('mp3')) return 'mp3';
  if (base.includes('wav')) return 'wav';
  if (base.includes('ogg')) return 'ogg';
  if (base.includes('flac')) return 'flac';
  return 'webm';
}

export function audioUploadFilename(mimeType: string, filename?: string): string {
  if (filename && AUDIO_EXTENSIONS.test(filename) && filename !== 'blob') {
    return filename;
  }
  return `daily-report.${extensionForAudioMime(mimeType)}`;
}

/** Whisper / Gemini prefer a clean audio/* type even if the browser labeled it video/*. */
export function normalizeAudioMime(mimeType: string): string {
  const base = mimeType.split(';')[0].trim().toLowerCase();
  if (base === 'video/webm') return 'audio/webm';
  if (base === 'video/mp4') return 'audio/mp4';
  return base || 'audio/webm';
}
