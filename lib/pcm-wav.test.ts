import { describe, it, expect } from 'vitest';
import { inlineAudioToWav, pcmToWav } from './pcm-wav';

describe('pcmToWav', () => {
  it('writes a 44-byte RIFF header and the PCM payload', () => {
    const pcm = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    const wav = pcmToWav(pcm, { sampleRate: 24000, channels: 1, bitDepth: 16 });
    expect(wav.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(wav.subarray(8, 12).toString('ascii')).toBe('WAVE');
    expect(wav.readUInt32LE(24)).toBe(24000);
    expect(wav.readUInt16LE(22)).toBe(1);
    expect(wav.subarray(44).equals(pcm)).toBe(true);
    expect(wav.length).toBe(48);
  });
});

describe('inlineAudioToWav', () => {
  it('passes through audio already labeled as wav', () => {
    const wav = pcmToWav(Buffer.from([1, 2, 3, 4]));
    const roundTrip = inlineAudioToWav({
      mimeType: 'audio/wav',
      data: wav.toString('base64'),
    });
    expect(roundTrip.equals(wav)).toBe(true);
  });

  it('wraps LINEAR16 PCM using the rate in the mime type', () => {
    const pcm = Buffer.alloc(8, 7);
    const wav = inlineAudioToWav({
      mimeType: 'audio/L16;rate=16000',
      data: pcm.toString('base64'),
    });
    expect(wav.readUInt32LE(24)).toBe(16000);
    expect(wav.subarray(44).equals(pcm)).toBe(true);
  });
});
