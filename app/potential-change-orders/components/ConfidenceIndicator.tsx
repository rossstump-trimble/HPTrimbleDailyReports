"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";

type ConfidenceLevel = "high" | "medium" | "low";

function getLevel(score: number): ConfidenceLevel {
  if (score >= 90) return "high";
  if (score >= 75) return "medium";
  return "low";
}

const levelStyles: Record<ConfidenceLevel, { text: string; bg: string; border: string; bar: string }> = {
  high: { text: "text-green-700 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950", border: "border-green-200 dark:border-green-800", bar: "bg-green-500" },
  medium: { text: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950", border: "border-yellow-200 dark:border-yellow-800", bar: "bg-yellow-500" },
  low: { text: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950", border: "border-red-200 dark:border-red-800", bar: "bg-red-500" },
};

const levelLabels: Record<ConfidenceLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface ConfidenceIndicatorProps {
  score: number;
  showBar?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ConfidenceIndicator({ score, showBar = false, showLabel = false, size = "sm" }: ConfidenceIndicatorProps) {
  const level = getLevel(score);
  const styles = levelStyles[level];
  const needsReview = score < 80;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5 cursor-default">
            <span
              className={`inline-flex items-center rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"} font-semibold`}
            >
              {score}%
              {showLabel && <span className="ml-1 font-normal">{levelLabels[level]}</span>}
            </span>
            {needsReview && (
              <AlertTriangle className={`h-3 w-3 flex-shrink-0 ${styles.text}`} />
            )}
            {showBar && (
              <span className="inline-block w-12 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <span
                  className={`block h-full rounded-full transition-all duration-700 ${styles.bar}`}
                  style={{ width: `${score}%` }}
                />
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <p className="text-xs font-medium">{levelLabels[level]} Confidence ({score}%)</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Based on historical project similarity, data recency, and cost code match strength.
          </p>
          {needsReview && (
            <p className="text-[11px] text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
              Needs PM review — below 80% threshold
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ConfidenceSummaryBarProps {
  score: number;
  label?: string;
}

export function ConfidenceSummaryBar({ score, label }: ConfidenceSummaryBarProps) {
  const level = getLevel(score);
  const styles = levelStyles[level];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label ?? "Overall Confidence"}</span>
        <span className={`text-sm font-bold ${styles.text}`}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${styles.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
