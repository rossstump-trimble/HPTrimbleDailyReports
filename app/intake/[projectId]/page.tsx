"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  ListOrdered,
  Loader2,
  MessageSquare,
  Plus,
} from "lucide-react";
import FileUploadDropzone from "@/components/intake/FileUploadDropzone";
import VoiceInterview from "@/components/intake/VoiceInterview";
import DailyConfirmCard, { type DailyFormData } from "@/components/intake/DailyConfirmCard";
import type { ExtractedDaily } from "@/lib/extract-response";
import { extractedDailyHasContent, unwrapExtractResponse } from "@/lib/extract-response";
import {
  openingQuestion,
  type InterviewMode,
} from "@/lib/fog617-interview";
import { primeSpeech, speak } from "@/lib/speak";
import type { TradePartner } from "@/types/hpproto";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "upload" | "confirm" | "success";
type CaptureSource = "file" | "voice";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function emptyForm(tradePartnerId = "", tradePartnerName = ""): DailyFormData {
  return {
    tradePartnerId,
    tradePartnerName,
    date: todayISO(),
    locationDescription: "",
    workerCount: 0,
    totalHours: 0,
    crewBreakdown: [],
    equipment: [],
    notes: "",
    staCompleted: false,
    emailRecipients: [],
  };
}

