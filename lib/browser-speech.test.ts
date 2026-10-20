import { describe, expect, it } from 'vitest';
import { classifySpeechRecognitionError, transcriptFromSpeechEvent } from './browser-speech';

describe('classifySpeechRecognitionError', () => {
  it('treats not-allowed as denied', () => {
    expect(classifySpeechRecognitionError('not-allowed')).toBe('denied');
    expect(classifySpeechRecognitionError('service-not-allowed')).toBe('denied');
  });

  it('keeps no-speech distinct from a hard failure', () => {
    expect(classifySpeechRecognitionError('no-speech')).toBe('no-speech');
    expect(classifySpeechRecognitionError('network')).toBe('unknown');
  });
});

describe('transcriptFromSpeechEvent', () => {
  it('joins final and interim pieces', () => {
    const parsed = transcriptFromSpeechEvent({
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: 'six electricians ' } },
        { isFinal: false, 0: { transcript: 'on the roof' } },
      ],
    });
    expect(parsed.finalText).toBe('six electricians');
    expect(parsed.interimText).toBe('on the roof');
  });
});
