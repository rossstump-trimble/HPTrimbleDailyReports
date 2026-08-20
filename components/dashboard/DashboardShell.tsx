"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutDashboard, Printer, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardPayload } from "@/lib/dashboard/types";
import { MonthlyGrid } from "./MonthlyGrid";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { AskAgent } from "./AskAgent";

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
  const projectId = params.projectId;
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [tab, setTab] = useState("grid");
  const [askOpen, setAskOpen] = useState(false);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/${projectId}?month=${month}`);
      const json = (await res.json()) as DashboardPayload & { error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [projectId, month]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-none px-5 py-4 border-b border-border bg-background">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight">Daily report dashboard</h1>
                <Badge variant="outline" className="font-mono text-xs">
                  {data?.projectCode ?? projectId.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {data?.projectName ?? "CYS07"} · {monthLabel(month)}
                {data ? ` · ${data.sourceReportCount} Project Sight dailies as source` : ""}
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

          <Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={printGrid} disabled={tab !== "grid" || !data}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print
          </Button>
          <Button size="sm" onClick={() => setAskOpen(true)}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Ask
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

        {!loading && !error && data && (
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
              <MonthlyGrid data={data} />
            </TabsContent>
            <TabsContent value="analytics" className="mt-0">
              <AnalyticsDashboard data={data} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <AskAgent open={askOpen} onOpenChange={setAskOpen} projectId={projectId} month={month} />
    </div>
  );
}
