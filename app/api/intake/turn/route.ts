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

    const file = formData.get('file');
    if (!skip && file instanceof File) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ success: false, error: 'File exceeds 15 MB limit' }, { status: 413 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      transcript = await transcribeAudioFromBuffer(buffer, file.type, file.name);
      extracted = stripTranscriptOnlyNotes(
        await extractDailyFromTranscript(transcript),
        transcript,
      );
    }

    const result = applyInterviewTurn({
      mode,
      draft,
      answered,
      currentSlotId,
      extracted,
      transcript,
      skip,
    });

    return NextResponse.json({ success: true, transcript, ...result });
  } catch (err) {
    console.error('[intake/turn]', err);
    return NextResponse.json({ success: false, error: 'Interview turn failed' }, { status: 500 });
  }
}
