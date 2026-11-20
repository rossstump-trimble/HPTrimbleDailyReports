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

// Built from a string because the project targets ES5, where the `u` flag is not a literal option.
const NON_WORD_CHARACTERS = new RegExp('[^\\p{L}\\p{N}\\s]', 'gu');

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(NON_WORD_CHARACTERS, '')
    .split(/\s+/)
    .filter(Boolean);
}

/** Number of leading words the two phrases share. */
function sharedLeadingWords(a: string[], b: string[]): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

// Android Chrome reports every growing hypothesis ("fueron", "fueron a", ...) as its own
// result, so the same words arrive many times. A later piece that restarts the previous
// one replaces it instead of adding to it. The engine may revise its last word, which is
// only forgiven in longer phrases so a short new sentence is never mistaken for a revision.
function restates(previous: string[], next: string[]): boolean {
  if (previous.length === 0) return false;
  const allowedRevisions = previous.length >= 4 ? 1 : 0;
  return sharedLeadingWords(previous, next) >= previous.length - allowedRevisions;
}

export function transcriptFromSpeechEvent(event: SpeechRecognitionResultEventLike): {
  finalText: string;
  interimText: string;
} {
  const pieces: { text: string; isFinal: boolean }[] = [];
  for (let i = 0; i < event.results.length; i++) {
    const result = event.results[i];
    const text = (result[0]?.transcript ?? '').trim();
    if (!text) continue;

    const previous = pieces[pieces.length - 1];
    if (previous) {
      const previousWords = words(previous.text);
      const nextWords = words(text);
      if (nextWords.length >= previousWords.length && restates(previousWords, nextWords)) {
        pieces[pieces.length - 1] = { text, isFinal: result.isFinal };
        continue;
      }
      if (restates(nextWords, previousWords)) continue;
    }
    pieces.push({ text, isFinal: result.isFinal });
  }

  const joined = (isFinal: boolean): string =>
    pieces
      .filter((piece) => piece.isFinal === isFinal)
      .map((piece) => piece.text)
      .join(' ');
  return { finalText: joined(true), interimText: joined(false) };
}
