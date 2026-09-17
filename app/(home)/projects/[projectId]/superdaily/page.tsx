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
  ShieldCheck,
  RefreshCw,
  FileText,
  Save,
  Trash2,
  CloudSun,
  RotateCcw,
  Wind,
  Droplets,
  Thermometer,
  X,
  EyeOff,
  Wrench,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { SuperdailyReport, TradeWorkSummary } from "@/types/superdaily";
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

  // Inline overview editing state
  const [isEditingOverview, setIsEditingOverview] = useState<boolean>(false);
  const [editableSummary, setEditableSummary] = useState<string>("");

  // Pre-export soft-deletion state
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [hiddenTradeIds, setHiddenTradeIds] = useState<string[]>([]);

  const handleGenerate = useCallback(async (targetDate: string = date) => {
    setLoading(true);
    setError(null);
    setIsEditingOverview(false);
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
      setHiddenSections([]);
      setHiddenTradeIds([]);
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

  const handleSaveOverview = () => {
    if (report) {
      setReport({
        ...report,
        executiveSummary: editableSummary,
      });
      setIsEditingOverview(false);
    }
  };

  const handleCancelOverview = () => {
    if (report) {
      setEditableSummary(report.executiveSummary);
      setIsEditingOverview(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setHiddenSections((prev) =>
      prev.includes(sectionKey) ? prev.filter((k) => k !== sectionKey) : [...prev, sectionKey],
    );
  };

  const toggleTrade = (tradeId: string) => {
    setHiddenTradeIds((prev) =>
      prev.includes(tradeId) ? prev.filter((id) => id !== tradeId) : [...prev, tradeId],
    );
  };

  const handleRestoreAll = () => {
    setHiddenSections([]);
    setHiddenTradeIds([]);
  };

  const totalHiddenCount = hiddenSections.length + hiddenTradeIds.length;
  const visibleTrades = report?.tradeSummaries.filter((t) => !hiddenTradeIds.includes(t.tradePartnerId)) || [];

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0.4in;
          }
          body, html {
            background: white !important;
            color: #333333 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
      <div className="p-6 max-w-7xl mx-auto space-y-6 print:hidden pb-20">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#A6192E]/10 text-[#A6192E]">
                <Sparkles className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-[#333333] dark:text-foreground">
                Superdaily Master Report
              </h1>
              <Badge variant="outline" className="text-xs border-[#A6192E]/30 text-[#A6192E] bg-[#A6192E]/5">
                Hensel Phelps Superdaily
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Authoritative daily site briefing, weather conditions, manpower, and trade work execution.
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
              className="gap-2 bg-[#A6192E] hover:bg-[#8B1425] text-white shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Synthesizing..." : "Generate Superdaily"}</span>
            </Button>

            {report && (
              <>
                {totalHiddenCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleRestoreAll}
                    className="gap-1.5 text-[#B87E00] border-[#F2A900] hover:bg-[#FFFDF5] dark:hover:bg-amber-950/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Restore ({totalHiddenCount})</span>
                  </Button>
                )}

                <Button
                  onClick={handlePrintPdf}
                  className="gap-1.5 bg-[#A6192E] hover:bg-[#8B1425] text-white shadow-sm"
                >
                  <Download className="h-4 w-4" />
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
            {/* Weather Card */}
            {!hiddenSections.includes("weather") && report.weather && (
              <Card className="border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20">
                <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <CloudSun className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    <CardTitle className="text-sm font-semibold text-sky-950 dark:text-sky-200">
                      Site Weather Observations
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                      {report.weather.conditions}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection("weather")}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600 gap-1"
                    title="Remove weather from export"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-1">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-amber-500" />
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Temperature</span>
                        <span className="font-semibold text-foreground">
                          {report.weather.tempMax != null && report.weather.tempMin != null
                            ? `High ${report.weather.tempMax}°F / Low ${report.weather.tempMin}°F (${report.weather.temp}°F avg)`
                            : `${report.weather.temp}°F`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-blue-500" />
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Wind Velocity</span>
                        <span className="font-semibold text-foreground">{report.weather.windVelocity} mph</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-sky-500" />
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Humidity</span>
                        <span className="font-semibold text-foreground">{report.weather.humidity}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CloudSun className="h-4 w-4 text-indigo-500" />
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Precipitation</span>
                        <span className="font-semibold text-foreground">
                          {report.weather.rainfall > 0
                            ? `Rain: ${report.weather.rainfall.toFixed(2)} in.`
                            : report.weather.snowfall > 0
                            ? `Snow: ${report.weather.snowfall.toFixed(1)} in.`
                            : "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0063a3]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Reporting Trades</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">
                      {report.activeTradeCount}
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        / {report.expectedTradeCount || report.activeTradeCount} expected
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">{reportsCount} dailies on file</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Site Headcount</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{report.totalHeadcount}</p>
                    <p className="text-[11px] text-muted-foreground">craftspersons on site</p>
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
                  <div
                    className={`p-2.5 rounded-lg ${
                      report.safetyAndStas.allCompleted
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-950/60"
                    }`}
                  >
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

            {/* Missing Submissions Alert Banner (On Bowling Sheet without a Daily) */}
            {!hiddenSections.includes("missing-trades") &&
              report.missingTrades &&
              report.missingTrades.length > 0 && (
                <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20">
                  <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <CardTitle className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Missing Submissions: Scheduled On Bowling Sheet
                      </CardTitle>
                      <Badge variant="outline" className="border-amber-400 text-amber-800 dark:text-amber-200 text-xs font-semibold">
                        {report.missingTrades.length} Trade(s) Delinquent
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection("missing-trades")}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600 gap-1"
                      title="Hide missing trades from export"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-1">
                    <p className="text-xs text-amber-800 dark:text-amber-300 mb-2">
                      The following active trade partners are on the project bowling matrix but have not filed a daily report for {report.date}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {report.missingTrades.map((m, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded bg-white dark:bg-background border border-amber-300 dark:border-amber-800 text-xs font-medium text-foreground flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="font-bold">{m.tradePartnerName}</span>
                          {m.category && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                              {m.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Editable Executive Site Overview Card */}
            {!hiddenSections.includes("overview") && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#0063a3]" />
                      <span>Executive Site Overview</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground mr-1">Date: {report.date}</span>
                      {!isEditingOverview ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingOverview(true)}
                          className="h-7 px-2 text-xs gap-1 text-[#0063a3] hover:text-[#004e82]"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit Overview</span>
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleSaveOverview}
                            className="h-7 px-2 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>Save</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelOverview}
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Cancel</span>
                          </Button>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection("overview")}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600 gap-1"
                        title="Remove overview section"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Synthesized jobsite tempo, critical operations, and milestones achieved.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditingOverview ? (
                    <div className="space-y-3">
                      <Textarea
                        rows={5}
                        value={editableSummary}
                        onChange={(e) => setEditableSummary(e.target.value)}
                        className="text-sm font-sans leading-relaxed"
                        placeholder="Enter executive site overview..."
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelOverview}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveOverview}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Save Overview</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingOverview(true)}
                      className="group relative cursor-pointer text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-muted/20 p-4 rounded-lg border border-border hover:border-[#0063a3]/40 transition-colors"
                      title="Click to edit overview"
                    >
                      <p>{report.executiveSummary}</p>
                      <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Edit3 className="h-3 w-3" /> Click to edit
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Subcontractor Work Breakdown (Expanded Trade Cards) */}
            {!hiddenSections.includes("trades") && (
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#0063a3]" />
                      <span>Trade Contractor Work & Field Activities</span>
                    </CardTitle>
                    <CardDescription>
                      Individual work breakdown, detailed activities, manpower, and equipment per subcontractor.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection("trades")}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600 gap-1"
                    title="Remove trade contractor section"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove All Trades</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {visibleTrades.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
                      No active trade cards.{" "}
                      {hiddenTradeIds.length > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setHiddenTradeIds([])}
                          className="text-[#0063a3]"
                        >
                          Restore {hiddenTradeIds.length} hidden trade(s)
                        </Button>
                      )}
                    </div>
                  ) : (
                    visibleTrades.map((trade: TradeWorkSummary) => (
                      <div
                        key={trade.tradePartnerId}
                        className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-3 transition-all hover:shadow"
                      >
                        {/* Trade Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">
                              {trade.tradePartnerName}
                            </span>
                            {trade.category && (
                              <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground">
                                {trade.category}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                Crew: <strong className="text-foreground">{trade.workerCount}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Hours: <strong className="text-foreground">{trade.totalHours} hrs</strong>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                STA:{" "}
                                {trade.staCompleted ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Complete</span>
                                  </span>
                                ) : (
                                  <span className="text-amber-600 font-bold flex items-center gap-0.5">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span>Check</span>
                                  </span>
                                )}
                              </span>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTrade(trade.tradePartnerId)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                              title="Delete this trade card before export"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Trade Card Body: Verbose Work Narrative */}
                        <div className="space-y-1.5 text-xs text-foreground">
                          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>Location: {trade.locationDescription}</span>
                          </div>
                          <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap pl-5 border-l-2 border-muted">
                            {trade.workPerformed}
                          </p>
                        </div>

                        {/* Trade Card Footer: Equipment & Notes */}
                        {trade.equipment && trade.equipment.length > 0 && (
                          <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-xs">
                            <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-medium text-[11px]">Equipment:</span>
                            <div className="flex flex-wrap gap-1">
                              {trade.equipment.map((eq, eqIdx) => (
                                <Badge key={eqIdx} variant="secondary" className="text-[10px] font-normal py-0">
                                  {eq}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* Delays & Safety Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!hiddenSections.includes("delays") && (
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Reported Delays & Roadblocks</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection("delays")}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600 gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {report.delaysAndRoadblocks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No operational delays, material shortages, or weather stoppages reported for this date.
                      </p>
                    ) : (
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-foreground">
                        {report.delaysAndRoadblocks.map((delay, idx) => (
                          <li key={idx} className="leading-normal">
                            {delay}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}

              {!hiddenSections.includes("safety") && (
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Safety Briefing & STA Status</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection("safety")}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600 gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-foreground leading-normal">
                      {report.safetyAndStas.staNotes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Undo/Restore Bar */}
      {totalHiddenCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 print:hidden bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-3 text-xs">
          <EyeOff className="h-4 w-4 text-amber-400" />
          <span>
            <strong>{totalHiddenCount}</strong> item(s) hidden from report & export
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRestoreAll}
            className="h-6 px-2 text-xs text-amber-300 hover:text-white hover:bg-slate-800"
          >
            Restore All
          </Button>
        </div>
      )}

      {/* Dedicated Vector Printable Document (rendered when printing) */}
      {report && (
        <SuperdailyPrintDocument
          report={report}
          hiddenSectionKeys={hiddenSections}
          hiddenTradeIds={hiddenTradeIds}
        />
      )}
    </>
  );
}
