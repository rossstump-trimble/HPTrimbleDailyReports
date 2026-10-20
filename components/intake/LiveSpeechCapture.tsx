"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  classifySpeechRecognitionError,
  getSpeechRecognitionCtor,
  transcriptFromSpeechEvent,
} from "@/lib/browser-speech";
import { micPermissionDialogCopy } from "@/lib/mic-permission";
import { errorMessage, voiceLog } from "@/lib/voice-log";

interface LiveSpeechCaptureProps {
  disabled?: boolean;
  startLabel?: string;
  onLiveText: (text: string) => void;
  onFinalText: (text: string) => void;
  onFallback?: () => void;
}

export default function LiveSpeechCapture({
  disabled = false,
  startLabel,
  onLiveText,
  onFinalText,
  onFallback,
}: LiveSpeechCaptureProps) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<"denied" | "no-speech" | "unsupported" | "unknown" | null>(
    null,
  );
  const [micDialogOpen, setMicDialogOpen] = useState(false);
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const submittedRef = useRef(false);
  const onLiveTextRef = useRef(onLiveText);
  onLiveTextRef.current = onLiveText;
  const onFinalTextRef = useRef(onFinalText);
  onFinalTextRef.current = onFinalText;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setInterim("");
  }, []);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
    },
    [],
  );

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("unsupported");
      return;
    }
    setError(null);
    finalRef.current = "";
    interimRef.current = "";
    submittedRef.current = false;
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const parsed = transcriptFromSpeechEvent(event);
      finalRef.current = parsed.finalText;
      interimRef.current = parsed.interimText;
      setInterim(parsed.interimText);
      const combined = [parsed.finalText, parsed.interimText].filter(Boolean).join(" ");
      onLiveTextRef.current(combined);
    };
    recognition.onerror = (event) => {
      const classified = classifySpeechRecognitionError(event.error);
      voiceLog("browser-speech", "error", "recognition error", {
        error: event.error,
        classified,
      });
      switch (classified) {
        case "denied":
          setError("denied");
          break;
        case "no-speech":
          setError("no-speech");
          break;
        case "unsupported":
          setError("unsupported");
          break;
        case "unknown":
          setError("unknown");
          break;
        default: {
          const _exhaustive: never = classified;
          return _exhaustive;
        }
      }
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
      const spoken = [finalRef.current, interimRef.current].filter(Boolean).join(" ").trim();
      if (spoken && !submittedRef.current) {
        submittedRef.current = true;
        onFinalTextRef.current(spoken);
      }
      recognitionRef.current = null;
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch (err) {
      voiceLog("browser-speech", "error", "recognition start failed", {
        error: errorMessage(err),
      });
      setError("unknown");
    }
  }, []);

  const toggle = () => {
    if (listening) stop();
    else start();
  };

  const micCopy = micPermissionDialogCopy(
    typeof navigator === "undefined" ? "" : navigator.userAgent,
  );

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={listening}
        className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: listening ? "#dc2626" : "#0063a3" }}
      >
        {listening ? (
          <>
            <Square size={16} fill="currentColor" className="animate-pulse" />
            Stop listening (Tap when done)
          </>
        ) : (
          <>
            <Mic size={18} />
            {startLabel || "Tap to Speak (Built-in)"}
          </>
        )}
      </button>
      {listening && (
        <p className="mt-2 text-center text-xs font-semibold text-red-600 dark:text-red-400">
          Listening… words appear below as you speak
        </p>
      )}
      {interim && (
        <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">{interim}</p>
      )}
      {error === "no-speech" && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          No speech heard. Tap and try again.
        </p>
      )}
      {error === "unsupported" && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          Built-in speech-to-text is not supported in this browser.
        </p>
      )}
      {error === "unknown" && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          Could not start built-in speech-to-text.
        </p>
      )}
      {error === "denied" && (
        <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
            Microphone access is blocked in this browser.
          </p>
          <button
            type="button"
            onClick={() => setMicDialogOpen(true)}
            className="text-xs font-semibold text-[#0063a3] dark:text-blue-400 hover:underline block pt-1"
          >
            View instructions to enable mic →
          </button>
        </div>
      )}
      <Dialog open={micDialogOpen} onOpenChange={setMicDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{micCopy.title}</DialogTitle>
            <DialogDescription>{micCopy.body}</DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-200">
            {micCopy.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setMicDialogOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setMicDialogOpen(false);
                start();
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "#0063a3" }}
            >
              {micCopy.tryAgainLabel}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
