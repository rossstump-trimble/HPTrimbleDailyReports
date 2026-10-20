export type MicError = 'unsupported' | 'insecure' | 'denied' | 'not-found' | 'unknown';

export function classifyGetUserMediaError(err: unknown): MicError {
  if (!err || typeof err !== 'object') return 'unknown';
  const name = 'name' in err ? String(err.name) : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'not-found';
    case 'NotSupportedError':
    case 'TypeError':
      return 'unsupported';
    case 'SecurityError':
      return 'insecure';
    default:
      return 'unknown';
  }
}

export function shouldPromptMicAccess(error: MicError | null): boolean {
  return error === 'denied';
}

export interface MicPermissionDialogCopy {
  title: string;
  body: string;
  tryAgainLabel: string;
  steps: string[];
}

export function micPermissionDialogCopy(userAgent: string): MicPermissionDialogCopy {
  const title = 'Allow microphone access';
  const body =
    'This page needs the microphone to record your answer. Your browser blocked it.';
  const tryAgainLabel = 'Allow microphone';

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return {
      title,
      body,
      tryAgainLabel,
      steps: [
        'Tap Allow microphone below — that asks iOS again if it still can.',
        'If nothing pops up, tap the aA icon in Safari’s address bar, then Website Settings, and set Microphone to Allow.',
        'You can also open the iPhone Settings app → Safari → Microphone, then reload this page.',
      ],
    };
  }

  if (/Android/i.test(userAgent)) {
    return {
      title,
      body,
      tryAgainLabel,
      steps: [
        'Tap Allow microphone below to show the permission prompt again.',
        'If it stays blocked, tap the lock icon in the address bar → Permissions → Microphone → Allow, then come back here.',
      ],
    };
  }

  return {
    title,
    body,
    tryAgainLabel,
    steps: [
      'Tap Allow microphone below to show the browser permission prompt.',
      'If that does not appear, open this site’s settings in your browser and set Microphone to Allow, then reload.',
    ],
  };
}
