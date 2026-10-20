export type BrowserSpeechError = 'denied' | 'no-speech' | 'unsupported' | 'unknown';

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionResultEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function classifySpeechRecognitionError(error: string): BrowserSpeechError {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'denied';
    case 'no-speech':
      return 'no-speech';
    case 'audio-capture':
      return 'unsupported';
    default:
      return 'unknown';
  }
}

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function browserSpeechSupported(): boolean {
  return getSpeechRecognitionCtor() != null;
}

export function transcriptFromSpeechEvent(event: SpeechRecognitionResultEventLike): {
  finalText: string;
  interimText: string;
} {
  let finalText = '';
  let interimText = '';
  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i];
    const piece = result[0]?.transcript ?? '';
    if (result.isFinal) finalText += piece;
    else interimText += piece;
  }
  return { finalText: finalText.trim(), interimText: interimText.trim() };
}
