/** Wrap raw PCM (LINEAR16) as a WAV container browsers can decode. */

export interface PcmWavOptions {
  channels?: number;
  sampleRate?: number;
  bitDepth?: number;
}

export function pcmToWav(pcm: Buffer, options: PcmWavOptions = {}): Buffer {
  const channels = options.channels ?? 1;
  const sampleRate = options.sampleRate ?? 24000;
  const bitDepth = options.bitDepth ?? 16;
  const blockAlign = (channels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

export function inlineAudioToWav(inline: { mimeType: string; data: string }): Buffer {
  const raw = Buffer.from(inline.data, 'base64');
  const mime = inline.mimeType.toLowerCase();
  if (mime.includes('wav') || mime.includes('wave')) return raw;
  const rateMatch = mime.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  return pcmToWav(raw, { sampleRate });
}
