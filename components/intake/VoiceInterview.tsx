"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Volume2 } from "lucide-react";
import VoiceRecorder from "@/components/intake/VoiceRecorder";
import {
  FOG617_SLOTS,
  openingQuestion,
  slotById,
  type Fog617SlotId,
  type InterviewMode,
} from "@/lib/fog617-interview";
import type { ExtractedDaily } from "@/lib/extract-response";
import { primeSpeech, speak, stopSpeaking } from "@/lib/speak";

interface VoiceInterviewProps {
  mode: InterviewMode;
  seedDraft: ExtractedDaily;
  onComplete: (draft: ExtractedDaily) => void;
  onCancel: () => void;
}

interface TurnResponse {
  success: boolean;
  draft: ExtractedDaily;
  answered: Fog617SlotId[];
  nextSlotId: Fog617SlotId | null;
  nextPrompt: string | null;
  done: boolean;
  transcript?: string;
}

function progressLabel(answeredCount: number, mode: InterviewMode): string {
  switch (mode) {
    case "guided":
      return `${answeredCount} of ${FOG617_SLOTS.length} questions`;
    case "dump":
      return answeredCount === 0 ? "Whole daily" : "Filling remaining gaps";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export default function VoiceInterview({
  mode,
  seedDraft,
  onComplete,
  onCancel,
}: VoiceInterviewProps) {
  const opening = openingQuestion(mode);
  const [draft, setDraft] = useState<ExtractedDaily>(seedDraft);
  const [answered, setAnswered] = useState<Fog617SlotId[]>([]);
  const [slotId, setSlotId] = useState<Fog617SlotId | null>(opening.slotId);
  const [prompt, setPrompt] = useState(opening.prompt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => stopSpeaking(), []);

  const hearAgain = useCallback(() => {
    primeSpeech();
    speak(prompt);
  }, [prompt]);

  const finishIfDone = useCallback(
    (next: TurnResponse) => {
      setDraft(next.draft);
      setAnswered(next.answered);
      if (next.done) {
        stopSpeaking();
        onComplete(next.draft);
        return;
      }
      setSlotId(next.nextSlotId);
      if (next.nextPrompt) {
        setPrompt(next.nextPrompt);
        speak(next.nextPrompt);
      }
    },
    [onComplete],
  );

  const runTurn = useCallback(
    async (file: File | null, skip: boolean) => {
      setBusy(true);
      setError(null);
      try {
        const body = new FormData();
        body.append("mode", mode);
        body.append("skip", skip ? "true" : "false");
        body.append("draft", JSON.stringify(draft));
        body.append("answered", JSON.stringify(answered));
        if (slotId) body.append("slotId", slotId);
        if (file) body.append("file", file);

        const res = await fetch("/api/intake/turn", { method: "POST", body });
        const payload = (await res.json()) as TurnResponse;
        if (!res.ok || !payload.success) {
          throw new Error("turn failed");
        }
        finishIfDone(payload);
      } catch {
        setError("Could not transcribe that answer. Try again, or skip if this field is optional.");
      } finally {
        setBusy(false);
      }
    },
    [answered, draft, finishIfDone, mode, slotId],
  );

  const currentSlot = slotId ? slotById(slotId) : null;
  const canSkip = Boolean(currentSlot && !currentSlot.required);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {mode === "guided" ? "One question at a time" : "Whole daily"}
          </p>
          <p className="mt-1 text-base font-semibold text-gray-800 dark:text-gray-100 leading-snug">
            {prompt}
          </p>
        </div>
        <span className="flex-none rounded-full bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
          {progressLabel(answered.length, mode)}
        </span>
      </div>

      {busy ? (
        <p className="text-sm text-blue-700 dark:text-blue-300 text-center py-6">
          Transcribing your answer…
        </p>
      ) : (
        <VoiceRecorder
          variant="compact"
          disabled={busy}
          startLabel="Tap to answer"
          onStopIntent={primeSpeech}
          onRecordingComplete={(file) => {
            void runTurn(file, false);
          }}
        />
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={hearAgain}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <Volume2 size={16} />
          Hear the question again
        </button>

        {canSkip && (
          <button
            type="button"
            onClick={() => {
              primeSpeech();
              void runTurn(null, true);
            }}
            disabled={busy}
            className="flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
          >
            Skip this one
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            stopSpeaking();
            onCancel();
          }}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
        >
          <RotateCcw size={15} />
          Cancel interview
        </button>
      </div>
    </div>
  );
}
