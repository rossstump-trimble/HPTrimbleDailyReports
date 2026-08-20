import { NextResponse } from 'next/server';
import { synthesizeSpeechWav } from '@/lib/gemini-tts';
import { errorMessage, newVoiceRequestId, previewText, voiceLog } from '@/lib/voice-log';

export const runtime = 'nodejs';

const MAX_CHARS = 2000;

export async function POST(req: Request) {
  const requestId = req.headers.get('x-voice-request-id') || newVoiceRequestId();
  const started = Date.now();
  try {
    const body = (await req.json()) as unknown;
    const text =
      body && typeof body === 'object' && 'text' in body && typeof (body as { text: unknown }).text === 'string'
        ? (body as { text: string }).text.trim()
        : '';
    voiceLog('speak-route', 'info', 'speak request', {
      requestId,
      chars: text.length,
      preview: previewText(text),
    });
    if (!text) {
      voiceLog('speak-route', 'warn', 'rejected empty text', { requestId });
      return NextResponse.json({ success: false, error: 'No text to speak', requestId }, { status: 400 });
    }
    if (text.length > MAX_CHARS) {
      voiceLog('speak-route', 'warn', 'rejected oversized text', { requestId, chars: text.length });
      return NextResponse.json({ success: false, error: 'Text exceeds speak limit', requestId }, { status: 413 });
    }

    const wav = await synthesizeSpeechWav(text, requestId);
    if (!wav) {
      voiceLog('speak-route', 'error', 'synthesis unavailable', {
        requestId,
        elapsedMs: Date.now() - started,
      });
      return NextResponse.json(
        { success: false, error: 'Speech synthesis unavailable', requestId },
        { status: 503 },
      );
    }

    voiceLog('speak-route', 'info', 'speak ok', {
      requestId,
      wavBytes: wav.length,
      elapsedMs: Date.now() - started,
    });
    return new NextResponse(new Uint8Array(wav), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'x-voice-request-id': requestId,
      },
    });
  } catch (err) {
    voiceLog('speak-route', 'error', 'speak threw', {
      requestId,
      elapsedMs: Date.now() - started,
      error: errorMessage(err),
    });
    return NextResponse.json(
      { success: false, error: 'Speech synthesis failed', requestId },
      { status: 500 },
    );
  }
}
