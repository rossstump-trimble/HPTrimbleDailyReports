"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Users, Clock, Wrench, FileText, AlertTriangle } from "lucide-react";
import { DailyReport } from "@/types/hpproto";

export interface BowlingCellDetail {
  date: string;
  dayNumber: number;
  tradePartnerId: string;
  tradePartnerName: string;
  tradePartnerCategory?: string;
  status: "submitted" | "missing" | "na";
  workerCount?: number;
  totalHours?: number;
  staCompleted?: boolean;
  fullReport?: DailyReport | null;
}

interface DailyDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: BowlingCellDetail | null;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DailyDetailModal({ open, onOpenChange, cell }: DailyDetailModalProps) {
  if (!cell) return null;

  const report = cell.fullReport;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {cell.tradePartnerName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {formatDate(cell.date)}
            {cell.tradePartnerCategory && (
              <span className="ml-2 text-xs text-muted-foreground">
                · {cell.tradePartnerCategory}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Headcount & Hours badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
            >
              <Users className="h-3.5 w-3.5" />
              {cell.workerCount ?? 0} workers
            </Badge>
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            >
              <Clock className="h-3.5 w-3.5" />
              {cell.totalHours ?? 0}h total
            </Badge>
            {cell.staCompleted ? (
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                STA Completed
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800"
              >
                <XCircle className="h-3.5 w-3.5" />
                STA Not Completed
              </Badge>
            )}
          </div>

          {report ? (
            <>
              {/* Work Performed */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Work Performed
                  </span>
                </div>
                <p className="text-sm text-foreground bg-muted/40 rounded-md px-3 py-2 min-h-[2.5rem]">
                  {report.locationDescription || (
                    <span className="text-muted-foreground italic">No description provided</span>
                  )}
                </p>
              </div>

              {/* Equipment */}
              {report.equipment && report.equipment.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Equipment
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.equipment.map((item, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes & Delays */}
              {report.notes && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Notes &amp; Delays
                    </span>
                  </div>
                  <p className="text-sm text-foreground bg-muted/40 rounded-md px-3 py-2">
                    {report.notes}
                  </p>
                </div>
              )}

              {/* Crew Breakdown */}
              {report.crewBreakdown && report.crewBreakdown.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Crew Breakdown
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.crewBreakdown.map((entry, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {entry.craft}: {entry.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {report.submittedBy && (
                <p className="text-xs text-muted-foreground pt-1 border-t">
                  Submitted by {report.submittedBy} ·{" "}
                  {new Date(report.submittedAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Detailed report data not available.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
