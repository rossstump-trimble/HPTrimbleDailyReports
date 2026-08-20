import type { CellStatus } from "@/lib/dashboard/types";

export const STATUS_META: Record<
  CellStatus,
  { label: string; short: string; fill: string; text: string; border: string; bar: string; swatch: string }
> = {
  logged: {
    label: "On site · logged in Project Sight",
    short: "Logged",
    fill: "bg-teal-50 dark:bg-teal-950/50",
    text: "text-teal-800 dark:text-teal-200",
    border: "border-teal-200 dark:border-teal-800",
    bar: "bg-teal-500",
    swatch: "bg-teal-500 dark:bg-teal-600",
  },
  received: {
    label: "On site · received, not logged (HP)",
    short: "HP behind",
    fill: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-800 dark:text-amber-200",
    border: "border-amber-200 dark:border-amber-800",
    bar: "bg-amber-500",
    swatch: "bg-amber-400 dark:bg-amber-500",
  },
  missing: {
    label: "On site · daily not received",
    short: "Missing",
    fill: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-800 dark:text-rose-200",
    border: "border-rose-200 dark:border-rose-800",
    bar: "bg-rose-500",
    swatch: "bg-rose-500 dark:bg-rose-600",
  },
  na: {
    label: "Not on site",
    short: "N/A",
    fill: "bg-slate-100/80 dark:bg-slate-900/40",
    text: "text-slate-400 dark:text-slate-500",
    border: "border-slate-200/80 dark:border-slate-800",
    bar: "bg-slate-300 dark:bg-slate-600",
    swatch: "bg-slate-200 dark:bg-slate-800",
  },
};

export const STATUS_CHART_COLORS: Record<CellStatus, string> = {
  logged: "#14b8a6",
  received: "#f59e0b",
  missing: "#f43f5e",
  na: "#cbd5e1",
};

/** Pale fills from the original inner-cell treatment, used as full-cell backgrounds. */
export const GRID_CELL_COLORS: Record<CellStatus, { bg: string; accent: string }> = {
  logged: { bg: "#f0fdfa", accent: "#14b8a6" },
  received: { bg: "#fffbeb", accent: "#f59e0b" },
  missing: { bg: "#fff1f2", accent: "#f43f5e" },
  na: { bg: "#f8fafc", accent: "#e2e8f0" },
};
