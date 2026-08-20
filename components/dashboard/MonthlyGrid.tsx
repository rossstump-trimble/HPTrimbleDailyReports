"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { GRID_CELL_COLORS } from "@/lib/dashboard/statusMeta";
import type { DashboardCell, DashboardPayload, DashboardTradePartner } from "@/lib/dashboard/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusLegend } from "./StatusLegend";

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function cellTooltip(cell: DashboardCell, trade: DashboardTradePartner): {
  title: string;
  message: string;
  stats?: string;
} {
  const date = formatLongDate(cell.date);
  const stats =
    cell.manpower != null || cell.hours != null
      ? `${cell.manpower ?? "—"} people · ${cell.hours ?? "—"} hours`
      : undefined;

  if (cell.isFuture) {
    return {
      title: "Not yet",
      message: `${trade.name} — ${date} has not happened yet. No daily is expected.`,
    };
  }

  switch (cell.status) {
    case "logged":
      return {
        title: "Logged in Project Sight",
        message: `${trade.name} was on site ${date}. Their daily is received and logged.`,
        stats,
      };
    case "received":
      return {
        title: "Received — HP has not logged",
        message: `${trade.name} turned in a daily for ${date}. Hensel Phelps still needs to enter it in Project Sight.`,
        stats,
      };
    case "missing":
      return {
        title: "Daily not received",
        message: `${trade.name} was on site ${date}, but has not turned in a daily report.`,
      };
    case "na":
    default:
      return {
        title: "Not on site",
        message: `${trade.name} was not on site ${date}. No daily is expected.`,
      };
  }
}

function GridCell({
  cell,
  trade,
}: {
  cell: DashboardCell;
  trade: DashboardTradePartner;
}) {
  const colors = GRID_CELL_COLORS[cell.status];
  const tip = cellTooltip(cell, trade);

  return (
    <td className={cn("p-0 h-10 w-[38px] border-l border-slate-200", cell.isToday && "relative z-[1]")}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="block h-10 w-full cursor-default hover:brightness-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset"
            style={{
              backgroundColor: colors.bg,
              boxShadow: cell.isToday
                ? `inset 0 3px 0 ${colors.accent}, inset 0 0 0 2px rgb(14 165 233)`
                : `inset 0 3px 0 ${colors.accent}`,
            }}
            aria-label={`${trade.name}, ${tip.title}. ${tip.message}`}
          />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[240px] font-sans text-left px-3 py-2.5 space-y-1"
        >
          <p className="text-[11px] font-semibold tracking-wide uppercase opacity-80">{tip.title}</p>
          <p className="text-xs leading-snug font-sans">{tip.message}</p>
          {tip.stats ? (
            <p className="text-[11px] font-medium tabular-nums opacity-90 pt-0.5">{tip.stats}</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </td>
  );
}

export function MonthlyGrid({ data }: { data: DashboardPayload }) {
  const [query, setQuery] = useState("");
  const days = Array.from({ length: data.daysInMonth }, (_, i) => i + 1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter(
      (row) =>
        row.trade.name.toLowerCase().includes(q) ||
        row.trade.category.toLowerCase().includes(q),
    );
  }, [data.rows, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusLegend />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter trades…"
          className="h-8 w-48 rounded-md border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <TooltipProvider delayDuration={200}>
        <div id="dashboard-monthly-grid" className="relative w-full overflow-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="border-collapse text-sm" style={{ minWidth: `${220 + data.daysInMonth * 40 + 140}px` }}>
            <thead>
              <tr className="border-b border-border">
                <th
                  className="sticky left-0 z-30 bg-card text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-r border-border"
                  style={{ minWidth: "200px", width: "200px" }}
                >
                  Trade partner
                </th>
                {days.map((day) => {
                  const sample = data.rows[0]?.cells[day - 1];
                  return (
                    <th
                      key={day}
                      className={cn(
                        "px-0 py-2 text-center font-medium border-l border-border/70",
                        sample?.isWeekend && "bg-muted/40",
                        sample?.isToday && "bg-sky-50 dark:bg-sky-950/40",
                      )}
                      style={{ minWidth: "38px", width: "38px" }}
                    >
                      <div className="text-[9px] uppercase text-muted-foreground">{sample?.weekday}</div>
                      <div className={cn("text-xs", sample?.isToday ? "text-sky-700 dark:text-sky-300 font-bold" : "text-foreground")}>
                        {day}
                      </div>
                    </th>
                  );
                })}
                <th className="sticky right-[72px] z-20 bg-card px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-l border-border" style={{ minWidth: "72px" }}>
                  Manpower
                </th>
                <th className="sticky right-0 z-20 bg-card px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-l border-border" style={{ minWidth: "72px" }}>
                  Hours
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.trade.id} className="border-b border-border/70 last:border-b-0">
                  <th
                    className="sticky left-0 z-20 bg-card text-left px-3 py-2 border-r border-border font-medium"
                    style={{ minWidth: "200px" }}
                  >
                    <div className="text-[13px] text-foreground leading-tight">{row.trade.name}</div>
                    <div className="text-[10px] text-muted-foreground">{row.trade.category}</div>
                  </th>
                  {row.cells.map((cell) => (
                    <GridCell key={cell.date} cell={cell} trade={row.trade} />
                  ))}
                  <td className="sticky right-[72px] z-10 bg-card text-center text-xs font-semibold tabular-nums border-l border-border">
                    {row.monthTotalManpower.toLocaleString()}
                  </td>
                  <td className="sticky right-0 z-10 bg-card text-center text-xs font-semibold tabular-nums border-l border-border">
                    {row.monthTotalHours.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TooltipProvider>

      <p className="text-[11px] text-muted-foreground">
        Hover a cell for status and manpower / hours. Grey is not on site or still ahead of {data.asOfDate}. Amber means the trade turned it in — HP has not logged it in Project Sight.
      </p>
    </div>
  );
}
