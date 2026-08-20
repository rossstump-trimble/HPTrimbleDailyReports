import { describe, it, expect } from 'vitest';
import {
  RECORDER_MIME_CANDIDATES,
  isAudioMedia,
  pickRecorderMimeType,
  extensionForAudioMime,
  audioUploadFilename,
  normalizeAudioMime,
} from './audio-mime';

describe('isAudioMedia', () => {
  it('detects common audio MIME types', () => {
    expect(isAudioMedia('audio/webm')).toBe(true);
    expect(isAudioMedia('audio/mp4')).toBe(true);
    expect(isAudioMedia('audio/webm;codecs=opus')).toBe(true);
  });

  it('treats video/webm and video/mp4 as audio containers phones may emit', () => {
    expect(isAudioMedia('video/webm')).toBe(true);
    expect(isAudioMedia('video/mp4')).toBe(true);
  });

  it('detects audio by filename when MIME is empty', () => {
    expect(isAudioMedia('', 'daily.m4a')).toBe(true);
    expect(isAudioMedia('', 'daily.webm')).toBe(true);
    expect(isAudioMedia('', 'photo.jpg')).toBe(false);
  });

  it('rejects spreadsheets and images', () => {
    expect(isAudioMedia('image/jpeg', 'photo.jpg')).toBe(false);
    expect(
      isAudioMedia(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'daily.xlsx',
      ),
    ).toBe(false);
  });
});

describe('pickRecorderMimeType', () => {
  it('prefers iOS-friendly audio/mp4 when supported', () => {
    expect(pickRecorderMimeType((mime) => mime === 'audio/mp4')).toBe('audio/mp4');
  });

  it('falls back to webm opus', () => {
    expect(
      pickRecorderMimeType((mime) => mime === 'audio/webm;codecs=opus'),
    ).toBe('audio/webm;codecs=opus');
  });

  it('returns empty string when nothing is supported', () => {
    expect(pickRecorderMimeType(() => false)).toBe('');
  });

  it('walks candidates in order', () => {
    expect(RECORDER_MIME_CANDIDATES[0]).toBe('audio/mp4');
  });
});

describe('extensionForAudioMime / audioUploadFilename', () => {
  it('maps mp4/aac to m4a for Whisper', () => {
    expect(extensionForAudioMime('audio/mp4')).toBe('m4a');
    expect(extensionForAudioMime('audio/aac')).toBe('m4a');
  });

  it('keeps a real filename with an audio extension', () => {
    expect(audioUploadFilename('audio/webm', 'foreman-daily.webm')).toBe('foreman-daily.webm');
  });

  it('synthesizes a name from MIME when the browser sends blob', () => {
    expect(audioUploadFilename('audio/mp4', 'blob')).toBe('daily-report.m4a');
  });
});

describe('normalizeAudioMime', () => {
  it('rewrites video containers to audio/*', () => {
    expect(normalizeAudioMime('video/webm;codecs=opus')).toBe('audio/webm');
    expect(normalizeAudioMime('video/mp4')).toBe('audio/mp4');
  });

  it('strips codec suffixes', () => {
    expect(normalizeAudioMime('audio/webm;codecs=opus')).toBe('audio/webm');
  });
});
