"use client";

import { errorMessage, newVoiceRequestId, previewText, voiceLog } from "@/lib/voice-log";

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentAudio: HTMLAudioElement | null = null;
let speakGeneration = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function fallbackSpeechSynthesis(text: string, requestId: string, reason: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) {
    voiceLog("speak", "error", "browser speechSynthesis unavailable", { requestId, reason });
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.onerror = (event) => {
    voiceLog("speak", "error", "speechSynthesis utterance error", {
      requestId,
      error: event.error,
    });
  };
  window.speechSynthesis.speak(utterance);
  voiceLog("speak", "warn", "fell back to speechSynthesis", { requestId, reason });
}

export function primeSpeech(): void {
  if (typeof window === "undefined") return;
  const ctx = getAudioContext();
  voiceLog("speak", "info", "primeSpeech", {
    audioCtxState: ctx?.state ?? "none",
    secureContext: window.isSecureContext,
    speechSynthesis: Boolean(window.speechSynthesis),
  });
  if (ctx?.state === "suspended") {
    void ctx.resume().then(
      () => voiceLog("speak", "info", "audioCtx resumed", { audioCtxState: ctx.state }),
      (err: unknown) => voiceLog("speak", "warn", "audioCtx resume failed", { error: errorMessage(err) }),
    );
  }
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(" ");
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  speakGeneration += 1;
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // already stopped
    }
    currentSource = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

async function playWavBytes(bytes: ArrayBuffer, requestId: string): Promise<boolean> {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    const decoded = await ctx.decodeAudioData(bytes.slice(0));
    const source = ctx.createBufferSource();
    source.buffer = decoded;
    source.connect(ctx.destination);
    currentSource = source;
    source.onended = () => {
      if (currentSource === source) currentSource = null;
    };
    source.start();
    voiceLog("speak", "info", "playing via AudioContext", {
      requestId,
      audioCtxState: ctx.state,
      durationSec: Number(decoded.duration.toFixed(2)),
      bytes: bytes.byteLength,
    });
    return true;
  }

  const blob = new Blob([bytes], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  audio.onended = () => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
  };
  await audio.play();
  voiceLog("speak", "info", "playing via HTMLAudioElement", {
    requestId,
    bytes: bytes.byteLength,
  });
  return true;
}

export async function speak(text: string): Promise<void> {
  if (typeof window === "undefined" || !text.trim()) return;
  const requestId = newVoiceRequestId();
  stopSpeaking();
  const generation = speakGeneration;
  voiceLog("speak", "info", "speak start", {
    requestId,
    chars: text.length,
    preview: previewText(text),
    audioCtxState: getAudioContext()?.state ?? "none",
  });

  try {
    const res = await fetch("/api/intake/speak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-voice-request-id": requestId,
      },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const bytes = await res.arrayBuffer();
      if (generation !== speakGeneration) {
        voiceLog("speak", "info", "speak cancelled before playback", { requestId });
        return;
      }
      await playWavBytes(bytes, requestId);
      return;
    }
    const detail = await res.text().catch(() => "");
    voiceLog("speak", "warn", "speak API failed", {
      requestId,
      status: res.status,
      body: previewText(detail, 200),
    });
    if (generation !== speakGeneration) return;
    fallbackSpeechSynthesis(text, requestId, `http ${res.status}`);
    return;
  } catch (err) {
    voiceLog("speak", "error", "speak fetch/play threw", {
      requestId,
      error: errorMessage(err),
    });
  }

  if (generation !== speakGeneration) return;
  fallbackSpeechSynthesis(text, requestId, "exception");
}
