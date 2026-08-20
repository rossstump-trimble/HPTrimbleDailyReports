"use client";

import { useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Zap } from "lucide-react";
import type { PCO, SuggestionStatus } from "./types";
import { mockEnhancedAISuggestions, mockEnhancedHistorical } from "./mock-data";
import { ConfidenceSummaryBar } from "./ConfidenceIndicator";
import { PricingReviewTable } from "./PricingReviewTable";
import { HistoricalComparisonWidget } from "./HistoricalComparisonWidget";

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface AIEstimateTabProps {
  pco: PCO;
}

export function AIEstimateTab({ pco }: AIEstimateTabProps) {
  const [statuses, setStatuses] = useState<Record<number, SuggestionStatus>>({});

  const aiSuggestions = mockEnhancedAISuggestions[pco.id] || [];
  const historicalProjects = mockEnhancedHistorical[pco.id] || [];

  const avgConfidence = aiSuggestions.length > 0
    ? Math.round(aiSuggestions.reduce((sum, s) => sum + s.confidence, 0) / aiSuggestions.length)
    : 0;

  const aiTotal = aiSuggestions.reduce((sum, s) => sum + s.total, 0);
  const acceptedCount = Object.values(statuses).filter((s) => s === "accepted").length;

  const acceptedTotal = aiSuggestions.reduce((sum, s, idx) => {
    if (statuses[idx] !== "accepted") return sum;
    return sum + s.laborRate * s.laborHours + s.materialCost + s.equipmentCost;
  }, 0);

  const handleStatusChange = useCallback((idx: number, status: SuggestionStatus) => {
    setStatuses((prev) => ({ ...prev, [idx]: status }));
  }, []);

  const handleBulkAction = useCallback((action: "acceptAll" | "rejectAll" | "resetAll") => {
    if (action === "resetAll") {
      setStatuses({});
      return;
    }
    const newStatus: SuggestionStatus = action === "acceptAll" ? "accepted" : "rejected";
    setStatuses((prev) => {
      const next = { ...prev };
      aiSuggestions.forEach((_, idx) => { next[idx] = newStatus; });
      return next;
    });
  }, [aiSuggestions]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-5 space-y-5">
        {/* Confidence summary */}
        <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 px-4 py-3">
          <ConfidenceSummaryBar score={avgConfidence} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">
              Based on {aiSuggestions[0]?.source ?? "historical data"}
            </span>
            <span className="text-xs font-medium">
              AI Total: <span className="text-blue-600 dark:text-blue-400">${formatCurrency(aiTotal)}</span>
            </span>
          </div>
          {Math.abs(aiTotal - pco.budgetEstimate) > 0 && (
            <div className="mt-1 flex items-center gap-1 text-[11px]">
              <TrendingUp className="h-3 w-3 flex-shrink-0" />
              <span className={aiTotal > pco.budgetEstimate ? "text-red-600" : "text-green-600"}>
                {aiTotal > pco.budgetEstimate ? "+" : ""}{formatCurrency(aiTotal - pco.budgetEstimate)} vs. current estimate
                ({aiTotal > pco.budgetEstimate ? "over" : "under"} by {Math.abs(((aiTotal - pco.budgetEstimate) / pco.budgetEstimate) * 100).toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        {/* Pricing Review Table (US-5, US-7, US-9) */}
        <PricingReviewTable
          suggestions={aiSuggestions}
          statuses={statuses}
          onStatusChange={handleStatusChange}
          onBulkAction={handleBulkAction}
        />

        <Separator />

        {/* Historical Comparison (US-8) */}
        <HistoricalComparisonWidget
          projects={historicalProjects}
          currentEstimate={pco.budgetEstimate}
        />

        {/* Sticky finalize bar */}
        <div className="sticky bottom-0 bg-background border-t -mx-6 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {acceptedCount} of {aiSuggestions.length} line items accepted
              {acceptedCount > 0 && (
                <span className="ml-2 font-medium text-green-700 dark:text-green-400">
                  Total: ${formatCurrency(acceptedTotal)}
                </span>
              )}
            </div>
            <button
              disabled={acceptedCount === 0}
              className="inline-flex items-center h-8 px-3 text-xs font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Apply {acceptedCount} Item{acceptedCount !== 1 ? "s" : ""} to Estimate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
