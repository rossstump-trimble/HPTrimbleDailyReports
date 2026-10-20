import { NextResponse } from 'next/server';
import { extractDailyFromTranscript } from '@/lib/extract-daily';
import {
  applyInterviewTurn,
  isFog617SlotId,
  parseInterviewMode,
  stripTranscriptOnlyNotes,
  type Fog617SlotId,
} from '@/lib/fog617-interview';
import type { ExtractedDaily } from '@/lib/extract-response';
import { transcribeAudioFromBuffer } from '@/lib/transcribe-audio';
import { errorMessage, newVoiceRequestId, previewText, voiceLog } from '@/lib/voice-log';

export const runtime = 'nodejs';

const MAX_BYTES = 15 * 1024 * 1024;

function parseDraft(raw: unknown): ExtractedDaily {
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as ExtractedDaily) : {};
  } catch {
    return {};
  }
}

function parseAnswered(raw: unknown): Fog617SlotId[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFog617SlotId);
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const requestId = req.headers.get('x-voice-request-id') || newVoiceRequestId();
  const started = Date.now();
  try {
    const formData = await req.formData();
    const mode = parseInterviewMode(formData.get('mode'));
    const skip = formData.get('skip') === 'true';
    const slotRaw = formData.get('slotId');
    const currentSlotId = isFog617SlotId(slotRaw) ? slotRaw : null;
    const draft = parseDraft(formData.get('draft'));
    const answered = parseAnswered(formData.get('answered'));

    let transcript = '';
    let extracted: ExtractedDaily = {};

    const typedRaw = formData.get('transcript');
    const typedTranscript = typeof typedRaw === 'string' ? typedRaw.trim() : '';
    const advance = formData.get('advance') !== 'false';
    const audience = formData.get('audience') === 'hp' ? ('hp' as const) : ('trade' as const);
    const file = formData.get('file');
    const hadFile = file instanceof File;
    voiceLog('turn-route', 'info', 'turn request', {
      requestId,
      mode,
      skip,
      slotId: currentSlotId,
      answeredCount: answered.length,
      hasFile: hadFile,
      fileBytes: hadFile ? file.size : 0,
      fileType: hadFile ? file.type : null,
      fileName: hadFile ? file.name : null,
      typedChars: typedTranscript.length,
      advance,
    });

    if (!skip && hadFile) {
      if (file.size > MAX_BYTES) {
        voiceLog('turn-route', 'warn', 'file too large', { requestId, fileBytes: file.size });
        return NextResponse.json(
          { success: false, error: 'File exceeds 15 MB limit', requestId },
          { status: 413 },
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      transcript = await transcribeAudioFromBuffer(buffer, file.type, file.name, requestId);
      if (!transcript) {
        voiceLog('turn-route', 'error', 'transcription empty', {
          requestId,
          elapsedMs: Date.now() - started,
        });
        return NextResponse.json(
          { success: false, error: 'Could not transcribe that answer', requestId },
          { status: 422 },
        );
      }
      extracted = stripTranscriptOnlyNotes(
        await extractDailyFromTranscript(transcript, requestId),
        transcript,
      );
      voiceLog('turn-route', 'info', 'extracted fields', {
        requestId,
        transcriptChars: transcript.length,
        preview: previewText(transcript),
        extractedKeys: Object.keys(extracted).filter((key) => extracted[key as keyof ExtractedDaily] != null),
      });
    } else if (!skip && typedTranscript) {
      transcript = typedTranscript;
      extracted = stripTranscriptOnlyNotes(
        await extractDailyFromTranscript(transcript, requestId),
        transcript,
      );
      voiceLog('turn-route', 'info', 'extracted typed transcript', {
        requestId,
        transcriptChars: transcript.length,
        preview: previewText(transcript),
        extractedKeys: Object.keys(extracted).filter((key) => extracted[key as keyof ExtractedDaily] != null),
      });
    }

    const result = applyInterviewTurn({
      mode,
      draft,
      answered,
      currentSlotId,
      extracted,
      transcript,
      skip,
      advance,
      audience,
    });

    voiceLog('turn-route', 'info', 'turn ok', {
      requestId,
      elapsedMs: Date.now() - started,
      done: result.done,
      nextSlotId: result.nextSlotId,
      nextPrompt: result.nextPrompt ? previewText(result.nextPrompt) : null,
      answeredCount: result.answered.length,
    });

    return NextResponse.json({ success: true, requestId, transcript, ...result });
  } catch (err) {
    voiceLog('turn-route', 'error', 'turn threw', {
      requestId,
      elapsedMs: Date.now() - started,
      error: errorMessage(err),
    });
    return NextResponse.json(
      { success: false, error: 'Interview turn failed', requestId },
      { status: 500 },
    );
  }
}
