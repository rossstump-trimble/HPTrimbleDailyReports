import { NextResponse } from 'next/server';
import { extractDailyFromBuffer } from '@/lib/extract-daily';
import { errorMessage, previewText, voiceLog } from '@/lib/voice-log';

export const runtime = 'nodejs';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(req: Request) {
  const started = Date.now();
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      voiceLog('extract-route', 'warn', 'no file provided', {});
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      voiceLog('extract-route', 'warn', 'file too large', { fileBytes: file.size, fileName: file.name });
      return NextResponse.json({ success: false, error: 'File exceeds 15 MB limit' }, { status: 413 });
    }

    voiceLog('extract-route', 'info', 'extract start', {
      fileBytes: file.size,
      fileType: file.type,
      fileName: file.name,
    });
    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractDailyFromBuffer(buffer, file.type, file.name);
    voiceLog('extract-route', 'info', 'extract ok', {
      elapsedMs: Date.now() - started,
      extractedKeys: Object.keys(extracted),
      preview:
        typeof extracted.spokenTranscript === 'string'
          ? previewText(extracted.spokenTranscript)
          : undefined,
    });

    return NextResponse.json({ success: true, extracted });
  } catch (err) {
    voiceLog('extract-route', 'error', 'extract threw', {
      elapsedMs: Date.now() - started,
      error: errorMessage(err),
    });
    return NextResponse.json({ success: false, error: 'Extraction failed' }, { status: 500 });
  }
}
