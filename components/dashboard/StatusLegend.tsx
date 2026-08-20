"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GRID_CELL_COLORS, STATUS_META } from "@/lib/dashboard/statusMeta";
import type { CellStatus } from "@/lib/dashboard/types";

const ORDER: CellStatus[] = ["logged", "received", "missing", "na"];

export function StatusLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {ORDER.map((status) => {
        const meta = STATUS_META[status];
        return (
          <li key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-sm border border-black/5"
              style={{
                backgroundColor: GRID_CELL_COLORS[status].bg,
                boxShadow: `inset 0 2px 0 ${GRID_CELL_COLORS[status].accent}`,
              }}
            />
            <span>{meta.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
