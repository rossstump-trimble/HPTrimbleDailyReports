import { geminiGenerate, GEMINI_TTS_MODELS } from '@/lib/gemini-client';
import { inlineAudioToWav } from '@/lib/pcm-wav';
import { previewText, voiceLog } from '@/lib/voice-log';

const DEFAULT_VOICE = process.env.GEMINI_TTS_VOICE || 'Kore';

function spokenPrompt(text: string): string {
  return `Say this construction-site question clearly and directly, with no extra commentary:\n${text.trim()}`;
}

export async function synthesizeSpeechWav(
  text: string,
  requestId?: string,
): Promise<Buffer | null> {
  const spoken = text.trim();
  if (!spoken) {
    voiceLog('tts', 'warn', 'empty text, skipping synthesis', { requestId });
    return null;
  }

  voiceLog('tts', 'info', 'synthesize start', {
    requestId,
    voice: DEFAULT_VOICE,
    models: GEMINI_TTS_MODELS,
    chars: spoken.length,
    preview: previewText(spoken),
  });

  for (const model of GEMINI_TTS_MODELS) {
    const result = await geminiGenerate({
      model,
      requestId,
      parts: [{ text: spokenPrompt(spoken) }],
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: DEFAULT_VOICE } },
      },
    });
    if (result?.inlineData?.data) {
      const wav = inlineAudioToWav(result.inlineData);
      voiceLog('tts', 'info', 'synthesize ok', {
        requestId,
        model,
        pcmMime: result.inlineData.mimeType,
        wavBytes: wav.length,
      });
      return wav;
    }
    voiceLog('tts', 'warn', 'model returned no audio, trying next', { requestId, model });
  }

  voiceLog('tts', 'error', 'all TTS models failed', {
    requestId,
    models: GEMINI_TTS_MODELS,
  });
  return null;
}
