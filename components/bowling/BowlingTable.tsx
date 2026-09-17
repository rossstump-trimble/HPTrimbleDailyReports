"use client";

import React, { useState } from "react";
import { CalendarCheck, CalendarOff, CalendarX, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DailyDetailModal, BowlingCellDetail } from "./DailyDetailModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DailyReport } from "@/types/hpproto";

export interface BowlingCellWithReport {
  date: string;
  dayNumber: number;
  tradePartnerId: string;
  tradePartnerName: string;
  status: "submitted" | "missing" | "na";
  dailyReportId?: string;
  workerCount?: number;
  totalHours?: number;
  staCompleted?: boolean;
  fullReport?: DailyReport | null;
}

export interface BowlingRow {
  tradePartner: {
    id: string;
    name: string;
    category?: string;
  };
  cells: BowlingCellWithReport[];
  monthTotalWorkers: number;
  monthTotalHours: number;
  submittedDaysCount: number;
}

export interface BowlingTableProps {
  rows: BowlingRow[];
  daysInMonth: number;
  month: string;
  projectId?: string;
  onRefresh?: () => void;
  onDeleteCompany?: (companyId: string, companyName: string) => void;
}

function SubmittedCell({
  cell,
  onClick,
}: {
  cell: BowlingCellWithReport;
  onClick: () => void;
}) {
  const hasSta = cell.staCompleted === true || (cell.fullReport?.staFiles && cell.fullReport.staFiles.length > 0);
  const reporter = cell.fullReport?.submittedBy;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-8 flex flex-col items-center justify-center relative",
        "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70",
        "rounded transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800",
        "p-0.5 text-center leading-none"
      )}
      title={`${cell.tradePartnerName} – ${cell.date}\n${cell.workerCount} workers · ${cell.totalHours}h\n${reporter ? `Reporter: ${reporter}\n` : ''}${hasSta ? 'STA Attached' : '⚠️ Missing STA Form'}\nClick to view report details`}
    >
      {!hasSta && (
        <span
          className="absolute -top-1 -right-1 px-1 bg-amber-500 text-white rounded text-[7px] font-black shadow-xs tracking-tight"
          title="Missing STA Form"
        >
          STA
        </span>
      )}
      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 leading-none">
        {cell.workerCount ?? 0}w
      </span>
      <span className="text-[8px] text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">
        {cell.totalHours ?? 0}h
      </span>
    </button>
  );
}

function MissingCell({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full h-8 flex items-center justify-center cursor-pointer transition-colors",
        "bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 rounded border border-red-200 dark:border-red-900"
      )}
      title="Missing / Required on site · Click to adjust schedule / white out"
    >
      <span className="text-[9px] font-bold text-red-500 dark:text-red-400">M</span>
    </button>
  );
}

function NaCell({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full h-8 flex items-center justify-center rounded bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
      )}
      title="Not on site (N/A) · Click to adjust schedule / require onsite"
    >
      <span className="text-[9px] text-muted-foreground/60">—</span>
    </button>
  );
}

