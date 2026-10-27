import { NextResponse } from 'next/server';
import {
  extractDailyFromMultipleFiles,
  extractDailyFromTranscript,
  type ExtractInputFile,
} from '@/lib/extract-daily';
import { saveStagingUpload } from '@/lib/upload-store';
import { errorMessage, previewText, voiceLog } from '@/lib/voice-log';

export const runtime = 'nodejs';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB per file
const MAX_FILES_COUNT = 10;
const MAX_TOTAL_BYTES = 35 * 1024 * 1024; // 35 MB aggregate per request
const MAX_TRANSCRIPT_CHARS = 50000;

export async function POST(req: Request) {
  const started = Date.now();
  try {
    const formData = await req.formData();
    const rawFiles = [
      ...formData.getAll('files'),
      ...formData.getAll('file'),
    ].filter((f): f is File => f instanceof File);

    const transcriptField = String(formData.get('transcript') || '').trim().slice(0, MAX_TRANSCRIPT_CHARS);
    const companyHint = String(formData.get('company') || '').trim().slice(0, 200);

    // Deduplicate in case the client submitted both
    const files = Array.from(new Set(rawFiles));

    if (files.length > MAX_FILES_COUNT) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_FILES_COUNT} files allowed per extraction` },
        { status: 413 },
      );
    }

    if (files.length === 0 && !transcriptField) {
      voiceLog('extract-route', 'warn', 'no files or transcript provided', {});
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (files.length === 0 && transcriptField) {
      const extracted = await extractDailyFromTranscript(transcriptField);
      if (companyHint && !extracted.tradePartnerName) {
        extracted.tradePartnerName = companyHint;
      }
      return NextResponse.json({ success: true, extracted });
    }

    const inputFiles: ExtractInputFile[] = [];
    let totalBytes = 0;
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        voiceLog('extract-route', 'warn', 'file too large', { fileBytes: file.size, fileName: file.name });
        return NextResponse.json({ success: false, error: `File ${file.name} exceeds 15 MB limit` }, { status: 413 });
      }
      totalBytes += file.size;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json({ success: false, error: 'Total upload size exceeds 35 MB limit' }, { status: 413 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      inputFiles.push({
        buffer,
        mimeType: file.type || 'image/jpeg',
        filename: file.name,
      });
    }

    voiceLog('extract-route', 'info', 'extract start', {
      fileCount: inputFiles.length,
      fileNames: inputFiles.map((f) => f.filename),
    });

    const extracted = await extractDailyFromMultipleFiles(inputFiles);
    if (companyHint && !extracted.tradePartnerName) {
      extracted.tradePartnerName = companyHint;
    }

    voiceLog('extract-route', 'info', 'extract ok', {
      elapsedMs: Date.now() - started,
      extractedKeys: Object.keys(extracted),
      ocrPages: extracted.sourcePages?.length ?? 0,
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
