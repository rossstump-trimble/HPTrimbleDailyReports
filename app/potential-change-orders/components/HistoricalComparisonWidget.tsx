"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, History, TrendingUp, TrendingDown } from "lucide-react";
import type { HistoricalProject } from "./types";

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface HistoricalComparisonWidgetProps {
  projects: HistoricalProject[];
  currentEstimate: number;
}

export function HistoricalComparisonWidget({ projects, currentEstimate }: HistoricalComparisonWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);

  if (projects.length === 0) return null;

  const avgCost = projects.reduce((sum, p) => sum + p.actualCost, 0) / projects.length;
  const minCost = Math.min(...projects.map((p) => p.actualCost));
  const maxCost = Math.max(...projects.map((p) => p.actualCost));
  const vsAvgDelta = currentEstimate - avgCost;
  const vsAvgPercent = ((vsAvgDelta / avgCost) * 100).toFixed(1);

  return (
    <div className="rounded-lg border">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center">
            <History className="h-3 w-3 text-white" />
          </span>
          <span className="text-left">
            <span className="text-xs font-semibold">Historical Comparison</span>
            <span className="text-[11px] text-muted-foreground ml-2">
              {projects.length} similar project{projects.length !== 1 ? "s" : ""} found
            </span>
          </span>
        </span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t">
          {/* Aggregate stats */}
          <div className="grid grid-cols-3 gap-2 pt-2.5">
            <div className="rounded-md border bg-muted/30 px-2.5 py-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Cost</p>
              <p className="text-sm font-bold">${formatCurrency(avgCost)}</p>
            </div>
            <div className="rounded-md border bg-muted/30 px-2.5 py-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Range</p>
              <p className="text-[11px] font-medium">
                ${formatCurrency(minCost)} – ${formatCurrency(maxCost)}
              </p>
            </div>
            <div className="rounded-md border bg-muted/30 px-2.5 py-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">vs. Average</p>
              <div className="flex items-center justify-center gap-1">
                {vsAvgDelta >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-600" />
                )}
                <span className={`text-sm font-bold ${vsAvgDelta >= 0 ? "text-red-500" : "text-green-600"}`}>
                  {vsAvgDelta >= 0 ? "+" : ""}{vsAvgPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Individual project cards */}
          <div className="space-y-1.5">
            {projects.map((project, idx) => {
              const isOpen = expandedProject === idx;
              return (
                <div key={idx} className="rounded-lg border transition-all hover:border-amber-300">
                  <button
                    onClick={() => setExpandedProject(isOpen ? null : idx)}
                    className="w-full text-left px-3 py-2"
                  >
                    <span className="flex items-center justify-between">
                      <span className="min-w-0">
                        <span className="text-xs font-medium">{project.name}</span>
                        <span className="text-[11px] text-muted-foreground ml-2">{project.date}</span>
                      </span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-semibold">${formatCurrency(project.actualCost)}</span>
                        <span
                          className={`inline-flex items-center rounded-full border text-[10px] px-1.5 py-0 font-semibold ${
                            project.marginPercent <= 0
                              ? "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800"
                              : "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800"
                          }`}
                        >
                          {project.variance}
                        </span>
                        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </span>
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5 truncate">{project.similarItem}</span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-2.5 border-t pt-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Labor</p>
                          <p className="text-xs font-medium">${formatCurrency(project.laborCost)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {((project.laborCost / project.actualCost) * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Material</p>
                          <p className="text-xs font-medium">${formatCurrency(project.materialCost)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {((project.materialCost / project.actualCost) * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Equipment</p>
                          <p className="text-xs font-medium">${formatCurrency(project.equipmentCost)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {((project.equipmentCost / project.actualCost) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
