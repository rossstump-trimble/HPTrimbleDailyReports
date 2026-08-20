"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, QrCode, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BowlingTable, BowlingRow } from "@/components/bowling/BowlingTable";

interface BowlingMatrixResponse {
  projectId: string;
  projectCode: string;
  projectName: string;
  month: string;
  daysInMonth: number;
  rows: BowlingRow[];
}

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function BowlingPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;

  const [month, setMonth] = useState<string>(currentYearMonth());
  const [data, setData] = useState<BowlingMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bowling/${projectId}?month=${month}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const json = await res.json() as BowlingMatrixResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bowling data.");
    } finally {
      setLoading(false);
    }
  }, [projectId, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const intakeUrl = `/intake/${projectId}`;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-none flex items-center gap-3 px-4 py-3 border-b border-border bg-background flex-wrap">
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Projects
        </button>

        <div className="h-4 w-px bg-border" />

        {data ? (
          <Badge variant="outline" className="font-mono text-sm font-semibold px-2 py-0.5">
            {data.projectCode}
          </Badge>
        ) : (
          <Badge variant="outline" className="font-mono text-sm font-semibold px-2 py-0.5">
            {projectId.toUpperCase()}
          </Badge>
        )}

        <span className="text-sm font-semibold text-foreground truncate max-w-[240px]">
          {data?.projectName ?? "Master Bowling Sheet"}
        </span>

        <div className="flex-1" />

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="month-input" className="text-xs text-muted-foreground whitespace-nowrap">
            Month
          </label>
          <input
            id="month-input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-sm border border-input rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={() => router.push(intakeUrl)}
          className="flex items-center gap-1.5"
        >
          <QrCode className="h-3.5 w-3.5" />
          Trade QR Intake
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading bowling sheet…</span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                Daily Report Compliance ·{" "}
                {new Date(data.month + "-01").toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <span className="text-xs text-muted-foreground">
                {data.rows.length} trade partners
              </span>
            </div>

            <BowlingTable
              rows={data.rows}
              daysInMonth={data.daysInMonth}
              month={data.month}
            />
          </div>
        )}
      </div>
    </div>
  );
}
