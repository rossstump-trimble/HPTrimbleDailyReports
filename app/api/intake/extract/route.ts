import { NextResponse } from 'next/server';
import { extractDailyFromMultipleFiles, type ExtractInputFile } from '@/lib/extract-daily';
import { saveStagingUpload } from '@/lib/upload-store';
import { errorMessage, previewText, voiceLog } from '@/lib/voice-log';

export const runtime = 'nodejs';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB per file

export async function POST(req: Request) {
  const started = Date.now();
  try {
    const formData = await req.formData();
    const rawFiles = [
      ...formData.getAll('files'),
      ...formData.getAll('file'),
    ].filter((f): f is File => f instanceof File);

    // Deduplicate in case the client submitted both
    const files = Array.from(new Set(rawFiles));

    if (files.length === 0) {
      voiceLog('extract-route', 'warn', 'no files provided', {});
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const inputFiles: ExtractInputFile[] = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        voiceLog('extract-route', 'warn', 'file too large', { fileBytes: file.size, fileName: file.name });
        return NextResponse.json({ success: false, error: `File ${file.name} exceeds 15 MB limit` }, { status: 413 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // Save raw uploaded/photographed image to disk on the instance immediately
      try {
        saveStagingUpload(file.name, buffer);
      } catch (saveErr) {
        console.warn('[extract] could not save staging upload', saveErr);
      }

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
