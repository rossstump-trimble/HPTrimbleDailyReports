"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  FileEdit,
  Handshake,
  ListOrdered,
  Loader2,
  Mic,
  Plus,
  Sparkles,
  UserCheck,
} from "lucide-react";
import FileUploadDropzone from "@/components/intake/FileUploadDropzone";
import VoiceInterview from "@/components/intake/VoiceInterview";
import FreeformVoiceCapture from "@/components/intake/FreeformVoiceCapture";
import HpDailyConfirmCard from "@/components/intake/HpDailyConfirmCard";
import type { DailyFormData } from "@/components/intake/DailyConfirmCard";
import SourceReview from "@/components/intake/SourceReview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExtractedDaily, SourcePageText } from "@/lib/extract-response";
import { extractedDailyHasContent, unwrapExtractResponse } from "@/lib/extract-response";
import { type InterviewMode } from "@/lib/fog617-interview";
import { primeSpeech } from "@/lib/speak";
import type { TradePartner } from "@/types/hpproto";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

const HP_TRADE_PARTNERS: TradePartner[] = [
  {
    id: "hensel-phelps",
    name: "Hensel Phelps",
    category: "General Contractor",
  },
];

function emptyHpForm(employeeName = "", employeeRole = ""): DailyFormData {
  const submitter = [employeeName.trim(), employeeRole.trim()].filter(Boolean).join(" - ");
  return {
    tradePartnerId: "hensel-phelps",
    tradePartnerName: "Hensel Phelps",
    submittedBy: submitter || "HP Field Staff",
    date: todayISO(),
    locationDescription: "",
    workerCount: 0,
    totalHours: 0,
    crewBreakdown: [],
    tierSubcontractors: [],
    tierSubsSummary: "",
    equipment: [],
    tradesAndFavors: "",
    isHpEmployee: true,
    notes: "",
    staCompleted: true,
    emailRecipients: [],
  };
}

