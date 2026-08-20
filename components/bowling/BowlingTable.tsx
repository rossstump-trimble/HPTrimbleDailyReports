"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { DailyDetailModal, BowlingCellDetail } from "./DailyDetailModal";
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
}

function SubmittedCell({
  cell,
  onClick,
}: {
  cell: BowlingCellWithReport;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-full min-h-[3rem] flex flex-col items-center justify-center gap-0.5",
        "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70",
        "rounded transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800",
        "px-1 py-1 text-center"
      )}
      title={`${cell.tradePartnerName} – ${cell.date}\n${cell.workerCount} workers · ${cell.totalHours}h`}
    >
      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 leading-none">
        {cell.workerCount ?? 0}w
      </span>
      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 leading-none">
        {cell.totalHours ?? 0}h
      </span>
    </button>
  );
}

function MissingCell() {
  return (
    <div
      className={cn(
        "w-full h-full min-h-[3rem] flex items-center justify-center",
        "bg-red-50 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-900"
      )}
    >
      <span className="text-[11px] font-bold text-red-500 dark:text-red-400">M</span>
    </div>
  );
}

function NaCell() {
  return (
    <div className="w-full h-full min-h-[3rem] flex items-center justify-center rounded bg-muted/30">
      <span className="text-[10px] text-muted-foreground">—</span>
    </div>
  );
}

export function BowlingTable({ rows, daysInMonth, month }: BowlingTableProps) {
  const [selectedCell, setSelectedCell] = useState<BowlingCellDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleCellClick = (cell: BowlingCellWithReport, tradeCategory?: string) => {
    setSelectedCell({
      ...cell,
      tradePartnerCategory: tradeCategory,
    });
    setModalOpen(true);
  };

  return (
    <>
      <div className="relative w-full overflow-x-auto rounded-md border border-border">
        <table className="border-collapse text-sm" style={{ minWidth: `${200 + daysInMonth * 52 + 120}px` }}>
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              {/* Sticky trade partner header */}
              <th
                className="sticky left-0 z-20 bg-muted/60 text-left px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap border-r border-border"
                style={{ minWidth: "200px", width: "200px" }}
              >
                Trade Partner
              </th>
              {/* Day columns */}
              {days.map((day) => (
                <th
                  key={day}
                  className="px-1 py-2 font-medium text-muted-foreground text-xs text-center"
                  style={{ minWidth: "48px", width: "48px" }}
                >
                  {day}
                </th>
              ))}
              {/* JTD totals column */}
              <th
                className="px-2 py-2 font-medium text-muted-foreground text-xs text-center whitespace-nowrap border-l border-border"
                style={{ minWidth: "110px", width: "110px" }}
              >
                MTD Totals
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={row.tradePartner.id}
                className={cn(
                  "border-b border-border last:border-b-0",
                  rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
              >
                {/* Sticky trade partner name */}
                <td
                  className={cn(
                    "sticky left-0 z-10 px-3 py-2 border-r border-border",
                    rowIdx % 2 === 0
                      ? "bg-background"
                      : "bg-muted/20"
                  )}
                  style={{ minWidth: "200px", width: "200px" }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-foreground leading-tight">
                      {row.tradePartner.name}
                    </span>
                    {row.tradePartner.category && (
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {row.tradePartner.category}
                      </span>
                    )}
                  </div>
                </td>

                {/* Day cells */}
                {row.cells.map((cell) => (
                  <td
                    key={cell.dayNumber}
                    className="p-0.5 align-middle"
                    style={{ width: "48px", minWidth: "48px" }}
                  >
                    {cell.status === "submitted" ? (
                      <SubmittedCell
                        cell={cell}
                        onClick={() =>
                          handleCellClick(cell, row.tradePartner.category)
                        }
                      />
                    ) : cell.status === "missing" ? (
                      <MissingCell />
                    ) : (
                      <NaCell />
                    )}
                  </td>
                ))}

                {/* MTD totals */}
                <td className="px-2 py-2 border-l border-border text-center" style={{ minWidth: "110px" }}>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {row.monthTotalWorkers}w
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {row.monthTotalHours}h
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {row.submittedDaysCount}/{daysInMonth} days
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800" />
          <span>Submitted — click to view details</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 flex items-center justify-center">
            <span className="text-[8px] font-bold text-red-500">M</span>
          </div>
          <span>Missing / Delinquent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted/30" />
          <span>N/A</span>
        </div>
      </div>

      <DailyDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        cell={selectedCell}
      />
    </>
  );
}
