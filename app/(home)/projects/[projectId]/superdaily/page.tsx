"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  Calendar,
  Download,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileText,
  Save,
  Truck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SuperdailyReport, TradeFavor } from "@/types/superdaily";
import { SuperdailyPrintDocument } from "@/components/superdaily/SuperdailyPrintDocument";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function SuperdailyPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;

  const [date, setDate] = useState<string>(todayISO());
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<SuperdailyReport | null>(null);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableSummary, setEditableSummary] = useState<string>("");

  const handleGenerate = useCallback(async (targetDate: string = date) => {
    setLoading(true);
    setError(null);
    setIsEditing(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/superdaily/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: targetDate }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate Superdaily summary");
      }

      setReport(data.report);
      setReportsCount(data.reportsCount ?? 0);
      setEditableSummary(data.report.executiveSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating superdaily");
    } finally {
      setLoading(false);
    }
  }, [projectId, date]);

  // Initial load
  useEffect(() => {
    void handleGenerate(date);
  }, [date, handleGenerate]);

  const handlePrintPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleSaveEdits = () => {
    if (report) {
      setReport({
        ...report,
        executiveSummary: editableSummary,
      });
      setIsEditing(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body, html {
            background: white !important;
            color: black !important;
          }
          header, nav, aside, .print\\:hidden {
            display: none !important;
          }
          .superdaily-print-only {
            display: block !important;
          }
        }
      `}</style>

      {/* Screen Interface */}
      <div className="p-6 max-w-7xl mx-auto space-y-6 print:hidden">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Superdaily Master Report
              </h1>
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-300">
                AI Synthesis
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cross-trade daily summary, site activities, manpower, and inter-trade coordination.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-3 py-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none"
              />
            </div>

            <Button
              onClick={() => handleGenerate(date)}
              disabled={loading}
              className="gap-2 bg-[#0063a3] hover:bg-[#004e82] text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Synthesizing..." : "Generate Superdaily"}</span>
            </Button>

            {report && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isEditing) handleSaveEdits();
                    else setIsEditing(true);
                  }}
                  className="gap-1.5"
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 text-emerald-600" />
                      <span>Save Review</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Notes</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handlePrintPdf}
                  className="gap-1.5 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200"
                >
                  <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Download PDF</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Content View */}
        {report && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0063a3]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Active Trades</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{report.activeTradeCount}</p>
                    <p className="text-[11px] text-muted-foreground">{reportsCount} trade reports filed</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Site Headcount</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{report.totalHeadcount}</p>
                    <p className="text-[11px] text-muted-foreground">workers on site</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Man-Hours</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{report.totalManHours} hrs</p>
                    <p className="text-[11px] text-muted-foreground">logged across all trades</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${report.safetyAndStas.allCompleted ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60'}`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">STA Safety Briefings</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {report.safetyAndStas.allCompleted ? "100% Completed" : "Review Needed"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">morning hazard analyses</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Executive Summary Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#0063a3]" />
                    <span>Executive Site Overview</span>
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">Date: {report.date}</span>
                </div>
                <CardDescription>
                  Synthesized jobsite status and tempo from all active trade partner submissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-2">
                    <Label className="text-xs">Edit Superintendent Summary</Label>
                    <Textarea
                      rows={4}
                      value={editableSummary}
                      onChange={(e) => setEditableSummary(e.target.value)}
                      className="text-sm font-sans"
                    />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-muted/20 p-3.5 rounded-lg border border-border">
                    {report.executiveSummary}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Inter-Trade Coordination & Favors */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Inter-Trade Coordination & Favors</span>
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {report.interTradeFavors.length} Identified
                  </Badge>
                </div>
                <CardDescription>
                  Collaborative actions detected between trades (equipment sharing, crane offloading, staging handoffs).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.interTradeFavors.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">
                    No explicit equipment loans or mutual trade favors identified in today&apos;s daily reports.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.interTradeFavors.map((favor: TradeFavor, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <span className="text-[#0063a3] dark:text-blue-400">{favor.providingTrade}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-amber-700 dark:text-amber-300">{favor.receivingTrade}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold border-amber-300 text-amber-800 dark:text-amber-200">
                            {favor.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground leading-normal">
                          {favor.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subcontractor Work Breakdown Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0063a3]" />
                  <span>Subcontractor Trade Activities</span>
                </CardTitle>
                <CardDescription>
                  Detailed labor breakdown, work performed, and equipment on site.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-muted-foreground text-xs border-b border-border uppercase">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Trade Partner</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Crew</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Hours</th>
                        <th className="py-2.5 px-4 font-semibold">Location & Work Performed</th>
                        <th className="py-2.5 px-4 font-semibold">Equipment</th>
                        <th className="py-2.5 px-3 font-semibold text-center">STA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {report.tradeSummaries.map((trade, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-3 px-4 font-bold text-foreground">
                            {trade.tradePartnerName}
                          </td>
                          <td className="py-3 px-3 text-center text-foreground font-semibold">
                            {trade.workerCount}
                          </td>
                          <td className="py-3 px-3 text-center text-foreground">
                            {trade.totalHours}
                          </td>
                          <td className="py-3 px-4 text-foreground max-w-xs">
                            <span className="font-semibold text-muted-foreground block mb-0.5">
                              {trade.locationDescription}
                            </span>
                            <span className="text-xs leading-normal">
                              {trade.workPerformed}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {trade.equipment && trade.equipment.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {trade.equipment.map((eq, eqIdx) => (
                                  <Badge key={eqIdx} variant="secondary" className="text-[10px] font-normal">
                                    {eq}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {trade.staCompleted ? (
                              <span className="inline-flex items-center justify-center text-emerald-600 font-bold" title="STA Safety Completed">
                                <CheckCircle2 className="h-4 w-4" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center text-amber-600 font-bold" title="STA Incomplete or Unconfirmed">
                                <AlertTriangle className="h-4 w-4" />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Delays & Safety Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Reported Delays & Roadblocks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.delaysAndRoadblocks.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No operational delays, material shortages, or weather stoppages reported for this date.
                    </p>
                  ) : (
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-foreground">
                      {report.delaysAndRoadblocks.map((delay, idx) => (
                        <li key={idx} className="leading-normal">{delay}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Safety Briefing & STA Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-foreground leading-normal">
                    {report.safetyAndStas.staNotes}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Vector Printable Document (rendered when printing) */}
      {report && <SuperdailyPrintDocument report={report} />}
    </>
  );
}
