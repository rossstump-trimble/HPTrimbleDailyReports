"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileEdit,
  FileSpreadsheet,
  ListOrdered,
  Loader2,
  Mic,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import FileUploadDropzone from "@/components/intake/FileUploadDropzone";
import VoiceInterview from "@/components/intake/VoiceInterview";
import FreeformVoiceCapture from "@/components/intake/FreeformVoiceCapture";
import DailyConfirmCard, { type DailyFormData } from "@/components/intake/DailyConfirmCard";
import SourceReview from "@/components/intake/SourceReview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExtractedDaily, SourcePageText } from "@/lib/extract-response";
import { extractedDailyHasContent, unwrapExtractResponse } from "@/lib/extract-response";
import {
  DEFAULT_DESTINATION,
  DESTINATION_COOKIE,
  destinationFromCookieWithFallback,
  type ProjectSightDestination,
} from "@/lib/projectsight/destination";
import {
  type InterviewMode,
} from "@/lib/fog617-interview";
import { primeSpeech } from "@/lib/speak";
import type { TradePartner } from "@/types/hpproto";
import { resolveTradePartner } from "@/lib/trade-partner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "upload" | "sta" | "confirm" | "success";
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
    tierSubcontractors: [],
    tierSubsSummary: "",
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
  delete fields.sourcePages;
  const resolved = resolveTradePartner(
    fields.tradePartnerName,
    partners,
    current.tradePartnerId
      ? { id: current.tradePartnerId, name: current.tradePartnerName }
      : undefined,
  );

  return {
    ...emptyForm(resolved.tradePartnerId, resolved.tradePartnerName),
    ...fields,
    ...resolved,
    date: fields.date ?? todayISO(),
    emailRecipients: fields.emailRecipients ?? current.emailRecipients,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrimbleHeader({
  projectId,
  projectName,
  tidReady,
}: {
  projectId: string;
  projectName?: string;
  tidReady?: boolean;
}) {
  return (
    <header
      className="flex items-center gap-3 px-4 py-3 flex-none"
      style={{ backgroundColor: "#1b3a5c" }}
    >
      {tidReady && (
        <Link
          href="/projects"
          className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition px-3 py-1.5 text-xs font-semibold text-white mr-1"
          aria-label="Back to Main Menu"
        >
          <ArrowLeft size={16} />
          <span>Main Menu</span>
        </Link>
      )}

      <div className="flex items-center gap-2.5 min-w-0">
        <Image
          src="/trimble-logo.png"
          alt="Trimble"
          width={130}
          height={28}
          priority
          className="h-6 w-auto object-contain"
          style={{ mixBlendMode: "screen" }}
        />
        <span className="text-white/40 text-sm font-light">|</span>
        <span className="text-white text-sm font-semibold truncate">
          {projectName || "Daily Intake"}
        </span>
      </div>

      <div className="flex-1" />
    </header>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "1. Capture" },
    { key: "sta", label: "2. STA Photo" },
    { key: "confirm", label: "3. Review & Edit" },
    { key: "success", label: "4. Submitted" },
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
                  ? "text-[#0063a3] dark:text-blue-400 font-semibold"
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
      return "Analyzing report with AI…";
    case null:
      return "Processing daily report…";
  }
}