function applyHpExtracted(
  extracted: ExtractedDaily,
  current: DailyFormData,
): DailyFormData {
  const fields = { ...extracted };
  delete fields.spokenTranscript;
  delete fields.sourcePages;

  return {
    ...current,
    ...fields,
    tradePartnerId: "hensel-phelps",
    tradePartnerName: "Hensel Phelps",
    isHpEmployee: true,
    workerCount: 0,
    totalHours: 0,
    crewBreakdown: [],
    staCompleted: true,
    date: fields.date ?? current.date ?? todayISO(),
    tradesAndFavors: fields.tradesAndFavors ?? current.tradesAndFavors ?? "",
    notes: fields.notes ?? current.notes ?? "",
    emailRecipients: fields.emailRecipients ?? current.emailRecipients,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExtractionWarningBanner({ source }: { source: "file" | "voice" | null }) {
  const msg =
    source === "file"
      ? "We couldn't pull every field from that file. Please review below and fill in any blanks."
      : "We had trouble extracting some details. Please check the summary below and fill in anything missing.";
  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
      <AlertTriangle size={16} className="text-amber-600 flex-none mt-0.5" />
      <div>
        <p className="font-semibold">Review your HP daily report</p>
        <p className="mt-0.5">{msg}</p>
      </div>
    </div>
  );
}

function SpokenTranscriptCard({ transcript }: { transcript: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400">Recorded Audio Transcript</h3>
        <Badge variant="outline" className="text-[10px]">Speech-to-Text</Badge>
      </div>
      <p className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{transcript}</p>
    </div>
  );
}

function SuccessCard({
  submitter,
  date,
  tidReady,
  onSubmitAnother,
}: {
  submitter?: string;
  date?: string;
  tidReady?: boolean;
  onSubmitAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
        <CheckCircle2 size={44} className="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Badge className="bg-emerald-600 text-white font-bold text-xs">Direct ProjectSight Dispatch</Badge>
          <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
            Auto-Approved
          </Badge>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">HP Staff Daily Log Synced</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-md">
          {submitter ? `Report from ${submitter}` : "Your HP employee daily log"} {date ? `for ${date}` : ""} has been saved and dispatched directly to ProjectSight. No approval required.
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
          Submit Another HP Report
        </button>

        {tidReady && (
          <Link
            href="/projects"
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Projects Menu
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function HpIntakePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId ?? "";

  const [projectName, setProjectName] = useState<string>("Hensel Phelps Project");
  const [projectCode, setProjectCode] = useState<string>("");
  const [step, setStep] = useState<"upload" | "confirm" | "success">("upload");
  const [activeTab, setActiveTab] = useState<"stream" | "interview" | "form" | "file">("stream");
  const [isExtracting, setIsExtracting] = useState(false);
  const [captureSource, setCaptureSource] = useState<"file" | "voice" | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string | null>(null);
  const [sourcePages, setSourcePages] = useState<SourcePageText[]>([]);
  const [interviewMode, setInterviewMode] = useState<InterviewMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HP Employee details
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("Superintendent");
  const [formData, setFormData] = useState<DailyFormData>(emptyHpForm());
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tidReady, setTidReady] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.project?.name) setProjectName(data.project.name);
        if (data?.project?.code) setProjectCode(data.project.code);
      })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    try {
      const savedRole = window.localStorage.getItem("hp_staff_role");
      if (savedRole) setEmployeeRole(savedRole);
      const savedName = window.localStorage.getItem("hp_staff_name");
      if (savedName) setEmployeeName(savedName);
    } catch {
      // ignore storage errors
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((body: { authenticated?: boolean; user?: { name?: string; email?: string } }) => {
        setTidReady(Boolean(body?.authenticated));
        if (body?.user?.name && body.user.name !== "Local Developer") {
          setEmployeeName((prev) => prev || body.user!.name!);
        } else if (body?.user?.email && !body.user.email.startsWith("local@")) {
          const emailPrefix = body.user.email.split("@")[0].replace(/[._-]+/g, " ");
          setEmployeeName((prev) => prev || emailPrefix);
        }
      })
      .catch(() => setTidReady(false));
  }, []);

  // Sync employee info into form data
  useEffect(() => {
    const submitter = [employeeName.trim(), employeeRole.trim()].filter(Boolean).join(" - ");
    setFormData((prev) => ({
      ...prev,
      submittedBy: submitter || "HP Field Staff",
      tradePartnerId: "hensel-phelps",
      tradePartnerName: "Hensel Phelps",
      isHpEmployee: true,
      workerCount: 0,
      totalHours: 0,
      crewBreakdown: [],
      staCompleted: true,
    }));
  }, [employeeName, employeeRole]);

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
        body.append("company", "Hensel Phelps");

        const res = await fetch("/api/intake/extract", {
          method: "POST",
          body,
        });

        const raw = await res.json();
        const extracted = unwrapExtractResponse(raw);
        const pages = extracted.sourcePages ?? [];
        setSourcePages(pages);

        if (extracted && extractedDailyHasContent(extracted)) {
          setFormData((prev) => applyHpExtracted(extracted, prev));
        } else {
          setExtractionFailed(true);
        }
      } catch (err) {
        console.error("[hp-intake] extract failed", err);
        setExtractionFailed(true);
      } finally {
        setIsExtracting(false);
        setStep("confirm");
      }
    },
    [],
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
        setFormData((prev) => applyHpExtracted(extracted, prev));
      } else {
        setExtractionFailed(true);
        if (transcript) {
          setFormData((prev) => ({
            ...prev,
            notes: transcript,
          }));
        }
      }

      setStep("confirm");
    },
    [],
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
        body.append("company", "Hensel Phelps");

        const res = await fetch("/api/intake/extract", {
          method: "POST",
          body,
        });

        const raw = await res.json();
        const extracted = unwrapExtractResponse(raw);
        if (extracted && extractedDailyHasContent(extracted)) {
          setFormData((prev) => applyHpExtracted(extracted, prev));
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
        console.error("[hp freeform extract failed]", err);
        setExtractionFailed(true);
        if (transcriptText) {
          setFormData((prev) => ({
            ...prev,
            notes: transcriptText,
          }));
        }
      } finally {
        setIsExtracting(false);
        setStep("confirm");
      }
    },
    [],
  );

  // ── Submit Daily Report ─────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const submitter = [employeeName.trim(), employeeRole.trim()].filter(Boolean).join(" - ");
      const body = new FormData();
      body.append(
        "daily",
        JSON.stringify({
          projectId,
          ...formData,
          tradePartnerId: "hensel-phelps",
          tradePartnerName: "Hensel Phelps",
          submittedBy: submitter || formData.submittedBy || "HP Field Staff",
          isHpEmployee: true,
          workerCount: 0,
          totalHours: 0,
          crewBreakdown: [],
          staCompleted: true,
        }),
      );
      if (sourceFiles.length > 0) {
        for (const f of sourceFiles) {
          body.append("files", f);
        }
      } else if (sourceFile) {
        body.append("file", sourceFile);
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
  }, [projectId, formData, employeeName, employeeRole, sourceFiles, sourceFile]);

  const resetToUpload = useCallback(() => {
    setStep("upload");
    setFormData(emptyHpForm(employeeName, employeeRole));
    setSourceFiles([]);
    setSourceFile(null);
    setCaptureSource(null);
    setExtractionFailed(false);
    setSpokenTranscript(null);
    setSourcePages([]);
    setInterviewMode(null);
    setSubmitError(null);
  }, [employeeName, employeeRole]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
      {/* Header bar */}
      <header className="w-full bg-[#0063a3] text-white px-4 py-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-black text-sm tracking-wider border border-white/20">
            HP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold leading-tight">Hensel Phelps Staff Daily Log</h1>
              <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-400 text-[10px] font-bold px-1.5 py-0 border-0">
                HP STAFF
              </Badge>
            </div>
            <p className="text-xs text-blue-100/90 leading-tight">
              {projectName} {projectCode ? `(${projectCode})` : ""}
            </p>
          </div>
        </div>

        {tidReady && (
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-xs text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl px-3 py-1.5 transition-colors font-semibold"
          >
            <ArrowLeft size={14} />
            <span>App</span>
          </Link>
        )}
      </header>

      {/* Main card container */}
      <main className="w-full max-w-2xl px-4 py-6 flex-1 flex flex-col">
        {step === "upload" && !interviewMode && (
          <div className="space-y-5">
            {/* Employee ID and Role Card */}
            <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#0063a3] dark:text-blue-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#0063a3] dark:text-blue-400">
                  HP Staff Submitter Details
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => {
                      setEmployeeName(e.target.value);
                      try {
                        window.localStorage.setItem("hp_staff_name", e.target.value);
                      } catch {}
                    }}
                    placeholder="e.g. Ross Stump"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Your Role / Title
                  </label>
                  <select
                    value={employeeRole}
                    onChange={(e) => {
                      setEmployeeRole(e.target.value);
                      try {
                        window.localStorage.setItem("hp_staff_role", e.target.value);
                      } catch {}
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Superintendent">Superintendent</option>
                    <option value="Lead Superintendent">Lead Superintendent</option>
                    <option value="Project Engineer">Project Engineer</option>
                    <option value="Field Engineer">Field Engineer</option>
                    <option value="Safety Manager">Safety Manager</option>
                    <option value="Quality Manager">Quality Manager</option>
                    <option value="Project Manager">Project Manager</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Intake mode tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "stream" | "interview" | "form" | "file")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 w-full h-12 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80">
                <TabsTrigger
                  value="stream"
                  className="rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold data-[state=active]:bg-[#0063a3] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <Mic size={15} />
                  <span>Speak Freely</span>
                </TabsTrigger>
                <TabsTrigger
                  value="interview"
                  className="rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold data-[state=active]:bg-[#0063a3] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <ListOrdered size={15} />
                  <span>Guided (3 Qs)</span>
                </TabsTrigger>
                <TabsTrigger
                  value="form"
                  className="rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold data-[state=active]:bg-[#0063a3] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <FileEdit size={15} />
                  <span>Direct Form</span>
                </TabsTrigger>
                <TabsTrigger
                  value="file"
                  className="rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold data-[state=active]:bg-[#0063a3] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <Camera size={15} />
                  <span>Photos / Docs</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Speak Freely */}
              <TabsContent value="stream" className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#0063a3] dark:text-blue-400" />
                      Speak Freely & Log Daily Report
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Tap the microphone and talk naturally. Tell us what areas you walked, progress observed, trades and favors done for partners, equipment loaned, safety observations, and delays.
                    </p>
                  </div>

                  <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <Handshake className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Trade Favors & Accommodations:</span> Remember to mention any favors, staging help, or equipment loaned to trade partners today.
                    </div>
                  </div>

                  <FreeformVoiceCapture
                    isProcessing={isExtracting}
                    onTranscriptSubmitted={(transcriptText, audioFile) =>
                      handleFreeformSubmitted(transcriptText, audioFile)
                    }
                  />

                  {isExtracting && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-[#0063a3] dark:text-blue-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extracting report, notes & trade favors...
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 2: Guided Interview (3 Questions) */}
              <TabsContent value="interview" className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <ListOrdered className="h-4 w-4 text-[#0063a3] dark:text-blue-400" />
                        Quick Guided Q&A (3 Short Questions)
                      </h2>
                      <Badge variant="outline" className="text-[11px] font-bold text-[#0063a3] border-blue-300">
                        HP Staff Mode
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Answer 3 targeted prompts: 1) Jobsite overview, 2) Trades & favors done for partners, 3) Delays & safety notes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-[#0063a3] dark:text-blue-300 flex items-center justify-center font-bold text-[11px]">
                        1
                      </span>
                      <span>Date &amp; jobsite walk inspection overview</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                      <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-[11px]">
                        2
                      </span>
                      <span className="font-semibold">Trades and favors done for trade partners</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-[#0063a3] dark:text-blue-300 flex items-center justify-center font-bold text-[11px]">
                        3
                      </span>
                      <span>Subcontractor delays, safety observations, or field notes</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => startInterview("guided")}
                    className="w-full h-12 rounded-xl text-sm font-bold bg-[#0063a3] hover:bg-[#004e82] text-white shadow-sm flex items-center justify-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Start 3-Question Interview
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 3: Direct Form Entry */}
              <TabsContent value="form" className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <FileEdit className="h-4 w-4 text-[#0063a3] dark:text-blue-400" />
                      Direct Entry Form
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Fill out the form manually or use speech-to-text dictation on each field.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      setCaptureSource(null);
                      setStep("confirm");
                    }}
                    className="w-full h-12 rounded-xl text-sm font-bold bg-[#0063a3] hover:bg-[#004e82] text-white shadow-sm flex items-center justify-center gap-2"
                  >
                    Open Full Form
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 4: Upload / Photos */}
              <TabsContent value="file" className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Camera className="h-4 w-4 text-[#0063a3] dark:text-blue-400" />
                      Attach Photos or Documents
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Take multiple photos of jobsite daily logs, whiteboard schedules, or field notes. Vision AI extracts fields automatically.
                    </p>
                  </div>

                  <FileUploadDropzone
                    onFilesSelected={handleFilesSelected}
                    isLoading={isExtracting}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Guided Interview active flow */}
        {step === "upload" && interviewMode && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-[#0063a3] text-white text-xs">
                HP Staff Guided Q&A
              </Badge>
              <button
                type="button"
                onClick={() => setInterviewMode(null)}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Cancel Interview
              </button>
            </div>
            <VoiceInterview
              mode={interviewMode}
              audience="hp"
              seedDraft={formData}
              onComplete={handleInterviewComplete}
              onCancel={() => setInterviewMode(null)}
            />
          </div>
        )}

        {/* Confirmation & Editing step */}
        {step === "confirm" && (
          <div className="space-y-4">
            {extractionFailed && <ExtractionWarningBanner source={captureSource} />}

            {spokenTranscript && <SpokenTranscriptCard transcript={spokenTranscript} />}

            {sourceFiles.length > 0 && (
              <SourceReview
                files={sourceFiles}
                file={sourceFiles[0]}
                pages={sourcePages}
              />
            )}

            {submitError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                {submitError}
              </div>
            )}

            <HpDailyConfirmCard
              data={formData}
              onChange={setFormData}
              onCancel={resetToUpload}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              attachedFiles={sourceFiles}
              onAttachedFilesChange={setSourceFiles}
            />
          </div>
        )}

        {/* Success screen */}
        {step === "success" && (
          <SuccessCard
            submitter={formData.submittedBy}
            date={formData.date}
            tidReady={tidReady}
            onSubmitAnother={resetToUpload}
          />
        )}
      </main>
    </div>
  );
}
