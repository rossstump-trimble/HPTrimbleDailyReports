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

  it('keeps separate sentences as separate pieces', () => {
    const parsed = transcriptFromSpeechEvent({
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: 'six electricians' } },
        { isFinal: true, 0: { transcript: ' we poured the slab' } },
      ],
    });
    expect(parsed.finalText).toBe('six electricians we poured the slab');
  });

  // Android Chrome reports every growing hypothesis as its own final result.
  it('collapses cumulative final results into the longest one', () => {
    const parsed = transcriptFromSpeechEvent({
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: 'fueron' } },
        { isFinal: true, 0: { transcript: 'fueron a' } },
        { isFinal: true, 0: { transcript: 'fueron a trabajar' } },
        { isFinal: true, 0: { transcript: 'fueron a trabajar con mis' } },
        { isFinal: false, 0: { transcript: 'fueron a trabajar con mis nosotros' } },
      ],
    });
    expect(parsed.finalText).toBe('');
    expect(parsed.interimText).toBe('fueron a trabajar con mis nosotros');
  });

  it('collapses cumulative results that the engine revised mid-phrase', () => {
    const parsed = transcriptFromSpeechEvent({
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: 'we poured the slab' } },
        { isFinal: true, 0: { transcript: 'We poured the slab and set' } },
        { isFinal: true, 0: { transcript: 'we poured the slab and set rebar' } },
      ],
    });
    expect(parsed.finalText).toBe('we poured the slab and set rebar');
  });

  it('does not mistake a new short sentence that starts alike for a revision', () => {
    const parsed = transcriptFromSpeechEvent({
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: 'we poured concrete' } },
        { isFinal: true, 0: { transcript: 'we poured the slab today' } },
      ],
    });
    expect(parsed.finalText).toBe('we poured concrete we poured the slab today');
  });

  it('still joins a later sentence after a cumulative run', () => {
    const parsed = transcriptFromSpeechEvent({
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: 'hoy' } },
        { isFinal: true, 0: { transcript: 'hoy instalamos tubería' } },
        { isFinal: true, 0: { transcript: 'mañana pintamos' } },
      ],
    });
    expect(parsed.finalText).toBe('hoy instalamos tubería mañana pintamos');
  });
});