function ExtractionWarningBanner({ source }: { source: CaptureSource | null }) {
  const msg =
    source === "file"
      ? "We couldn’t pull every field from that file. Please check the form below and fill in anything missing."
      : "We had trouble extracting details from the audio. Please check the form and fill in any blanks.";
  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
      <AlertTriangle size={16} className="text-amber-600 flex-none mt-0.5" />
      <div>
        <p className="font-semibold">Review your report</p>
        <p className="mt-0.5">{msg}</p>
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

function SuccessCard({
  company,
  date,
  tidReady,
  onSubmitAnother,
}: {
  company?: string;
  date?: string;
  tidReady?: boolean;
  onSubmitAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 size={44} className="text-green-600 dark:text-green-400" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Daily Report Submitted</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-md">
          {company ? `Report for ${company}` : "Your daily report"} {date ? `on ${date}` : ""} has been received and queued for superintendent review and ProjectSight approval.
        </p>
      </div>

      <div className="flex flex-col w-full gap-3 max-w-sm">
        <button
          type="button"
          onClick={onSubmitAnother}
          className="flex items-center justify-center gap-2 w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "#0063a3" }}
        >
          <Plus size={16} />
          Submit Another Report
        </button>

        {tidReady && (
          <Link
            href="/projects"
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Main Menu
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function IntakePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId ?? "";

  const [projectName, setProjectName] = useState<string>("Hensel Phelps Demo Project");
  const [projectCode, setProjectCode] = useState<string>("");
  const [tradePartners, setTradePartners] = useState<TradePartner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);

  const [step, setStep] = useState<Step>("upload");
  const [activeTab, setActiveTab] = useState<"stream" | "interview" | "file" | "form">("stream");
  const [isExtracting, setIsExtracting] = useState(false);
  const [captureSource, setCaptureSource] = useState<CaptureSource | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string | null>(null);
  const [sourcePages, setSourcePages] = useState<SourcePageText[]>([]);
  const [interviewMode, setInterviewMode] = useState<InterviewMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DailyFormData>(emptyForm());
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [staFiles, setStaFiles] = useState<File[]>([]);
  const [tidReady, setTidReady] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [capacity, setCapacity] = useState<{ total: number; max: number; isLocked: boolean }>({
    total: 0,
    max: 2000,
    isLocked: false,
  });

  // ── Fetch project details, trade partners & capacity ─────────────────────────

  useEffect(() => {
    if (!projectId) return;
    setPartnersLoading(true);

    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.project?.name) setProjectName(data.project.name);
        if (data?.project?.code) setProjectCode(data.project.code);
        if (Array.isArray(data?.project?.tradePartners)) {
          setTradePartners(data.project.tradePartners);
        }
        if (data?.capacity) {
          setCapacity(data.capacity);
        }
      })
      .catch(() => {})
      .finally(() => setPartnersLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((body: { authenticated?: boolean }) => {
        setTidReady(Boolean(body?.authenticated));
      })
      .catch(() => setTidReady(false));
  }, []);

  // ── File upload ─────────────────────────────────────────────────────────────

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setSourceFiles(files);
      setSourceFile(files[0]);
      setCaptureSource("file");
      setIsExtracting(true);
      setExtractionFailed(false);
      setSpokenTranscript(null);
      setSourcePages([]);

      try {
        const body = new FormData();
        for (const f of files) {
          body.append("files", f);
        }
        body.append("file", files[0]);
        if (formData.tradePartnerName) {
          body.append("company", formData.tradePartnerName);
        }

        const res = await fetch("/api/intake/extract", {
          method: "POST",
          body,
        });

        const raw = await res.json();
        const extracted = unwrapExtractResponse(raw);
        const pages = extracted.sourcePages ?? [];
        setSourcePages(pages);

        if (extracted && extractedDailyHasContent(extracted)) {
          setFormData((prev) => applyExtracted(extracted, tradePartners, prev));
        } else {
          setExtractionFailed(true);
        }
      } catch (err) {
        console.error("[intake] extract failed", err);
        setExtractionFailed(true);
      } finally {
        setIsExtracting(false);
        setStep("sta");
      }
    },
    [formData.tradePartnerName, tradePartners],
  );

  const handleFileDrop = useCallback(
    async (file: File) => {
      await handleFilesSelected([file]);
    },
    [handleFilesSelected],
  );

  // ── Voice interview ─────────────────────────────────────────────────────────

  const startInterview = useCallback((mode: InterviewMode) => {
    primeSpeech();
    setInterviewMode(mode);
    setCaptureSource("voice");
    setExtractionFailed(false);
    setSpokenTranscript(null);
    setSourcePages([]);
  }, []);

  const handleInterviewComplete = useCallback(
    (extracted: ExtractedDaily) => {
      setInterviewMode(null);
      const transcript = extracted.spokenTranscript || "";
      setSpokenTranscript(transcript || null);

      if (extracted && extractedDailyHasContent(extracted)) {
        setFormData((prev) => applyExtracted(extracted, tradePartners, prev));
      } else {
        setExtractionFailed(true);
        if (transcript) {
          setFormData((prev) => ({
            ...prev,
            notes: transcript,
          }));
        }
      }

      setStep("sta");
    },
    [tradePartners],
  );

  const handleFreeformSubmitted = useCallback(
    async (transcriptText: string, audioFile?: File) => {
      setCaptureSource("voice");
      setIsExtracting(true);
      setExtractionFailed(false);
      setSpokenTranscript(transcriptText || null);
      setSourcePages([]);

      try {
        const body = new FormData();
        if (audioFile) {
          body.append("file", audioFile);
        } else if (transcriptText) {
          body.append("transcript", transcriptText);
        }
        if (formData.tradePartnerName) {
          body.append("company", formData.tradePartnerName);
        }

        const res = await fetch("/api/intake/extract", {
          method: "POST",
          body,
        });

        const raw = await res.json();
        const extracted = unwrapExtractResponse(raw);
        if (extracted && extractedDailyHasContent(extracted)) {
          setFormData((prev) => applyExtracted(extracted, tradePartners, prev));
        } else {
          setExtractionFailed(true);
          if (transcriptText) {
            setFormData((prev) => ({
              ...prev,
              notes: transcriptText,
            }));
          }
        }
      } catch (err) {
        console.error("[freeform extract failed]", err);
        setExtractionFailed(true);
        if (transcriptText) {
          setFormData((prev) => ({
            ...prev,
            notes: transcriptText,
          }));
        }
      } finally {
        setIsExtracting(false);
        setStep("sta");
      }
    },
    [formData.tradePartnerName, tradePartners],
  );

  // ── Submit Daily Report (Queues for review) ──────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const body = new FormData();
      body.append(
        "daily",
        JSON.stringify({
          projectId,
          ...formData,
          staCompleted: formData.staCompleted || staFiles.length > 0,
        }),
      );
      if (sourceFiles.length > 0) {
        for (const f of sourceFiles) {
          body.append("files", f);
        }
      } else if (sourceFile) {
        body.append("file", sourceFile);
      }
      if (staFiles.length > 0) {
        for (const f of staFiles) {
          body.append("staFiles", f);
        }
      }
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        body,
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Could not submit daily report.");
      }
      setStep("success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit daily report.");
    } finally {
      setIsSubmitting(false);
    }
  }, [projectId, formData, sourceFiles, sourceFile, staFiles]);

  // ── Reset ────────────────────────────────────────────────────────────────

  const resetToUpload = useCallback(() => {
    setStep("upload");
    setExtractionFailed(false);
    setSpokenTranscript(null);
    setCaptureSource(null);
    setInterviewMode(null);
    setFormData(emptyForm());
    setSourceFiles([]);
    setSourceFile(null);
    setStaFiles([]);
    setSourcePages([]);
    setSubmitError(null);
  }, []);

  const showSourceTab =
    captureSource === "file" && (sourceFiles.length > 0 || sourceFile != null || sourcePages.length > 0);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasInvalidEmail = formData.emailRecipients.some(
    (e) => e.trim().length > 0 && !emailRegex.test(e.trim()),
  );

  const confirmCard = (
    <DailyConfirmCard
      tradePartners={tradePartners}
      initialData={formData}
      data={formData}
      onChange={setFormData}
      onCancel={resetToUpload}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitDisabled={
        capacity.isLocked ||
        !formData.date ||
        !formData.tradePartnerName.trim() ||
        hasInvalidEmail
      }
      submitLabel="Submit Daily Report"
      attachedFiles={sourceFiles}
      onAttachedFilesChange={setSourceFiles}
      staFiles={staFiles}
      onStaFilesChange={setStaFiles}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground">
      <TrimbleHeader projectId={projectId} projectName={projectName} tidReady={tidReady} />

      {/* Step indicator */}
      {step !== "success" && <StepIndicator step={step} />}

      <main className="flex-1 overflow-y-auto px-4 pb-12">
        {/* Capacity Lockout Warning */}
        {capacity.isLocked && (
          <div className="max-w-lg mx-auto mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-amber-800 dark:text-amber-300">
              <p className="font-semibold">
                Daily Report Submissions Temporarily Locked
              </p>
              <p>
                The submission capacity limit has been reached. New submissions are temporarily paused.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 1: Capture Modes ───────────────────────────────────────── */}
        {step === "upload" && (
          <div className="max-w-lg mx-auto space-y-4">
            {/* Back to main menu ONLY for logged in TID users */}
            {tidReady && (
              <div>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0063a3] dark:text-blue-400 hover:underline mb-1 transition"
                >
                  <ArrowLeft size={14} />
                  Back to Main Menu
                </Link>
              </div>
            )}

            {/* Project Name Card */}
            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#0063a3] dark:text-blue-400 shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">
                  Project
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate block">
                  {projectName}
                </span>
              </div>
              {projectCode && (
                <Badge variant="outline" className="font-mono text-xs font-semibold">
                  {projectCode}
                </Badge>
              )}
            </div>

            {/* Company name & required email selection */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 space-y-3 shadow-sm">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Your Trade Company <span className="text-red-500">*</span>
                </label>

                {!partnersLoading && tradePartners.length > 0 && tradePartners.length <= 200 && (
                  <select
                    value={
                      tradePartners.some((tp) => tp.id === formData.tradePartnerId)
                        ? formData.tradePartnerId
                        : ""
                    }
                    onChange={(e) => {
                      const tp = tradePartners.find((t) => t.id === e.target.value);
                      setFormData((f) => ({
                        ...f,
                        tradePartnerId: e.target.value,
                        tradePartnerName: tp?.name ?? f.tradePartnerName,
                        emailRecipients:
                          f.emailRecipients.length === 0 && tp?.contactEmail
                            ? [tp.contactEmail]
                            : f.emailRecipients,
                      }));
                    }}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  >
                    <option value="">— Select your trade contractor —</option>
                    {tradePartners.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.name} ({tp.category || "Trade"})
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  value={formData.tradePartnerName}
                  onChange={(e) => {
                    const resolved = resolveTradePartner(e.target.value, tradePartners);
                    setFormData((f) => ({ ...f, ...resolved }));
                  }}
                  placeholder="Or type company name"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Your Email Address <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.emailRecipients[0] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const rest = formData.emailRecipients.slice(1);
                    setFormData((f) => ({
                      ...f,
                      emailRecipients: val.trim() ? [val.trim(), ...rest] : rest,
                    }));
                  }}
                  placeholder="e.g. foreman@trade.com"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>
            </div>

            {/* Active Extraction Loader */}
            {isExtracting ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700 px-6 py-12 text-center">
                <Loader2 size={40} className="animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {captureLoadingLabel(captureSource)}
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">This usually takes a few seconds</p>
              </div>
            ) : interviewMode ? (
              <VoiceInterview
                mode={interviewMode}
                seedDraft={{
                  tradePartnerName: formData.tradePartnerName || undefined,
                }}
                onComplete={handleInterviewComplete}
                onCancel={() => setInterviewMode(null)}
              />
            ) : (
              /* ── 4 Mode Tabs: Speak Freely -> Guided Q&A -> Photo/File -> Form Entry ── */
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2.5">
                    <ClipboardCheck className="h-5 w-5 text-[#0063a3] dark:text-blue-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        Have a Printed Inspection Checklist?
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Scan physical inspection sheets directly to ProjectSight.
                      </div>
                    </div>
                  </div>
                  <Link href={`/projects/${projectId}/inspections`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 shrink-0">
                      <Camera className="h-3.5 w-3.5" /> Scan Sheet
                    </Button>
                  </Link>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={(val) => {
                    setActiveTab(val as "stream" | "interview" | "file" | "form");
                    setInterviewMode(null);
                  }}
                  className="w-full"
                >
                <TabsList className="grid h-12 w-full grid-cols-4 rounded-2xl bg-gray-200/70 dark:bg-gray-800 p-1">
                  <TabsTrigger
                    value="stream"
                    className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#0063a3] dark:data-[state=active]:bg-gray-900 shadow-sm"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Speak Freely</span>
                    <span className="sm:hidden">Speak</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="interview"
                    className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#0063a3] dark:data-[state=active]:bg-gray-900 shadow-sm"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Guided Q&amp;A</span>
                    <span className="sm:hidden">Guided</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="file"
                    className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#0063a3] dark:data-[state=active]:bg-gray-900 shadow-sm"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Photo / File</span>
                    <span className="sm:hidden">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="form"
                    className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-[#0063a3] dark:data-[state=active]:bg-gray-900 shadow-sm"
                  >
                    <FileEdit className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Form Entry</span>
                    <span className="sm:hidden">Form</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Speak Freely (Without Prompts) */}
                <TabsContent value="stream" className="mt-3">
                  <FreeformVoiceCapture
                    isProcessing={isExtracting}
                    onTranscriptSubmitted={handleFreeformSubmitted}
                  />
                </TabsContent>

                {/* Tab 2: Guided Interview */}
                <TabsContent value="interview" className="mt-3">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4 shadow-sm text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#0063a3] dark:text-blue-400 mx-auto">
                      <ListOrdered className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        Guided Daily Q&amp;A
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                        Quick 4-step voice interview: 1) Date &amp; work completed, 2) Crew &amp; hours, 3) Tier subcontractors, 4) Equipment, delays &amp; safety STA.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => startInterview("guided")}
                      className="w-full text-white font-semibold gap-2 h-11 rounded-xl"
                      style={{ backgroundColor: "#0063a3" }}
                    >
                      <Sparkles className="h-4 w-4" />
                      Start Guided Interview
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab 3: Photo & File Upload */}
                <TabsContent value="file" className="mt-3">
                  <div className="space-y-2">
                    <FileUploadDropzone
                      onFilesSelected={handleFilesSelected}
                      onFileSelected={handleFileDrop}
                      isLoading={isExtracting}
                    />
                  </div>
                </TabsContent>

                {/* Tab 4: Form Entry (Direct typing) */}
                <TabsContent value="form" className="mt-3 space-y-4">
                  {confirmCard}
                </TabsContent>
              </Tabs>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: STA Photo Capture ──────────────────────────────────── */}
        {step === "sta" && (
          <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Safety Task Analysis (STA) Photos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please take a photo or attach your signed daily STA safety briefing form. It will be attached directly to your ProjectSight daily report.
              </p>
            </div>

            {/* Photo Capture / Upload Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0063a3] hover:bg-blue-700 text-white font-semibold cursor-pointer transition text-sm">
                <Camera size={18} />
                <span>Take Photo of STA</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setStaFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </label>

              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold cursor-pointer transition text-sm">
                <UploadCloud size={18} />
                <span>Upload File/PDF</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setStaFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </label>
            </div>

            {/* Gallery of captured STAs */}
            {staFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Captured STA Forms ({staFiles.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {staFiles.map((file, i) => (
                    <div
                      key={i}
                      className="relative group rounded-xl border border-gray-200 dark:border-gray-700 p-2.5 flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800"
                    >
                      <span className="truncate max-w-[140px] font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setStaFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        aria-label="Remove STA photo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, staCompleted: staFiles.length > 0 }));
                  setStep("confirm");
                }}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white transition text-sm"
                style={{ backgroundColor: "#0063a3" }}
              >
                {staFiles.length > 0 ? "Continue to Review" : "Continue"}
              </button>

              {staFiles.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, staCompleted: false }));
                    setStep("confirm");
                  }}
                  className="w-full py-2 text-xs text-amber-600 dark:text-amber-400 hover:underline transition"
                >
                  Skip STA for now (Flags report as missing STA)
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm & Edit ──────────────────────────────────────── */}
        {step === "confirm" && (
          <div className={`${showSourceTab ? "max-w-5xl" : "max-w-lg"} mx-auto space-y-4`}>
            <div>
              {tidReady && (
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0063a3] dark:text-blue-400 hover:underline mb-2 transition"
                >
                  <ArrowLeft size={14} />
                  Back to Main Menu
                </Link>
              )}
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Review &amp; Edit Daily Report
              </h1>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Inspect every field below, adjust any quantities or notes, and submit.
              </p>
            </div>

            {extractionFailed && <ExtractionWarningBanner source={captureSource} />}

            {showSourceTab ? (
              <Tabs defaultValue="form" className="w-full">
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-gray-200 dark:bg-gray-800 p-1">
                  <TabsTrigger
                    value="form"
                    className="rounded-lg border-b-0 data-[state=active]:bg-white data-[state=active]:text-[#0063a3] dark:data-[state=active]:bg-gray-900"
                  >
                    Form
                  </TabsTrigger>
                  <TabsTrigger
                    value="source"
                    className="rounded-lg border-b-0 data-[state=active]:bg-white data-[state=active]:text-[#0063a3] dark:data-[state=active]:bg-gray-900"
                  >
                    Source &amp; OCR
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="form" className="space-y-4 mt-4">
                  {confirmCard}
                </TabsContent>
                <TabsContent value="source" className="mt-4">
                  <SourceReview file={sourceFile} files={sourceFiles} pages={sourcePages} />
                </TabsContent>
              </Tabs>
            ) : (
              <>
                {spokenTranscript && <SpokenTranscriptCard transcript={spokenTranscript} />}
                {confirmCard}
              </>
            )}
          </div>
        )}

        {/* ── Step 3: Success ─────────────────────────────────────────────── */}
        {step === "success" && (
          <div className="max-w-lg mx-auto">
            <SuccessCard
              company={formData.tradePartnerName}
              date={formData.date}
              tidReady={tidReady}
              onSubmitAnother={resetToUpload}
            />
          </div>
        )}
      </main>
    </div>
  );
}
