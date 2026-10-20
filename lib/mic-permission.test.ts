import { describe, expect, it } from 'vitest';
import {
  classifyGetUserMediaError,
  micPermissionDialogCopy,
  shouldPromptMicAccess,
} from './mic-permission';

describe('classifyGetUserMediaError', () => {
  it('treats NotAllowedError as denied', () => {
    expect(classifyGetUserMediaError({ name: 'NotAllowedError' })).toBe('denied');
    expect(classifyGetUserMediaError({ name: 'PermissionDeniedError' })).toBe('denied');
  });
});

describe('shouldPromptMicAccess', () => {
  it('opens a popup when the browser blocked the microphone', () => {
    expect(shouldPromptMicAccess('denied')).toBe(true);
    expect(shouldPromptMicAccess('insecure')).toBe(false);
    expect(shouldPromptMicAccess(null)).toBe(false);
  });
});

describe('micPermissionDialogCopy', () => {
  it('gives iPhone steps when Safari blocked the mic', () => {
    const copy = micPermissionDialogCopy(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    );
    expect(copy.title).toMatch(/microphone/i);
    expect(copy.steps.join(' ')).toMatch(/Safari/i);
    expect(copy.steps.join(' ')).toMatch(/Website Settings|aA/i);
  });

  it('gives Chrome Android steps when Chrome blocked the mic', () => {
    const copy = micPermissionDialogCopy(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
    );
    expect(copy.steps.join(' ')).toMatch(/Site settings|Permissions|lock/i);
  });
});
