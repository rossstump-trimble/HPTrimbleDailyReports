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
  Plus,
} from "lucide-react";
import FileUploadDropzone from "@/components/intake/FileUploadDropzone";
import DailyConfirmCard, { type DailyFormData } from "@/components/intake/DailyConfirmCard";
import type { TradePartner } from "@/types/hpproto";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "upload" | "confirm" | "success";

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
    { key: "upload", label: "Upload" },
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

function ExtractionWarningBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 px-4 py-3">
      <AlertTriangle size={18} className="text-amber-500 flex-none mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          AI extraction unavailable
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          We could not parse your file automatically. Please fill in the details below manually.
        </p>
      </div>
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
  const [extractionFailed, setExtractionFailed] = useState(false);
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

  const handleFileSelected = useCallback(
    async (file: File) => {
      setIsExtracting(true);
      setExtractionFailed(false);

      try {
        const body = new FormData();
        body.append("file", file);
        if (projectId) body.append("projectId", projectId);

        const res = await fetch("/api/intake/extract", { method: "POST", body });

        if (!res.ok) throw new Error("extract failed");

        const extracted: Partial<DailyFormData> = await res.json();

        // Find matching trade partner by name if ID not provided
        let tradePartnerId = extracted.tradePartnerId ?? "";
        let tradePartnerName = extracted.tradePartnerName ?? "";

        if (!tradePartnerId && tradePartnerName) {
          const match = tradePartners.find(
            (tp) => tp.name.toLowerCase() === tradePartnerName.toLowerCase(),
          );
          if (match) tradePartnerId = match.id;
        }

        setFormData({
          ...emptyForm(tradePartnerId, tradePartnerName),
          ...extracted,
          tradePartnerId,
          tradePartnerName,
          date: extracted.date ?? todayISO(),
        });
        setStep("confirm");
      } catch {
        // Graceful fallback: show empty editable form with warning banner
        setExtractionFailed(true);
        setFormData(emptyForm());
        setStep("confirm");
      } finally {
        setIsExtracting(false);
      }
    },
    [projectId, tradePartners],
  );

  // ── Step 2: handle confirm → call submit API ─────────────────────────────

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
                Upload your trade partner daily report — photo, PDF, or spreadsheet.
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
                  <option value="">— Will be detected from document —</option>
                  {tradePartners.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <FileUploadDropzone
              onFileSelected={handleFileSelected}
              isLoading={isExtracting}
            />
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

            {extractionFailed && <ExtractionWarningBanner />}

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
