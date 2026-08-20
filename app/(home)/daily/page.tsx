"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import FileUploadDropzone from "@/components/intake/FileUploadDropzone";
import DailyConfirmCard, { type DailyFormData } from "@/components/intake/DailyConfirmCard";
import {
  DESTINATION_COOKIE,
  parseDestinationJson,
  type ProjectSightDestination,
} from "@/lib/projectsight/destination";
import { unwrapExtractResponse } from "@/lib/extract-response";

type Step = "upload" | "confirm" | "success";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function emptyForm(): DailyFormData {
  return {
    tradePartnerId: "",
    tradePartnerName: "",
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

function readCookieDestination(): ProjectSightDestination | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${DESTINATION_COOKIE}=`));
  if (!raw) return null;
  return parseDestinationJson(decodeURIComponent(raw.slice(DESTINATION_COOKIE.length + 1)));
}

export default function OperatorDailyPage() {
  const [step, setStep] = useState<Step>("upload");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DailyFormData>(emptyForm());
  const [file, setFile] = useState<File | null>(null);
  const [destination, setDestination] = useState<ProjectSightDestination | null>(null);
  const [tidReady, setTidReady] = useState(false);
  const [sendResult, setSendResult] = useState<{
    projectSightDailyId: string;
    attached: boolean;
    attachError?: string;
  } | null>(null);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    setDestination(readCookieDestination());
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { authenticated?: boolean; mode?: string }) => {
        setTidReady(Boolean(data.authenticated && data.mode === "tid"));
      })
      .catch(() => setTidReady(false));
  }, []);

  const handleFileSelected = useCallback(async (uploaded: File) => {
    setFile(uploaded);
    setIsExtracting(true);
    setExtractionFailed(false);
    try {
      const body = new FormData();
      body.append("file", uploaded);
      const res = await fetch("/api/intake/extract", { method: "POST", body });
      if (!res.ok) throw new Error("extract failed");
      const extracted = unwrapExtractResponse(await res.json());
      setFormData({
        ...emptyForm(),
        ...extracted,
        date: extracted.date ?? todayISO(),
      });
      setStep("confirm");
    } catch {
      setExtractionFailed(true);
      setFormData(emptyForm());
      setStep("confirm");
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!file || !destination?.portfolioId || !destination.projectId) return;
    setIsSubmitting(true);
    setSendError("");
    try {
      const body = new FormData();
      body.append("portfolioId", destination.portfolioId);
      body.append("projectId", destination.projectId);
      body.append("daily", JSON.stringify(formData));
      body.append("file", file);
      const res = await fetch("/api/projectsight/dailyreports", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Send failed");
      }
      setSendResult(json);
      setStep("success");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [destination, file, formData]);

  const retryAttach = useCallback(async () => {
    if (!file || !destination || !sendResult?.projectSightDailyId) return;
    setIsSubmitting(true);
    try {
      const body = new FormData();
      body.append("portfolioId", destination.portfolioId);
      body.append("projectId", destination.projectId);
      body.append("file", file);
      const res = await fetch(
        `/api/projectsight/dailyreports/${sendResult.projectSightDailyId}/attach`,
        { method: "POST", body },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Attach failed");
      setSendResult({ ...sendResult, attached: true, attachError: undefined });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Attach failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [destination, file, sendResult]);

  const canSend = Boolean(tidReady && destination?.portfolioId && destination.projectId && file);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">FOG 617 Daily Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Parse a Hensel Phelps FOG 617 and create a new ProjectSight Daily Report on the
          portfolio/project selected in the top bar.
        </p>
      </div>

      {!tidReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Sign in with Trimble Identity to send to ProjectSight.{" "}
          <a className="underline" href="/login?from=/daily">
            Sign in
          </a>
        </div>
      )}

      {tidReady && !destination?.projectId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Pick a ProjectSight portfolio and project in the top bar before sending.
        </div>
      )}

      {destination?.projectId && (
        <p className="text-xs text-muted-foreground">
          Destination: {destination.portfolioName || destination.portfolioId} /{" "}
          {destination.projectName || destination.projectId}
        </p>
      )}

      {step !== "success" && (
        <div className="flex items-center justify-center gap-2 py-2">
          {(["upload", "confirm"] as const).map((key, i) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                  step === key ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {i + 1}
              </span>
              {key === "upload" ? "Upload" : "Review"}
              {i === 0 && <ChevronRight size={14} className="text-muted-foreground" />}
            </div>
          ))}
        </div>
      )}

      {step === "upload" && (
        <FileUploadDropzone onFileSelected={handleFileSelected} isLoading={isExtracting} />
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          {extractionFailed && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle size={18} className="text-amber-500 mt-0.5" />
              <p className="text-sm">
                Automatic extraction unavailable — fill in the FOG 617 fields manually.
              </p>
            </div>
          )}
          {!file && (
            <p className="text-sm text-destructive">A FOG 617 file is required to send.</p>
          )}
          {sendError && <p className="text-sm text-destructive">{sendError}</p>}
          <DailyConfirmCard
            tradePartners={[]}
            initialData={formData}
            data={formData}
            onChange={setFormData}
            onCancel={() => {
              setStep("upload");
              setFile(null);
              setFormData(emptyForm());
            }}
            onSubmit={handleSend}
            isSubmitting={isSubmitting}
            submitLabel={canSend ? "Send to ProjectSight" : "Select project to send"}
            requireTradePartner={false}
            submitDisabled={!canSend}
          />
        </div>
      )}

      {step === "success" && sendResult && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle2 size={44} className="text-green-600" />
          <div>
            <h2 className="text-lg font-bold">Daily created in ProjectSight</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Id {sendResult.projectSightDailyId}
              {sendResult.attached ? " · FOG 617 attached" : " · file not attached"}
            </p>
          </div>
          {!sendResult.attached && (
            <button
              type="button"
              onClick={retryAttach}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 text-sm font-medium border"
            >
              Retry attach
            </button>
          )}
          {sendError && <p className="text-sm text-destructive">{sendError}</p>}
          <button
            type="button"
            onClick={() => {
              setStep("upload");
              setFile(null);
              setSendResult(null);
              setFormData(emptyForm());
            }}
            className="text-sm underline"
          >
            Send another
          </button>
        </div>
      )}
    </div>
  );
}
