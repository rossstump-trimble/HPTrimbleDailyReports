"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Volume2, Sparkles, Mic, Cloud } from "lucide-react";
import InterviewFormPreview from "@/components/intake/InterviewFormPreview";
import LiveSpeechCapture from "@/components/intake/LiveSpeechCapture";
import VoiceRecorder from "@/components/intake/VoiceRecorder";
import { Textarea } from "@/components/ui/textarea";
import { browserSpeechSupported } from "@/lib/browser-speech";
import {
  adjacentQuestion,
  answerKeyForSlot,
  interviewQuestions,
  openingQuestion,
  questionIndex,
  slotById,
  type Fog617SlotId,
  type InterviewAnswerKey,
  type InterviewMode,
} from "@/lib/fog617-interview";
import type { ExtractedDaily } from "@/lib/extract-response";
import { primeSpeech, speak, stopSpeaking } from "@/lib/speak";
import { errorMessage, newVoiceRequestId, voiceLog } from "@/lib/voice-log";

type SttEngine = "gemini" | "phone";

interface VoiceInterviewProps {
  mode: InterviewMode;
  seedDraft: ExtractedDaily;
  onComplete: (draft: ExtractedDaily) => void;
  onCancel: () => void;
  audience?: "trade" | "hp";
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

function progressLabel(mode: InterviewMode, slotId: Fog617SlotId | null, audience?: "trade" | "hp"): string {
  const total = interviewQuestions(mode, audience).length;
  const current = questionIndex(mode, slotId, audience) + 1;
  switch (mode) {
    case "guided":
    case "dump":
      return `${current} of ${total}`;
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
  audience = "trade",
}: VoiceInterviewProps) {
  const opening = openingQuestion(mode, audience);
  const [draft, setDraft] = useState<ExtractedDaily>(seedDraft);
  const [answered, setAnswered] = useState<Fog617SlotId[]>([]);
  const [slotId, setSlotId] = useState<Fog617SlotId | null>(opening.slotId);
  const [prompt, setPrompt] = useState(opening.prompt);
  const [answers, setAnswers] = useState<Partial<Record<InterviewAnswerKey, string>>>({});
  const [editedText, setEditedText] = useState("");
  const [lastHeard, setLastHeard] = useState<string | null>(null);
  const [sttEngine, setSttEngine] = useState<SttEngine>("phone");
  const [phoneSttAvailable, setPhoneSttAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    const supported = browserSpeechSupported();
    setPhoneSttAvailable(supported);
    setSttEngine(supported ? "phone" : "gemini");
  }, []);