function ScheduleOverrideModal({
  open,
  onOpenChange,
  cell,
  projectId,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: BowlingCellWithReport | null;
  projectId?: string;
  onUpdated?: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  if (!cell) return null;

  const handleSetOverride = async (status: "onsite" | "offsite" | "clear") => {
    if (!projectId) return;
    setUpdating(true);
    try {
      await fetch(`/api/projects/${projectId}/trade-overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradePartnerId: cell.tradePartnerId,
          date: cell.date,
          status,
        }),
      });
      onOpenChange(false);
      onUpdated?.();
    } catch (err) {
      console.error("[schedule override failed]", err);
    } finally {
      setUpdating(false);
    }
  };

  const isMissing = cell.status === "missing";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isMissing
                  ? "bg-red-100 dark:bg-red-950/60 text-red-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isMissing ? <CalendarX size={16} /> : <CalendarCheck size={16} />}
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {cell.tradePartnerName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Schedule for {cell.date} (Day {cell.dayNumber})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Current Status
            </span>
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              {isMissing ? (
                <span className="text-red-600 dark:text-red-400 font-bold">
                  ● Missing (Required On Site)
                </span>
              ) : (
                <span className="text-muted-foreground font-semibold">
                  ● Not on Site (Whited out / N/A)
                </span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isMissing
                ? "This trade was expected on site for this shift but has not submitted a daily report."
                : "This trade is marked off-site / excused. It does not count towards missing delinquency penalties."}
            </p>
          </div>

          <div className="space-y-2">
            {isMissing ? (
              <Button
                type="button"
                className="w-full text-xs font-semibold gap-1.5 h-9"
                variant="outline"
                disabled={updating}
                onClick={() => handleSetOverride("offsite")}
              >
                <CalendarOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Mark as Not on Site (White Out / N/A)</span>
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full text-xs font-semibold gap-1.5 h-9"
                variant="outline"
                disabled={updating}
                onClick={() => handleSetOverride("onsite")}
              >
                <CalendarCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Mark as Required Onsite (Require Daily)</span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-foreground h-8"
              disabled={updating}
              onClick={() => handleSetOverride("clear")}
            >
              Reset to Project Schedule Default
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BowlingTable({
  rows,
  daysInMonth,
  month,
  projectId,
  onRefresh,
  onDeleteCompany,
}: BowlingTableProps) {
  const [selectedCell, setSelectedCell] = useState<BowlingCellDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [overrideCell, setOverrideCell] = useState<BowlingCellWithReport | null>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleCellClick = (cell: BowlingCellWithReport, tradeCategory?: string) => {
    setSelectedCell({
      ...cell,
      tradePartnerCategory: tradeCategory,
    });
    setModalOpen(true);
  };

  const handleUnsubmittedCellClick = async (
    cell: BowlingCellWithReport,
    e: React.MouseEvent
  ) => {
    // Quick Shift-click shortcut to immediately toggle between offsite and onsite
    if (e.shiftKey && projectId) {
      const nextStatus = cell.status === "missing" ? "offsite" : "onsite";
      try {
        await fetch(`/api/projects/${projectId}/trade-overrides`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tradePartnerId: cell.tradePartnerId,
            date: cell.date,
            status: nextStatus,
          }),
        });
        onRefresh?.();
        return;
      } catch (err) {
        console.error("[shift-click override error]", err);
      }
    }

    setOverrideCell(cell);
    setOverrideModalOpen(true);
  };

  return (
    <>
      <div className="relative w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table
          className="border-collapse w-full text-xs"
          style={{ minWidth: `${160 + daysInMonth * 27 + 80}px` }}
        >
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              {/* Sticky trade partner header */}
              <th
                className="sticky left-0 z-20 bg-muted/90 backdrop-blur-sm text-left px-2.5 py-1.5 font-bold text-muted-foreground text-[11px] uppercase tracking-wider whitespace-nowrap border-r border-border"
                style={{ minWidth: "160px", width: "160px" }}
              >
                Trade Partner
              </th>
              {/* Day columns */}
              {days.map((day) => (
                <th
                  key={day}
                  className="px-0.5 py-1.5 font-bold text-muted-foreground text-[11px] text-center"
                  style={{ minWidth: "27px", width: "27px" }}
                >
                  {day}
                </th>
              ))}
              {/* MTD totals column */}
              <th
                className="px-1.5 py-1.5 font-bold text-muted-foreground text-[11px] text-center whitespace-nowrap border-l border-border"
                style={{ minWidth: "80px", width: "80px" }}
              >
                MTD
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={daysInMonth + 2}
                  className="px-6 py-12 text-center text-sm text-muted-foreground"
                >
                  No trade partner companies in this bowling sheet yet. Click &quot;Manage Companies&quot; above to load from ProjectSight or add trade partners.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
              <tr
                key={row.tradePartner.id}
                className={cn(
                  "border-b border-border last:border-b-0 transition-colors",
                  rowIdx % 2 === 0 ? "bg-background" : "bg-muted/15"
                )}
              >
                {/* Sticky trade partner name */}
                <td
                  className={cn(
                    "sticky left-0 z-10 px-2.5 py-1 border-r border-border group/row",
                    rowIdx % 2 === 0 ? "bg-background" : "bg-muted/15"
                  )}
                  style={{ minWidth: "160px", width: "160px" }}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex flex-col truncate min-w-0">
                      <span
                        className="font-semibold text-xs text-foreground truncate leading-tight"
                        title={row.tradePartner.name}
                      >
                        {row.tradePartner.name}
                      </span>
                      {row.tradePartner.category && (
                        <span className="text-[9px] text-muted-foreground truncate leading-tight">
                          {row.tradePartner.category}
                        </span>
                      )}
                    </div>
                    {onDeleteCompany && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCompany(row.tradePartner.id, row.tradePartner.name);
                        }}
                        className="opacity-0 group-hover/row:opacity-100 p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-all shrink-0"
                        title={`Delete ${row.tradePartner.name}`}
                        aria-label={`Delete ${row.tradePartner.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </td>

                {/* Day cells */}
                {row.cells.map((cell) => (
                  <td
                    key={cell.dayNumber}
                    className="p-[1px] align-middle"
                    style={{ width: "27px", minWidth: "27px" }}
                  >
                    {cell.status === "submitted" ? (
                      <SubmittedCell
                        cell={cell}
                        onClick={() =>
                          handleCellClick(cell, row.tradePartner.category)
                        }
                      />
                    ) : cell.status === "missing" ? (
                      <MissingCell
                        onClick={(e: any) => handleUnsubmittedCellClick(cell, e)}
                      />
                    ) : (
                      <NaCell
                        onClick={(e: any) => handleUnsubmittedCellClick(cell, e)}
                      />
                    )}
                  </td>
                ))}

                {/* MTD totals */}
                <td
                  className="px-1.5 py-1 border-l border-border text-center"
                  style={{ minWidth: "80px", width: "80px" }}
                >
                  <div className="flex flex-col items-center gap-0.5 leading-none">
                    <span className="text-[11px] font-bold text-foreground">
                      {row.monthTotalWorkers}w · {row.monthTotalHours}h
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {row.submittedDaysCount}/{daysInMonth}d
                    </span>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800" />
            <span>Submitted (view report)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 flex items-center justify-center">
              <span className="text-[7px] font-bold text-red-500">M</span>
            </div>
            <span>Missing / Required (click to white out)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-muted/20" />
            <span>N/A / Off-site (click to require)</span>
          </div>
        </div>

        <span className="text-[11px] text-muted-foreground italic">
          Tip: Click any cell to adjust daily schedule or Shift+Click to toggle N/A.
        </span>
      </div>

      <DailyDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        cell={selectedCell}
      />

      <ScheduleOverrideModal
        open={overrideModalOpen}
        onOpenChange={setOverrideModalOpen}
        cell={overrideCell}
        projectId={projectId}
        onUpdated={onRefresh}
      />
    </>
  );
}
