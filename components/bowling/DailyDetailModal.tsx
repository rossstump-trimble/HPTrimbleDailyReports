"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Users, Clock, Wrench, FileText, AlertTriangle, User, Camera, Paperclip } from "lucide-react";
import { DailyReport } from "@/types/hpproto";
import {
  DEFAULT_DESTINATION,
  DESTINATION_COOKIE,
  destinationFromCookieWithFallback,
  type ProjectSightDestination,
} from "@/lib/projectsight/destination";

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
  const [tidReady, setTidReady] = useState(false);
  const [destination, setDestination] = useState<ProjectSightDestination | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sentId, setSentId] = useState<string | null>(null);
  const [attached, setAttached] = useState(true);

  useEffect(() => {
    if (!open) return;
    const raw = document.cookie
      .split("; ")
      .find((part) => part.startsWith(`${DESTINATION_COOKIE}=`));
    setDestination(
      destinationFromCookieWithFallback(raw ? raw.slice(DESTINATION_COOKIE.length + 1) : null),
    );
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { authenticated?: boolean; mode?: string }) => {
        setTidReady(Boolean(data.authenticated && data.mode === "tid"));
      })
      .catch(() => setTidReady(false));
    setSendError("");
    setSentId(cell?.fullReport?.projectSightDailyId ?? null);
    setAttached(true);
  }, [open, cell?.fullReport?.projectSightDailyId]);

  if (!cell) return null;

  const report = cell.fullReport;
  const hasSta = cell.staCompleted === true || Boolean(report?.staFiles && report.staFiles.length > 0);
  const hasFile = Boolean(report?.rawSourcePath);
  const canSend = Boolean(
    tidReady && destination?.portfolioId && destination.projectId && report?.id,
  );

  async function handleSend() {
    if (!report?.id) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch(`/api/dailyreports/${report.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId: destination?.portfolioId,
          projectId: destination?.projectId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Approval failed");
      if (json.projectSightDailyId) {
        setSentId(json.projectSightDailyId);
        setAttached(Boolean(json.attached));
      }
      if (cell?.fullReport) {
        cell.fullReport.approvalStatus = "approved";
        if (json.projectSightDailyId) {
          cell.fullReport.projectSightDailyId = json.projectSightDailyId;
        }
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setSending(false);
    }
  }

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
            {hasSta ? (
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                STA Completed {report?.staFiles && report.staFiles.length > 0 ? `(${report.staFiles.length} photos)` : ''}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Missing STA Form
              </Badge>
            )}
            {report?.submittedBy && (
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-200"
              >
                <User className="h-3.5 w-3.5 text-blue-600" />
                Reporter: {report.submittedBy}
              </Badge>
            )}
          </div>

          {!hasSta && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100">Missing STA Safety Form</p>
                <p>
                  No Safety Task Analysis photos were attached to this daily report.
                  {report?.submittedBy && (
                    <span className="block mt-0.5 font-medium text-amber-900 dark:text-amber-100">
                      Original Reporter: {report.submittedBy}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

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

              <div className="pt-2 border-t space-y-2">
                {/* Approval & Sync Status */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Review Status
                  </span>
                  {sentId ? (
                    <Badge className="bg-emerald-600 text-white text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Approved &amp; Synced (PS #{sentId})
                    </Badge>
                  ) : report.approvalStatus === "approved" ? (
                    <Badge className="bg-blue-600 text-white text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Approved Locally
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400 text-xs gap-1">
                      <Clock className="h-3 w-3" /> Pending Superintendent Review
                    </Badge>
                  )}
                </div>

                {sentId && (
                  <p className="text-xs text-muted-foreground">
                    ProjectSight daily #{sentId}
                    {attached
                      ? " · file attached"
                      : hasFile
                        ? " · file not attached"
                        : " · created from spoken daily"}
                  </p>
                )}
                {!hasFile && !sentId && (
                  <p className="text-xs text-muted-foreground">
                    Field daily — ProjectSight will receive the structured narrative.
                  </p>
                )}
                {!tidReady && !sentId && (
                  <p className="text-xs text-muted-foreground">
                    Sign in with Trimble Identity to dispatch directly to live ProjectSight upon approval.
                  </p>
                )}
                {tidReady && !destination?.projectId && !sentId && (
                  <p className="text-xs text-muted-foreground">
                    Defaulting to Hensel Phelps Demo Project ({destination?.portfolioId?.slice(0, 8)}… / {destination?.projectId}).
                  </p>
                )}
                {sendError && <p className="text-xs text-destructive">{sendError}</p>}

                {!sentId && (
                  <Button
                    type="button"
                    className="w-full text-white font-semibold"
                    style={{ backgroundColor: "#0063a3" }}
                    disabled={sending}
                    onClick={handleSend}
                  >
                    {sending
                      ? "Approving & Syncing to ProjectSight…"
                      : tidReady
                        ? "Approve & Send to ProjectSight"
                        : "Approve Daily Report"}
                  </Button>
                )}
              </div>
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
