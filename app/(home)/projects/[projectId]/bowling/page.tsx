"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RefreshCw,
  QrCode,
  ChevronLeft,
  Calendar,
  SlidersHorizontal,
  Building2,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FolderInput,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BowlingTable, BowlingRow } from "@/components/bowling/BowlingTable";
import { MissingStaFollowUps } from "@/components/dashboard/MissingStaFollowUps";
import type { DailyReport } from "@/types/hpproto";

interface BowlingMatrixResponse {
  projectId: string;
  projectCode: string;
  projectName: string;
  month: string;
  daysInMonth: number;
  workingDays?: number[];
  rows: BowlingRow[];
}

const ALL_DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function BowlingPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;

  const [month, setMonth] = useState<string>(currentYearMonth());
  const [data, setData] = useState<BowlingMatrixResponse | null>(null);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(true);
  const [savingWorkingDays, setSavingWorkingDays] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Companies Management Dialog State
  const [companiesModalOpen, setCompaniesModalOpen] = useState(false);
  const [syncingCompanies, setSyncingCompanies] = useState(false);
  const [companyFeedback, setCompanyFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCategory, setNewCompanyCategory] = useState("");
  const [differentProjectId, setDifferentProjectId] = useState("");
  const [pendingSyncPreview, setPendingSyncPreview] = useState<{
    remoteCount: number;
    addedCount: number;
    totalAfterSync: number;
    customSourceId?: string;
    trackImported: boolean;
  } | null>(null);
  const [activeCompanyPage, setActiveCompanyPage] = useState(1);
  const ACTIVE_COMPANY_PAGE_SIZE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bowling/${projectId}?month=${month}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as BowlingMatrixResponse;
      setData(json);
      if (json.workingDays && Array.isArray(json.workingDays)) {
        setWorkingDays(json.workingDays);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bowling data.");
    } finally {
      setLoading(false);
    }
  }, [projectId, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateWorkingDaysSetting = async (nextDays: number[]) => {
    setWorkingDays(nextDays);
    setSavingWorkingDays(true);
    try {
      await fetch(`/api/projects/${projectId}/working-days`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workingDays: nextDays }),
      });
      await fetchData();
    } catch (err) {
      console.error("[update working days failed]", err);
    } finally {
      setSavingWorkingDays(false);
    }
  };

  const toggleWorkingDay = (dayValue: number) => {
    const next = workingDays.includes(dayValue)
      ? workingDays.filter((d) => d !== dayValue)
      : [...workingDays, dayValue].sort();
    void updateWorkingDaysSetting(next);
  };

  const applyPreset = (preset: "mon-fri" | "mon-sat" | "all") => {
    let next: number[];
    if (preset === "mon-fri") next = [1, 2, 3, 4, 5];
    else if (preset === "mon-sat") next = [1, 2, 3, 4, 5, 6];
    else next = [0, 1, 2, 3, 4, 5, 6];
    void updateWorkingDaysSetting(next);
  };

  // Company management handlers
  const handleSyncConnectedCompanies = async (customSourceId?: string, confirmed = false) => {
    setSyncingCompanies(true);
    setCompanyFeedback(null);
    try {
      const payload: {
        action: string;
        sourceProjectId?: string;
        trackImported?: boolean;
      } = {
        action: confirmed ? "sync-connected" : "preview-sync-connected",
      };
      if (customSourceId?.trim()) {
        payload.sourceProjectId = customSourceId.trim();
      }
      if (confirmed && pendingSyncPreview) {
        payload.trackImported = pendingSyncPreview.trackImported;
      }

      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        if (body.requiresTid) {
          setCompanyFeedback({
            type: "info",
            text: "Trimble Identity required: Sign in with TID to load live companies directly from ProjectSight. You can also add companies manually below.",
          });
        } else {
          setCompanyFeedback({
            type: "error",
            text: body.error || "Failed to load companies.",
          });
        }
        return;
      }

      if (!confirmed && body.preview) {
        const addedCount = Number(body.addedCount ?? 0);
        setPendingSyncPreview({
          remoteCount: Number(body.remoteCount ?? 0),
          addedCount,
          totalAfterSync: Number(body.totalAfterSync ?? 0),
          customSourceId: customSourceId?.trim() || undefined,
          trackImported: addedCount <= 50,
        });
        return;
      }

      setPendingSyncPreview(null);
      setCompanyFeedback({
        type: "success",
        text: body.message || `Loaded ${body.count} companies into bowling sheet.`,
      });
      await fetchData();
    } catch (err) {
      setCompanyFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Sync failed.",
      });
    } finally {
      setSyncingCompanies(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCompanyName.trim();
    if (!name) return;

    setSyncingCompanies(true);
    setCompanyFeedback(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          name,
          category: newCompanyCategory.trim() || "Trade Partner",
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to add company.");
      }

      setCompanyFeedback({
        type: "success",
        text: body.message || `Added "${name}".`,
      });
      setNewCompanyName("");
      setNewCompanyCategory("");
      await fetchData();
    } catch (err) {
      setCompanyFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to add company.",
      });
    } finally {
      setSyncingCompanies(false);
    }
  };

  const handleClearCompanies = async () => {
    if (!confirm("Are you sure you want to clear all companies from the bowling sheet?")) {
      return;
    }

    setSyncingCompanies(true);
    setCompanyFeedback(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to reset companies.");
      }

      setCompanyFeedback({
        type: "success",
        text: "Bowling sheet company list has been reset to empty.",
      });
      await fetchData();
    } catch (err) {
      setCompanyFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to reset.",
      });
    } finally {
      setSyncingCompanies(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName?: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${companyName || companyId}" from the bowling sheet? Any unapproved or local daily reports for this company will also be removed.`,
      )
    ) {
      return;
    }
    setSyncingCompanies(true);
    setCompanyFeedback(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          companyId,
          name: companyName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Delete failed (${res.status})`);
      setCompanyFeedback({
        type: "success",
        text: json.message || `Deleted "${companyName || companyId}".`,
      });
      await fetchData();
    } catch (err) {
      setCompanyFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete company.",
      });
    } finally {
      setSyncingCompanies(false);
    }
  };

  const intakeUrl = `/intake/${projectId}`;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-none flex items-center gap-3 px-4 py-3 border-b border-border bg-background flex-wrap">
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Projects
        </button>

        <div className="h-4 w-px bg-border" />

        {data ? (
          <Badge variant="outline" className="font-mono text-sm font-semibold px-2 py-0.5">
            {data.projectCode}
          </Badge>
        ) : (
          <Badge variant="outline" className="font-mono text-sm font-semibold px-2 py-0.5">
            {projectId.toUpperCase()}
          </Badge>
        )}

        <span className="text-sm font-semibold text-foreground truncate max-w-[240px]">
          {data?.projectName ?? "Master Bowling Sheet"}
        </span>

        <div className="flex-1" />

        {/* Manage Companies Button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setCompanyFeedback(null);
            setCompaniesModalOpen(true);
          }}
        >
          <Building2 className="h-3.5 w-3.5 text-[#0063a3]" />
          <span>Companies</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold ml-1">
            {data?.rows.length ?? 0}
          </Badge>
        </Button>

        {/* Superdaily Shortcut */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/superdaily`)}
          className="gap-1.5 text-xs border-amber-300 bg-amber-50/60 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span>Superdaily</span>
        </Button>

        {/* Working Days Settings Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Working Days</span>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold ml-1">
                {workingDays.length}d/wk
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 space-y-3" align="end">
            <div>
              <p className="text-xs font-bold text-foreground">Working Days Schedule</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Dailies are only required on working days. Off-days are marked N/A on the matrix.
              </p>
            </div>

            {/* Presets */}
            <div className="flex gap-1.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => applyPreset("mon-fri")}
              >
                Mon–Fri
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => applyPreset("mon-sat")}
              >
                Mon–Sat
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => applyPreset("all")}
              >
                7 Days
              </Button>
            </div>

            {/* Individual day toggles */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {ALL_DAYS.map((day) => {
                const active = workingDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWorkingDay(day.value)}
                    disabled={savingWorkingDays}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      active
                        ? "bg-[#0063a3] text-white border-[#0063a3]"
                        : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="month-input" className="text-xs text-muted-foreground whitespace-nowrap">
            Month
          </label>
          <input
            id="month-input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-sm border border-input rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        <Button
          size="sm"
          onClick={() => router.push(intakeUrl)}
          style={{ backgroundColor: "#0063a3" }}
          className="text-white flex items-center gap-1.5"
        >
          <QrCode className="h-3.5 w-3.5" />
          Intake Form
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading bowling sheet…</span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Daily Report Compliance ·{" "}
                  {new Date(data.month + "-01").toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {data.rows.length} trade partners
                </span>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Working days:</span>
                <span className="font-medium text-foreground">
                  {workingDays.length === 7
                    ? "Every day"
                    : workingDays.length === 5 && !workingDays.includes(0) && !workingDays.includes(6)
                      ? "Mon – Fri"
                      : `${workingDays.length} days/week`}
                </span>
              </div>
            </div>

            {/* Empty State Banner when rows === 0 */}
            {data.rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 text-center max-w-xl mx-auto my-8 space-y-4 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-[#0063a3]/10 text-[#0063a3] flex items-center justify-center mx-auto">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    No Companies in Bowling Sheet
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The trade partner list for this sheet is empty. Load company names from your
                    connected ProjectSight project, add them manually, or simply approve incoming
                    daily reports to populate this sheet automatically.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => {
                      setCompaniesModalOpen(true);
                      void handleSyncConnectedCompanies();
                    }}
                    disabled={syncingCompanies}
                    className="gap-1.5 bg-[#0063a3] text-white hover:bg-[#005187]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Load from Connected Project
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCompanyFeedback(null);
                      setCompaniesModalOpen(true);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Company Manually
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <MissingStaFollowUps
                  reports={(data.rows ?? []).flatMap((r) =>
                    (r.cells ?? []).map((c) => c.fullReport).filter((f): f is DailyReport => Boolean(f)),
                  )}
                  month={data.month}
                />
                <BowlingTable
                  rows={data.rows}
                  daysInMonth={data.daysInMonth}
                  month={data.month}
                  projectId={projectId}
                  onRefresh={fetchData}
                  onDeleteCompany={handleDeleteCompany}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Companies Management Modal */}
      <Dialog open={companiesModalOpen} onOpenChange={setCompaniesModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-[#0063a3]" />
              Trade Partner Companies
            </DialogTitle>
            <DialogDescription className="text-xs">
              Manage companies displayed on the master bowling sheet. Any company with an approved
              daily report will also be added automatically.
            </DialogDescription>
          </DialogHeader>

          {/* Feedback alert */}
          {companyFeedback && (
            <div
              className={`p-3 rounded-md text-xs flex items-start gap-2 ${
                companyFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : companyFeedback.type === "error"
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              {companyFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
              )}
              <span>{companyFeedback.text}</span>
            </div>
          )}

          <div className="space-y-4 pt-1">
            {/* Active Companies List with Individual Delete */}
            <div className="border border-border rounded-lg p-3 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Active Companies ({data?.rows.length ?? 0})
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Companies currently tracked on this bowling sheet. Click trash to remove one.
                  </p>
                </div>
              </div>

              {!data || data.rows.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2 text-center bg-background rounded-md border border-border/50">
                  No companies in this project yet. Load from ProjectSight or add one below.
                </p>
              ) : (
                <>
                  <div className="max-h-48 overflow-y-auto divide-y divide-border/60 rounded-md border border-border/60 bg-background">
                    {data.rows
                      .slice(
                        (activeCompanyPage - 1) * ACTIVE_COMPANY_PAGE_SIZE,
                        activeCompanyPage * ACTIVE_COMPANY_PAGE_SIZE,
                      )
                      .map((r) => (
                        <div
                          key={r.tradePartner.id}
                          className="flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/30 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-foreground block truncate">
                              {r.tradePartner.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {r.tradePartner.category || "Trade Partner"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0"
                            onClick={() => handleDeleteCompany(r.tradePartner.id, r.tradePartner.name)}
                            disabled={syncingCompanies}
                            title={`Delete ${r.tradePartner.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                  </div>
                  {data.rows.length > ACTIVE_COMPANY_PAGE_SIZE && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                      <span>
                        Page {activeCompanyPage} of {Math.ceil(data.rows.length / ACTIVE_COMPANY_PAGE_SIZE)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          disabled={activeCompanyPage <= 1}
                          onClick={() => setActiveCompanyPage((p) => Math.max(1, p - 1))}
                        >
                          Prev
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          disabled={activeCompanyPage >= Math.ceil(data.rows.length / ACTIVE_COMPANY_PAGE_SIZE)}
                          onClick={() =>
                            setActiveCompanyPage((p) =>
                              Math.min(Math.ceil(data.rows.length / ACTIVE_COMPANY_PAGE_SIZE), p + 1),
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {pendingSyncPreview && (
              <div className="border border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800 rounded-lg p-3 space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-amber-950 dark:text-amber-200">
                      Confirm Company Import: {pendingSyncPreview.addedCount} new record(s) found
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      ProjectSight returned {pendingSyncPreview.remoteCount} companies ({pendingSyncPreview.totalAfterSync} total after sync).
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-[11px] font-medium text-amber-950 dark:text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pendingSyncPreview.trackImported}
                    onChange={(e) =>
                      setPendingSyncPreview((prev) =>
                        prev ? { ...prev, trackImported: e.target.checked } : null,
                      )
                    }
                    className="rounded border-amber-400"
                  />
                  <span>Add all {pendingSyncPreview.addedCount} imported companies directly to Bowling Sheet rows</span>
                </label>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={syncingCompanies}
                    onClick={() => setPendingSyncPreview(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs bg-[#0063a3] hover:bg-[#005187] text-white"
                    disabled={syncingCompanies}
                    onClick={() => handleSyncConnectedCompanies(pendingSyncPreview.customSourceId, true)}
                  >
                    {syncingCompanies
                      ? "Importing..."
                      : `Confirm Import (${pendingSyncPreview.addedCount})`}
                  </Button>
                </div>
              </div>
            )}

            {/* Action 1: Load from Connected Project */}
            <div className="border border-border rounded-lg p-3 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Connected ProjectSight Project
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Pull trade partner company directory from the connected project.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleSyncConnectedCompanies()}
                  disabled={syncingCompanies}
                  className="gap-1.5 text-xs bg-[#0063a3] hover:bg-[#005187] text-white"
                >
                  <Download className={`h-3.5 w-3.5 ${syncingCompanies ? "animate-spin" : ""}`} />
                  Load Companies
                </Button>
              </div>

              {/* Option to specify different project ID */}
              <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                <Input
                  placeholder="Or enter specific ProjectSight project ID..."
                  value={differentProjectId}
                  onChange={(e) => setDifferentProjectId(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSyncConnectedCompanies(differentProjectId)}
                  disabled={syncingCompanies || !differentProjectId.trim()}
                  className="h-8 text-xs gap-1"
                >
                  <FolderInput className="h-3 w-3" />
                  Load from ID
                </Button>
              </div>
            </div>

            {/* Action 2: Add single company manually */}
            <form onSubmit={handleAddCompany} className="border border-border rounded-lg p-3 bg-muted/20 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Add Company Manually</h4>
                <p className="text-[11px] text-muted-foreground">
                  Quickly add a contractor or subcontractor to track on the bowling sheet.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="company-name" className="text-[11px]">
                    Company Name
                  </Label>
                  <Input
                    id="company-name"
                    placeholder="e.g. Acme Drywall Inc."
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="company-category" className="text-[11px]">
                    Trade / Scope
                  </Label>
                  <Input
                    id="company-category"
                    placeholder="e.g. Drywall & Framing"
                    value={newCompanyCategory}
                    onChange={(e) => setNewCompanyCategory(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={syncingCompanies || !newCompanyName.trim()}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add to Sheet
                </Button>
              </div>
            </form>

            {/* Action 3: Reset / Clear Companies */}
            <div className="flex items-center justify-between p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/40 dark:bg-red-950/20">
              <div>
                <p className="text-xs font-semibold text-red-900 dark:text-red-200">
                  Reset Companies List
                </p>
                <p className="text-[11px] text-red-700 dark:text-red-300">
                  Remove all companies from this bowling sheet to start fresh.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearCompanies}
                disabled={syncingCompanies || (data?.rows.length ?? 0) === 0}
                className="h-8 text-xs gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompaniesModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