  useEffect(() => {
    void speak(prompt);
  }, [prompt]);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    setEditedText(answersRef.current[answerKeyForSlot(slotId)] ?? "");
  }, [slotId]);

  const hearAgain = useCallback(() => {
    primeSpeech();
    void speak(prompt);
  }, [prompt]);

  const persistEditor = useCallback((text: string, currentSlotId: Fog617SlotId | null) => {
    const key = answerKeyForSlot(currentSlotId);
    setAnswers((prev) => ({ ...prev, [key]: text }));
  }, []);

  const applyTurn = useCallback(
    (next: TurnResponse, stay: boolean, currentSlotId: Fog617SlotId | null) => {
      setDraft(next.draft);
      setAnswered(next.answered);
      if (next.transcript?.trim()) {
        persistEditor(next.transcript.trim(), currentSlotId);
        setLastHeard(next.transcript.trim());
        if (stay) {
          setEditedText(next.transcript.trim());
        }
      }
      if (stay) {
        return;
      }
      if (next.done || !next.nextPrompt) {
        return;
      }
      setSlotId(next.nextSlotId);
      setPrompt(next.nextPrompt);
    },
    [persistEditor],
  );

  const runTurn = useCallback(
    async (
      file: File | null,
      skip: boolean,
      typedTranscript?: string,
      stay = false,
    ): Promise<ExtractedDaily | null> => {
      setBusy(true);
      setError(null);
      const currentSlotId = slotId;
      try {
        const body = new FormData();
        body.append("mode", mode);
        body.append("audience", audience);
        body.append("skip", skip ? "true" : "false");
        body.append("advance", stay ? "false" : "true");
        body.append("draft", JSON.stringify(draft));
        body.append("answered", JSON.stringify(answered));
        if (slotId) body.append("slotId", slotId);
        if (file) body.append("file", file);
        if (typedTranscript?.trim()) body.append("transcript", typedTranscript.trim());

        const requestId = newVoiceRequestId();
        voiceLog("interview", "info", "turn fetch start", {
          requestId,
          mode,
          skip,
          stay,
          slotId,
          fileBytes: file?.size ?? 0,
          fileType: file?.type ?? null,
          typedChars: typedTranscript?.trim().length ?? 0,
        });
        const res = await fetch("/api/intake/turn", {
          method: "POST",
          headers: { "x-voice-request-id": requestId },
          body,
        });
        const payload = (await res.json()) as TurnResponse & { error?: string; requestId?: string };
        if (!res.ok || !payload.success) {
          voiceLog("interview", "error", "turn fetch failed", {
            requestId: payload.requestId ?? requestId,
            status: res.status,
            error: payload.error ?? "turn failed",
          });
          throw new Error(payload.error || `turn failed (${res.status})`);
        }
        voiceLog("interview", "info", "turn fetch ok", {
          requestId: payload.requestId ?? requestId,
          done: payload.done,
          nextSlotId: payload.nextSlotId,
          stay,
        });
        applyTurn(payload, stay, currentSlotId);
        return payload.draft;
      } catch (err) {
        voiceLog("interview", "error", "turn client error", { error: errorMessage(err) });
        setError("Could not transcribe that answer. Try again, or skip.");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [answered, applyTurn, audience, draft, mode, slotId],
  );

  const savedText = answers[answerKeyForSlot(slotId)] ?? "";
  const dirty = editedText.trim() !== savedText.trim();

  const finishReview = useCallback(
    async (nextDraft: ExtractedDaily) => {
      persistEditor(editedText, slotId);
      let outgoing = nextDraft;
      if (editedText.trim() && dirty) {
        const saved = await runTurn(null, false, editedText, true);
        if (!saved) return;
        outgoing = saved;
      }
      stopSpeaking();
      onComplete(outgoing);
    },
    [dirty, editedText, onComplete, persistEditor, runTurn, slotId],
  );

  const go = useCallback(
    (direction: "back" | "forward") => {
      void (async () => {
        persistEditor(editedText, slotId);
        let nextDraft = draft;
        if (editedText.trim() && dirty) {
          const saved = await runTurn(null, false, editedText, true);
          if (!saved) return;
          nextDraft = saved;
        }
        const next = adjacentQuestion(mode, slotId, direction, audience);
        if (!next) {
          if (direction === "forward") {
            stopSpeaking();
            onComplete(nextDraft);
          }
          return;
        }
        setError(null);
        setSlotId(next.slotId);
        setPrompt(next.prompt);
      })();
    },
    [audience, dirty, draft, editedText, mode, onComplete, persistEditor, runTurn, slotId],
  );

  const currentSlot = slotId ? slotById(slotId) : null;
  const canSave = Boolean(editedText.trim()) && dirty;
  const previous = adjacentQuestion(mode, slotId, "back", audience);
  const upcoming = adjacentQuestion(mode, slotId, "forward", audience);

  const sttControls = (() => {
    switch (sttEngine) {
      case "gemini":
        return busy ? (
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center py-6">
            Transcribing your answer…
          </p>
        ) : (
          <VoiceRecorder
            variant="compact"
            disabled={busy}
            startLabel="Tap to answer (Audio)"
            onStartIntent={stopSpeaking}
            onStopIntent={primeSpeech}
            onRecordingComplete={(file) => {
              persistEditor(editedText, slotId);
              void runTurn(file, false);
            }}
          />
        );
      case "phone":
        return busy ? (
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center py-6">
            Saving what we heard…
          </p>
        ) : (
          <LiveSpeechCapture
            disabled={busy}
            startLabel="Tap to Speak (Built-in)"
            onFallback={() => setSttEngine("gemini")}
            onLiveText={(text) => {
              setEditedText(text);
              setLastHeard(text);
            }}
            onFinalText={(text) => {
              persistEditor(text, slotId);
              setEditedText(text);
              setLastHeard(text);
              void runTurn(null, false, text);
            }}
          />
        );
      default: {
        const _exhaustive: never = sttEngine;
        return _exhaustive;
      }
    }
  })();

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4 shadow-sm">
      {/* Current Question Prominent Display */}
      <div className="rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0063a3] dark:text-blue-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {mode === "guided" ? "Current Question" : "Daily Report Prompt"}
          </span>
          <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-bold text-[#0063a3] dark:text-blue-300">
            {progressLabel(mode, slotId, audience)}
          </span>
        </div>

        <p className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
          {prompt}
        </p>

        <div className="pt-0.5">
          <button
            type="button"
            onClick={hearAgain}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0063a3] dark:text-blue-400 hover:underline"
          >
            <Volume2 size={14} />
            <span>Hear question again</span>
          </button>
        </div>
      </div>

      {/* Question Stepper */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => go("back")}
          disabled={busy || !previous}
          className="flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-muted disabled:opacity-40 transition"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <button
          type="button"
          onClick={() => go("forward")}
          disabled={busy}
          className="flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-muted disabled:opacity-40 transition"
        >
          {upcoming ? "Next Question" : "Review Form"}
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Speech Mode Toggle: Built-in Speech (Default) vs Cloud Audio */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 pl-1.5">
          Speech Mode
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSttEngine("phone")}
            disabled={!phoneSttAvailable || busy}
            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 ${
              sttEngine === "phone"
                ? "bg-[#0063a3] text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            } disabled:opacity-40`}
            title="Built-in on-device speech-to-text (live transcript)"
          >
            <Mic className="h-3 w-3" />
            <span>Built-in (Device)</span>
          </button>
          <button
            type="button"
            onClick={() => setSttEngine("gemini")}
            disabled={busy}
            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 ${
              sttEngine === "gemini"
                ? "bg-[#0063a3] text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
            title="Cloud audio recording and transcription"
          >
            <Cloud className="h-3 w-3" />
            <span>Cloud Audio</span>
          </button>
        </div>
      </div>

      {/* Voice Controls with live transcription */}
      {sttControls}

      {/* Live Words & Answer Editor */}
      <div className="space-y-2">
        <label
          htmlFor="interview-answer"
          className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400"
        >
          Your Answer (Live transcript &amp; edits)
        </label>
        <Textarea
          id="interview-answer"
          value={editedText}
          onChange={(event) => setEditedText(event.target.value)}
          disabled={busy}
          rows={3}
          placeholder="Words will stream live as you speak. You can also edit or type directly here."
          className="min-h-[84px] resize-y text-xs"
        />
        {canSave && (
          <button
            type="button"
            onClick={() => {
              primeSpeech();
              void runTurn(null, false, editedText, true);
            }}
            disabled={busy}
            className="flex w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold text-white transition"
            style={{ backgroundColor: "#0063a3" }}
          >
            Save Edited Text
          </button>
        )}
      </div>

      {lastHeard && (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Last Transcribed
          </p>
          <p className="text-gray-800 dark:text-gray-200">{lastHeard}</p>
        </div>
      )}

      <InterviewFormPreview draft={draft} audience={audience} />

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-col gap-2 pt-2 border-t">
        <button
          type="button"
          onClick={() => {
            void finishReview(draft);
          }}
          disabled={busy}
          className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50 transition"
          style={{ backgroundColor: "#0063a3" }}
        >
          Review &amp; Edit Form →
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              primeSpeech();
              void runTurn(null, true);
            }}
            disabled={busy}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            Skip question
          </button>

          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onCancel();
            }}
            disabled={busy}
            className="flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <RotateCcw size={13} />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
