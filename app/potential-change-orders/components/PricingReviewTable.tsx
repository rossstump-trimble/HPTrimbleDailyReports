"use client";

import { useState } from "react";
import { Check, CheckCheck, X, ThumbsUp, ThumbsDown, Undo2, ChevronRight, ChevronDown } from "lucide-react";
import type { AISuggestion, SuggestionStatus } from "./types";
import { ConfidenceIndicator } from "./ConfidenceIndicator";

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function computeRowTotal(suggestion: AISuggestion): number {
  return suggestion.laborRate * suggestion.laborHours + suggestion.materialCost + suggestion.equipmentCost;
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function generateRefData(projectName: string, suggestion: AISuggestion) {
  const h = hashString(projectName + suggestion.costCode);
  const variance = ((h % 30) - 15) / 100;
  const refTotal = computeRowTotal(suggestion) * (1 + variance);
  const similarity = 75 + (h % 20);
  const pcoNum = 100 + (h % 900);
  const lineDesc = suggestion.description.split("—")[0].trim();
  const reference = `${projectName} / PCO-${pcoNum} / ${lineDesc}`;
  return { reference, total: refTotal, similarity };
}

interface PricingReviewTableProps {
  suggestions: AISuggestion[];
  statuses: Record<number, SuggestionStatus>;
  onStatusChange: (idx: number, status: SuggestionStatus) => void;
  onBulkAction: (action: "acceptAll" | "rejectAll" | "resetAll") => void;
}

export function PricingReviewTable({
  suggestions,
  statuses,
  onStatusChange,
  onBulkAction,
}: PricingReviewTableProps) {
  const accepted = Object.values(statuses).filter((s) => s === "accepted").length;
  const rejected = Object.values(statuses).filter((s) => s === "rejected").length;
  const pending = suggestions.length - accepted - rejected;

  const acceptedTotal = suggestions.reduce((sum, s, idx) => {
    if (statuses[idx] === "accepted") return sum + computeRowTotal(s);
    return sum;
  }, 0);

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          AI Line Item Suggestions
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="text-green-600 font-medium">{accepted} accepted</span>
          <span>·</span>
          <span className="text-red-500 font-medium">{rejected} rejected</span>
          <span>·</span>
          <span>{pending} pending</span>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-1.5">
        <button
          className="inline-flex items-center h-6 px-2 text-[10px] font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={() => onBulkAction("acceptAll")}
        >
          <CheckCheck className="h-3 w-3 mr-1" />
          Accept All
        </button>
        <button
          className="inline-flex items-center h-6 px-2 text-[10px] font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={() => onBulkAction("rejectAll")}
        >
          <X className="h-3 w-3 mr-1" />
          Reject All
        </button>
        <button
          className="inline-flex items-center h-6 px-2 text-[10px] font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
          onClick={() => onBulkAction("resetAll")}
        >
          <Undo2 className="h-3 w-3 mr-1" />
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden pco-light-border">
        <div className="overflow-x-auto">
          <table className="w-full text-xs pco-light-row-border">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="w-[28px] p-0"></th>
                <th className="text-left p-2 font-medium" style={{ minWidth: 260 }}>Description</th>
                <th className="text-left p-2 font-medium w-[180px]">Spec Section</th>
                <th className="text-right p-2 font-medium w-[100px]">Estimate</th>
                <th className="text-center p-2 font-medium w-[80px]">Confidence</th>
                <th className="text-center p-2 font-medium w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion, idx) => {
                const status = statuses[idx] ?? "pending";
                const rowTotal = computeRowTotal(suggestion);
                const isExpanded = expandedRows.has(idx);
                const refProjects = suggestion.sourceProjects.map((p) => generateRefData(p, suggestion));

                const rowClasses =
                  status === "accepted"
                    ? "border-l-2 border-l-green-500 bg-green-50/50 dark:bg-green-950/30"
                    : status === "rejected"
                      ? "opacity-50 line-through decoration-red-400"
                      : "hover:bg-muted/30";

                return (
                  <>
                    <tr key={idx} className={`border-b transition-colors ${rowClasses}`}>
                      <td className="p-0 text-center align-middle">
                        <button
                          className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          onClick={() => toggleRow(idx)}
                          title={isExpanded ? "Collapse" : "Expand reference data"}
                        >
                          {isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5" />
                            : <ChevronRight className="h-3.5 w-3.5" />
                          }
                        </button>
                      </td>
                      <td className="p-2">
                        <span className="text-xs">{suggestion.description}</span>
                      </td>
                      <td className="p-2">
                        <span className="inline-flex items-center rounded-full border px-1.5 py-0 font-mono text-[10px] text-foreground">
                          {suggestion.costCode}
                        </span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">{suggestion.costCodeTitle}</span>
                      </td>

                      {/* Estimate */}
                      <td className="text-right p-2 font-semibold">
                        ${formatCurrency(rowTotal)}
                      </td>

                      {/* Confidence */}
                      <td className="text-center p-2">
                        <ConfidenceIndicator score={suggestion.confidence} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-0.5">
                          {status !== "accepted" && (
                            <button
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/50 transition-colors"
                              onClick={() => onStatusChange(idx, "accepted")}
                              title="Accept"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                          )}
                          {status === "accepted" && (
                            <button
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950/50 transition-colors"
                              onClick={() => onStatusChange(idx, "pending")}
                              title="Undo accept"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          {status !== "rejected" && (
                            <button
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                              onClick={() => onStatusChange(idx, "rejected")}
                              title="Reject"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </button>
                          )}
                          {status === "rejected" && (
                            <button
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/50 transition-colors"
                              onClick={() => onStatusChange(idx, "pending")}
                              title="Undo reject"
                            >
                              <Undo2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded reference data */}
                    {isExpanded && (
                      <tr key={`${idx}-ref`} className="border-b">
                        <td colSpan={6} className="p-0">
                          <div className="bg-muted/20 dark:bg-muted/10 px-4 py-2">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                              Reference Projects ({suggestion.source})
                            </div>
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="text-left py-1 pr-3 font-medium">Reference</th>
                                  <th className="text-right py-1 pr-3 font-medium w-[100px]">Cost</th>
                                  <th className="text-right py-1 font-medium w-[80px]">Similarity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {refProjects.map((ref, rIdx) => (
                                  <tr key={rIdx} className="border-t border-dashed border-muted-foreground/15">
                                    <td className="py-1 pr-3">{ref.reference}</td>
                                    <td className="py-1 pr-3 text-right font-medium">${formatCurrency(ref.total)}</td>
                                    <td className="py-1 text-right">
                                      <span className={`font-medium ${ref.similarity >= 85 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                                        {ref.similarity}%
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>

            {/* Summary row */}
            <tfoot>
              <tr className="bg-muted/40 border-t-2">
                <td colSpan={3} className="p-2 text-right font-semibold text-xs">
                  Total
                </td>
                <td className="p-2 text-right font-bold text-sm text-green-700 dark:text-green-400">
                  ${formatCurrency(acceptedTotal)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
}