function applyExtracted(
  extracted: ExtractedDaily,
  partners: TradePartner[],
  current: DailyFormData,
): DailyFormData {
  const fields = { ...extracted };
  delete fields.spokenTranscript;
  let tradePartnerId = "";
  let tradePartnerName = fields.tradePartnerName ?? "";

  if (tradePartnerName) {
    const match = partners.find((tp) => tp.name.toLowerCase() === tradePartnerName.toLowerCase());
    if (match) {
      tradePartnerId = match.id;
      tradePartnerName = match.name;
    }
  }

  if (!tradePartnerId && current.tradePartnerId) {
    tradePartnerId = current.tradePartnerId;
    tradePartnerName = current.tradePartnerName;
  }

  return {
    ...emptyForm(tradePartnerId, tradePartnerName),
    ...fields,
    tradePartnerId,
    tradePartnerName,
    date: fields.date ?? todayISO(),
    emailRecipients: fields.emailRecipients ?? current.emailRecipients,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrimbleHeader({ projectId }: { projectId: string }) {
  return (
    <header
      className="flex items-center gap-3 px-4 py-3 flex-none"
      style={{ backgroundColor: "#1b3a5c" }}
    >
      {/* Trimble wordmark placeholder */}
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-sm bg-[#fbad26] flex-none" aria-hidden />
        <span className="text-white font-bold text-sm tracking-wide">Trimble</span>
        <span className="text-white/50 text-sm">|</span>
        <span className="text-white/80 text-sm">Daily Intake</span>
      </div>

      <div className="flex-1" />

      <Link
        href={`/bowling/${projectId}`}
        className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 transition px-3 py-1.5 text-xs font-medium text-white"
      >
        <LayoutGrid size={14} />
        Bowling Matrix
        <ExternalLink size={11} className="opacity-60" />
      </Link>
    </header>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Capture" },
    { key: "confirm", label: "Review" },
    { key: "success", label: "Done" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center justify-center gap-2 py-4 px-4">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < currentIndex
                  ? "bg-[#349c44] text-white"
                  : i === currentIndex
                    ? "bg-[#0063a3] text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
              }`}
            >
              {i < currentIndex ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                i === currentIndex
                  ? "text-[#0063a3] dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-none" />
          )}
        </div>
      ))}
    </div>
  );
}

function captureLoadingLabel(source: CaptureSource | null): string {
  switch (source) {
    case "voice":
      return "Transcribing your daily report…";
    case "file":
      return "Analyzing report with Gemini…";
    case null:
      return "Analyzing your daily report…";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

function extractionWarningBody(source: CaptureSource | null): string {
  switch (source) {
    case "voice":
      return "We could not transcribe that recording. Please fill in the details below, or try speaking again.";
    case "file":
    case null:
      return "We could not parse your file automatically. Please fill in the details below manually.";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

function ExtractionWarningBanner({ source }: { source: CaptureSource | null }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 px-4 py-3">
      <AlertTriangle size={18} className="text-amber-500 flex-none mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          AI extraction unavailable
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          {extractionWarningBody(source)}
        </p>
      </div>
    </div>
  );
}

function SpokenTranscriptCard({ transcript }: { transcript: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400">What we heard</h3>
      </div>
      <p className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{transcript}</p>
    </div>
  );
}

function SuccessCard({ projectId, onSubmitAnother }: { projectId: string; onSubmitAnother: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 size={44} className="text-green-600 dark:text-green-400" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Report submitted!</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your daily report has been recorded successfully.
        </p>
      </div>

      <div className="flex flex-col w-full gap-3">
        <Link
          href={`/bowling/${projectId}`}
          className="flex items-center justify-center gap-2 w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "#0063a3" }}
        >
          <LayoutGrid size={16} />
          View Master Bowling Sheet
        </Link>

        <button
          type="button"
          onClick={onSubmitAnother}
          className="flex items-center justify-center gap-2 w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} />
          Submit another report
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function IntakePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId ?? "";

  const [tradePartners, setTradePartners] = useState<TradePartner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);

  const [step, setStep] = useState<Step>("upload");
  const [isExtracting, setIsExtracting] = useState(false);
  const [captureSource, setCaptureSource] = useState<CaptureSource | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string | null>(null);
  const [interviewMode, setInterviewMode] = useState<InterviewMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DailyFormData>(emptyForm());

  // ── Fetch trade partners from bowling API ────────────────────────────────

  useEffect(() => {
    if (!projectId) return;
    setPartnersLoading(true);
    fetch(`/api/bowling/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        const partners: TradePartner[] =
          data?.tradePartners ?? data?.rows?.map((row: { tradePartner: TradePartner }) => row.tradePartner) ?? [];
        setTradePartners(partners);
      })
      .catch(() => setTradePartners([]))
      .finally(() => setPartnersLoading(false));
  }, [projectId]);

  // ── Step 1: handle file upload → call extract API ───────────────────────

  const handleCapture = useCallback(
    async (file: File, source: CaptureSource) => {
      setCaptureSource(source);
      setIsExtracting(true);
      setExtractionFailed(false);
      setSpokenTranscript(null);

      try {
        const body = new FormData();
        body.append("file", file);
        if (projectId) body.append("projectId", projectId);

        const res = await fetch("/api/intake/extract", { method: "POST", body });
        const payload: unknown = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("extract failed");

        const extracted = unwrapExtractResponse(payload);
        const hasContent = extractedDailyHasContent(extracted);
        setSpokenTranscript(extracted.spokenTranscript ?? null);
        setFormData((current) => applyExtracted(extracted, tradePartners, current));
        setExtractionFailed(!hasContent);
        setStep("confirm");
      } catch {
        setExtractionFailed(true);
        setSpokenTranscript(null);
        setFormData((current) => emptyForm(current.tradePartnerId, current.tradePartnerName));
        setStep("confirm");
      } finally {
        setIsExtracting(false);
      }
    },
    [projectId, tradePartners],
  );

  // ── Step 2: handle confirm → call submit API ─────────────────────────────

  const startInterview = useCallback((mode: InterviewMode) => {
    const opening = openingQuestion(mode);
    primeSpeech();
    speak(opening.prompt);
    setInterviewMode(mode);
    setCaptureSource("voice");
    setExtractionFailed(false);
    setSpokenTranscript(null);
  }, []);

  const handleInterviewComplete = useCallback(
    (extracted: ExtractedDaily) => {
      setSpokenTranscript(extracted.spokenTranscript ?? null);
      setFormData((current) => applyExtracted(extracted, tradePartners, current));
      setExtractionFailed(!extractedDailyHasContent(extracted));
      setInterviewMode(null);
      setStep("confirm");
    },
    [tradePartners],
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ...formData }),
      });
      if (!res.ok) throw new Error("submit failed");
      setStep("success");
    } catch {
      // Keep user on the confirm step — they can retry
    } finally {
      setIsSubmitting(false);
    }
  }, [projectId, formData]);

  // ── Reset ────────────────────────────────────────────────────────────────

  const resetToUpload = useCallback(() => {
    setStep("upload");
    setExtractionFailed(false);
    setSpokenTranscript(null);
    setCaptureSource(null);
    setInterviewMode(null);
    setFormData(emptyForm());
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
      <TrimbleHeader projectId={projectId} />

      {/* Step indicator (hidden on success) */}
      {step !== "success" && <StepIndicator step={step} />}

      <main className="flex-1 overflow-y-auto px-4 pb-10">
        {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
        {step === "upload" && (
          <div className="max-w-lg mx-auto">
            <div className="mb-5">
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Submit Daily Report
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Let the agent ask FOG617 questions, speak the whole daily, or upload a file.
              </p>
            </div>

            {/* Trade partner quick-select (optional pre-select before upload) */}
            {!partnersLoading && tradePartners.length > 0 && (
              <div className="mb-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  Your Trade Partner (optional)
                </label>
                <select
                  value={formData.tradePartnerId}
                  onChange={(e) => {
                    const tp = tradePartners.find((t) => t.id === e.target.value);
                    setFormData((f) => ({
                      ...f,
                      tradePartnerId: e.target.value,
                      tradePartnerName: tp?.name ?? "",
                    }));
                  }}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                >
                  <option value="">— Detected from your report, or pick now —</option>
                  {tradePartners.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isExtracting ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700 px-6 py-12 text-center">
                <Loader2 size={40} className="animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {captureLoadingLabel(captureSource)}
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">This usually takes a few seconds</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviewMode ? (
                  <VoiceInterview
                    mode={interviewMode}
                    seedDraft={{
                      tradePartnerName: formData.tradePartnerName || undefined,
                    }}
                    onComplete={handleInterviewComplete}
                    onCancel={() => setInterviewMode(null)}
                  />
                ) : (
                  <>
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-5 space-y-3">
                      <div>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Speak your daily</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          The agent talks back with FOG617 questions. Pick how you want to answer.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startInterview("guided")}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white"
                        style={{ backgroundColor: "#0063a3" }}
                      >
                        <ListOrdered size={18} />
                        One question at a time
                      </button>
                      <button
                        type="button"
                        onClick={() => startInterview("dump")}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3.5 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <MessageSquare size={18} />
                        Tell the whole daily
                      </button>
                    </div>

                    <div className="flex items-center gap-3 px-1">
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">or upload</span>
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                    </div>

                    <FileUploadDropzone
                      onFileSelected={(file) => {
                        void handleCapture(file, "file");
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Confirm / edit ──────────────────────────────────────── */}
        {step === "confirm" && (
          <div className="max-w-lg mx-auto space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Review &amp; Confirm
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {extractionFailed
                  ? "Please complete the fields below."
                  : "AI has pre-filled the fields — review and edit anything before submitting."}
              </p>
            </div>

            {extractionFailed && <ExtractionWarningBanner source={captureSource} />}

            {spokenTranscript && <SpokenTranscriptCard transcript={spokenTranscript} />}

            <DailyConfirmCard
              tradePartners={tradePartners}
              initialData={formData}
              data={formData}
              onChange={setFormData}
              onCancel={resetToUpload}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* ── Step 3: Success ─────────────────────────────────────────────── */}
        {step === "success" && (
          <div className="max-w-lg mx-auto">
            <SuccessCard projectId={projectId} onSubmitAnother={resetToUpload} />
          </div>
        )}
      </main>
    </div>
  );
}
