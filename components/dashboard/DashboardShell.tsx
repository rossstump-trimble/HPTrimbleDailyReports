"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Construction,
  LayoutDashboard,
  Printer,
  RefreshCw,
  Building2,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { DashboardPayload } from "@/lib/dashboard/types";
import { MonthlyGrid } from "./MonthlyGrid";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { MissingStaFollowUps } from "./MissingStaFollowUps";
import type { DailyReport } from "@/types/hpproto";

function monthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function shiftMonth(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function printGrid() {
  const node = document.getElementById("dashboard-monthly-grid");
  if (!node) return;
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Bowling sheet</title>
    <style>
      body { font-family: Montserrat, system-ui, sans-serif; padding: 16px; color: #1a1a1a; }
      table { border-collapse: collapse; width: 100%; font-size: 11px; }
      th, td { border: 1px solid #d4d4d8; padding: 4px; }
      th { background: #f4f4f5; }
    </style></head><body>
    <h1 style="font-size:18px;margin:0 0 12px">Daily report bowling sheet</h1>
    ${node.innerHTML}
    </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export function DashboardShell() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [tab, setTab] = useState("grid");
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
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
      const [res, bowlingRes] = await Promise.all([
        fetch(`/api/dashboard/${projectId}?month=${month}`),
        fetch(`/api/bowling/${projectId}?month=${month}`),
      ]);
      const json = (await res.json()) as DashboardPayload & { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);

      if (bowlingRes.ok) {
        const bJson = await bowlingRes.json();
        const bRows = bJson.matrix?.rows || bJson.rows || [];
        const extracted: DailyReport[] = bRows.flatMap((r: { cells?: { fullReport?: DailyReport }[] }) =>
          (r.cells || []).map((c) => c.fullReport).filter((f): f is DailyReport => Boolean(f)),
        );
        setReports(extracted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [projectId, month]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSyncConnectedCompanies = async (customSourceId?: string, confirmed = false) => {
    setSyncingCompanies(true);
    setCompanyFeedback(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: confirmed ? "sync-connected" : "preview-sync-connected",
          sourceProjectId: customSourceId?.trim() || undefined,
          trackImported: confirmed && pendingSyncPreview ? pendingSyncPreview.trackImported : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Failed to sync (${res.status})`);
      }
      if (!confirmed && json.preview) {
        const addedCount = Number(json.addedCount ?? 0);
        setPendingSyncPreview({
          remoteCount: Number(json.remoteCount ?? 0),
          addedCount,
          totalAfterSync: Number(json.totalAfterSync ?? 0),
          customSourceId: customSourceId?.trim() || undefined,
          trackImported: addedCount <= 50,
        });
        return;
      }
      setPendingSyncPreview(null);
      setCompanyFeedback({
        type: "success",
        text: json.message || `Loaded ${json.count} companies successfully.`,
      });
      void fetchData();
    } catch (err) {
      setCompanyFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load companies.",
      });
    } finally {
      setSyncingCompanies(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setSyncingCompanies(true);
    setCompanyFeedback(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          name: newCompanyName.trim(),
          category: newCompanyCategory.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Add failed (${res.status})`);
      setNewCompanyName("");
      setNewCompanyCategory("");
      setCompanyFeedback({
        type: "success",
        text: json.message || "Added company successfully.",
      });
      void fetchData();
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
    if (!confirm("Are you sure you want to clear all companies from this project?")) return;
    setSyncingCompanies(true);
    setCompanyFeedback(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Clear failed (${res.status})`);
      setCompanyFeedback({ type: "info", text: "Cleared all companies." });
      void fetchData();
    } catch (err) {
      setCompanyFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to clear companies.",
      });
    } finally {
      setSyncingCompanies(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName?: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${companyName || companyId}" from the dashboard and bowling sheet? Any unapproved or local daily reports for this company will also be removed.`,
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
      void fetchData();
    } catch (err) {
      setCompanyFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete company.",
      });
    } finally {
      setSyncingCompanies(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-none px-5 py-4 border-b border-border bg-background">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold tracking-tight">Daily report dashboard</h1>
                <Badge variant="outline" className="font-mono text-xs">
                  {data?.projectCode ?? projectId.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {data?.projectName ?? "Hensel Phelps Demo Project"} · {monthLabel(month)}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">Month</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Previous month"
              onClick={() => setMonth((current) => shiftMonth(current, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label="Selected month"
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label="Next month"
              onClick={() => setMonth((current) => shiftMonth(current, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

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
          <Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={printGrid} disabled={tab !== "grid" || !data}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print
          </Button>
        </div>

        {data && (data.kpis.missingToday > 0 || data.kpis.hpBacklogToday > 0) ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {data.kpis.missingToday > 0 ? (
              <span className="rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 px-2.5 py-1">
                {data.kpis.missingToday} missing dailies today
              </span>
            ) : null}
            {data.kpis.hpBacklogToday > 0 ? (
              <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 px-2.5 py-1">
                {data.kpis.hpBacklogToday} received — HP has not logged
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading dashboard…
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchData()}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && data && data.rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/60 p-8 text-center max-w-xl mx-auto my-8 space-y-4 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-[#0063a3]/10 text-[#0063a3] flex items-center justify-center mx-auto">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                No Companies in Dashboard
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The trade partner list for this dashboard is currently empty. Load company names from your
                connected ProjectSight project, add them manually, or simply approve incoming daily reports.
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
                <Download className={`h-3.5 w-3.5 ${syncingCompanies ? "animate-spin" : ""}`} />
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
        )}

        {!loading && !error && data && data.rows.length > 0 && (
          <div className="space-y-4">
            {reports.length > 0 && (
              <MissingStaFollowUps reports={reports} month={month} />
            )}
            <Tabs value={tab} onValueChange={setTab} className="space-y-4">
              <TabsList className="bg-transparent p-0 h-auto gap-1">
                <TabsTrigger value="grid" className="rounded-none px-4">
                  Monthly grid
                </TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-none px-4">
                  Analytics
                </TabsTrigger>
              </TabsList>
              <TabsContent value="grid" className="mt-0">
                <MonthlyGrid data={data} onDeleteCompany={handleDeleteCompany} />
              </TabsContent>
              <TabsContent value="analytics" className="mt-0">
                <AnalyticsDashboard data={data} />
              </TabsContent>
            </Tabs>
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
              Manage companies displayed on the dashboard and bowling sheet. Any company with an approved daily report will also be added automatically.
            </DialogDescription>
          </DialogHeader>

          {/* Feedback alert */}
          {companyFeedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                companyFeedback.type === "success"
                  ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-900"
                  : companyFeedback.type === "error"
                  ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900"
                  : "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
              }`}
            >
              {companyFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 flex-none mt-0.5 text-green-600 dark:text-green-400" />
              ) : companyFeedback.type === "error" ? (
                <AlertCircle className="h-4 w-4 flex-none mt-0.5 text-red-600 dark:text-red-400" />
              ) : null}
              <div className="flex-1 font-medium">{companyFeedback.text}</div>
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
                    Companies currently displayed on the dashboard. Click trash to delete one.
                  </p>
                </div>
              </div>

              {!data || data.rows.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2 text-center bg-background rounded-md border border-border/50">
                  No companies on this project yet. Load from ProjectSight or add one below.
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
                          key={r.trade.id}
                          className="flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/30 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-foreground block truncate">
                              {r.trade.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {r.trade.category || "Trade Partner"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0"
                            onClick={() => handleDeleteCompany(r.trade.id, r.trade.name)}
                            disabled={syncingCompanies}
                            title={`Delete ${r.trade.name}`}
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
                  <span>Add all {pendingSyncPreview.addedCount} imported companies directly to Dashboard &amp; Bowling Sheet</span>
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
                  <h4 className="text-xs font-semibold text-foreground">Connected ProjectSight Project</h4>
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
                  type="text"
                  placeholder="Or enter custom PS Project ID (e.g. 1025)"
                  value={differentProjectId}
                  onChange={(e) => setDifferentProjectId(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSyncConnectedCompanies(differentProjectId)}
                  disabled={syncingCompanies || !differentProjectId.trim()}
                  className="h-8 text-xs shrink-0"
                >
                  Load from ID
                </Button>
              </div>
            </div>

            {/* Action 2: Add single company manually */}
            <form onSubmit={handleAddCompany} className="border border-border rounded-lg p-3 bg-muted/20 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Add Company Manually</h4>
                <p className="text-[11px] text-muted-foreground">
                  Manually add a single trade partner name to this project.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="company-name" className="text-[11px]">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="e.g. Acme Electric"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="company-category" className="text-[11px]">Trade / Scope</Label>
                  <Input
                    id="company-category"
                    placeholder="e.g. Electrical"
                    value={newCompanyCategory}
                    onChange={(e) => setNewCompanyCategory(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={syncingCompanies || !newCompanyName.trim()}
                  className="h-8 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Company
                </Button>
              </div>
            </form>

            {/* Action 3: Reset / Clear Companies */}
            <div className="flex items-center justify-between p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/40 dark:bg-red-950/20">
              <div>
                <h4 className="text-xs font-semibold text-red-900 dark:text-red-200">Reset Company List</h4>
                <p className="text-[11px] text-red-700/80 dark:text-red-300/70">
                  Clear all companies from this project to start with an empty slate.
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
