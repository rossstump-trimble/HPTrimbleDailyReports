"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { AudioPulse } from "@/components/ui/audio-pulse";
import {
  extensionForAudioMime,
  pickRecorderMimeType,
} from "@/lib/audio-mime";
import { cn } from "@/lib/utils";

const MAX_SECONDS = 180;

type MicError = "unsupported" | "insecure" | "denied" | "not-found" | "unknown";

function micErrorMessage(error: MicError): string {
  switch (error) {
    case "unsupported":
      return "Voice recording is not available in this browser. Upload a file instead.";
    case "insecure":
      return "Microphone access needs HTTPS. Open this page over https and try again.";
    case "denied":
      return "Microphone access was blocked. Enable it in your phone settings and try again.";
    case "not-found":
      return "No microphone found on this device.";
    case "unknown":
      return "Could not start the microphone. Try again, or upload a file.";
    default: {
      const _exhaustive: never = error;
      return _exhaustive;
    }
  }
}

function classifyGetUserMediaError(err: unknown): MicError {
  if (!err || typeof err !== "object") return "unknown";
  const name = "name" in err ? String(err.name) : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "not-found";
    case "NotSupportedError":
    case "TypeError":
      return "unsupported";
    case "SecurityError":
      return "insecure";
    default:
      return "unknown";
  }
}

function formatElapsed(seconds: number): string {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mm}:${ss}`;
}

function createAudioContext(): AudioContext | null {
  const Ctor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
}

interface VoiceRecorderProps {
  onRecordingComplete: (file: File) => void;
  onStopIntent?: () => void;
  disabled?: boolean;
  variant?: "card" | "compact";
  startLabel?: string;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onStopIntent,
  disabled = false,
  variant = "card",
  startLabel = "Tap to talk",
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<MicError | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const mimeRef = useRef("");
  const stoppingRef = useRef(false);
  const startingRef = useRef(false);
  const onCompleteRef = useRef(onRecordingComplete);
  onCompleteRef.current = onRecordingComplete;
  const onStopIntentRef = useRef(onStopIntent);
  onStopIntentRef.current = onStopIntent;

  const tearDown = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    recorderRef.current = null;
    setVolume(0);
  }, []);

  useEffect(() => () => tearDown(), [tearDown]);

  const finishRecording = useCallback(() => {
    const mime = mimeRef.current || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mime.split(";")[0] });
    chunksRef.current = [];
    tearDown();
    setRecording(false);
    setElapsed(0);
    stoppingRef.current = false;

    if (blob.size < 256) {
      setError("unknown");
      return;
    }

    const ext = extensionForAudioMime(mime);
    const file = new File([blob], `daily-report.${ext}`, { type: blob.type || mime });
    onCompleteRef.current(file);
  }, [tearDown]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || stoppingRef.current) return;
    stoppingRef.current = true;
    if (recorder.state !== "inactive") {
      recorder.stop();
    } else {
      finishRecording();
    }
  }, [finishRecording]);

  useEffect(() => {
    if (recording && elapsed >= MAX_SECONDS) {
      stopRecording();
    }
  }, [elapsed, recording, stopRecording]);

  const pulseVolume = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    setVolume(Math.min(1, rms * 4));
    rafRef.current = requestAnimationFrame(pulseVolume);
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled || recording || stoppingRef.current || startingRef.current) return;
    setError(null);

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("insecure");
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("unsupported");
      return;
    }

    startingRef.current = true;
    const mimeType = pickRecorderMimeType((mime) => MediaRecorder.isTypeSupported(mime));
    mimeRef.current = mimeType;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mimeRef.current = recorder.mimeType || mimeType;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setError("unknown");
        tearDown();
        setRecording(false);
        stoppingRef.current = false;
        startingRef.current = false;
      };
      recorder.onstop = () => {
        finishRecording();
      };

      const audioCtx = createAudioContext();
      if (audioCtx) {
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;
        rafRef.current = requestAnimationFrame(pulseVolume);
      }

      recorder.start(1000);
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      tearDown();
      setError(classifyGetUserMediaError(err));
    } finally {
      startingRef.current = false;
    }
  }, [disabled, finishRecording, pulseVolume, recording, tearDown]);

  const toggle = () => {
    if (recording) {
      onStopIntentRef.current?.();
      stopRecording();
    } else {
      void startRecording();
    }
  };

  const micButton = (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-pressed={recording}
      aria-label={recording ? "Stop recording daily report" : "Start recording daily report"}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        recording ? "bg-red-600 hover:bg-red-700" : "",
      )}
      style={recording ? undefined : { backgroundColor: "#0063a3" }}
    >
      {recording ? (
        <>
          <Square size={16} fill="currentColor" />
          Stop &amp; transcribe
        </>
      ) : (
        <>
          <Mic size={18} />
          {startLabel}
        </>
      )}
    </button>
  );

  if (variant === "compact") {
    return (
      <div>
        {recording && (
          <p className="mb-2 text-center text-xs font-semibold tabular-nums text-red-600 dark:text-red-400">
            {formatElapsed(elapsed)}
          </p>
        )}
        <AudioPulse active={recording} volume={volume} variant="small" className="mb-3 h-10" />
        {micButton}
        {error && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400">{micErrorMessage(error)}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Speak your daily</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Tap the mic and say crew count, hours, location, equipment, delays, and whether STA is done.
          </p>
        </div>
        {recording && (
          <span className="flex-none rounded-full bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-xs font-semibold tabular-nums text-red-600 dark:text-red-400">
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      <AudioPulse
        active={recording}
        volume={volume}
        variant="medium"
        className="my-3"
      />

      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={recording}
        aria-label={recording ? "Stop recording daily report" : "Start recording daily report"}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          recording ? "bg-red-600 hover:bg-red-700" : "",
        )}
        style={recording ? undefined : { backgroundColor: "#0063a3" }}
      >
        {recording ? (
          <>
            <Square size={16} fill="currentColor" />
            Stop &amp; transcribe
          </>
        ) : (
          <>
            <Mic size={18} />
            Tap to talk
          </>
        )}
      </button>

      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{micErrorMessage(error)}</p>
      )}
    </div>
  );
}
