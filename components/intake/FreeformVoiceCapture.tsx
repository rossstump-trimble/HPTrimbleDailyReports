"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Mic, Square, Sparkles, AlertCircle, RotateCcw } from "lucide-react";
import LiveSpeechCapture from "@/components/intake/LiveSpeechCapture";
import VoiceRecorder from "@/components/intake/VoiceRecorder";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { browserSpeechSupported } from "@/lib/browser-speech";

interface FreeformVoiceCaptureProps {
  initialText?: string;
  isProcessing?: boolean;
  onTranscriptSubmitted: (transcript: string, audioFile?: File) => void;
  onCancel?: () => void;
}

export default function FreeformVoiceCapture({
  initialText = "",
  isProcessing = false,
  onTranscriptSubmitted,
  onCancel,
}: FreeformVoiceCaptureProps) {
  const [transcript, setTranscript] = useState(initialText);
  const [phoneSttAvailable, setPhoneSttAvailable] = useState(false);
  const [usePhoneStt, setUsePhoneStt] = useState(true);

  useEffect(() => {
    const supported = browserSpeechSupported();
    setPhoneSttAvailable(supported);
    setUsePhoneStt(supported);
  }, []);

  const handleLiveText = useCallback((text: string) => {
    setTranscript(text);
  }, []);

  const handleFinalText = useCallback((text: string) => {
    setTranscript(text);
  }, []);

  const handleRecordingComplete = useCallback((file: File) => {
    onTranscriptSubmitted("", file);
  }, [onTranscriptSubmitted]);

  const handleSubmitTranscript = () => {
    if (!transcript.trim()) return;
    onTranscriptSubmitted(transcript.trim());
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4 shadow-sm">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#0063a3] dark:text-blue-400 mx-auto">
          <Mic className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          Speak Your Daily Report
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Speak freely without prompts. Describe the work done, crew count, hours, equipment, and any issues or safety notes.
        </p>
      </div>

      {/* STT Controls */}
      <div className="space-y-3 pt-1">
        {usePhoneStt ? (
          <LiveSpeechCapture
            disabled={isProcessing}
            onFallback={() => setUsePhoneStt(false)}
            onLiveText={handleLiveText}
            onFinalText={handleFinalText}
          />
        ) : (
          <VoiceRecorder
            disabled={isProcessing}
            startLabel="Tap to Record Full Daily"
            onRecordingComplete={handleRecordingComplete}
          />
        )}
      </div>

      {/* Live Transcript & Manual Editor */}
      <div className="space-y-1.5 pt-1">
        <label
          htmlFor="freeform-transcript"
          className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 block"
        >
          Spoken Report Transcript
        </label>
        <Textarea
          id="freeform-transcript"
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          disabled={isProcessing}
          placeholder="Words will stream live as you speak. You can also edit or type directly here…"
          className="text-xs resize-y min-h-[96px]"
        />
      </div>

      {/* Process & Review Button */}
      <div className="space-y-2 pt-2 border-t">
        <button
          type="button"
          onClick={handleSubmitTranscript}
          disabled={isProcessing || !transcript.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white transition disabled:opacity-40"
          style={{ backgroundColor: "#0063a3" }}
        >
          <Sparkles className="h-4 w-4" />
          <span>{isProcessing ? "Analyzing with AI…" : "Process & Review Report →"}</span>
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
