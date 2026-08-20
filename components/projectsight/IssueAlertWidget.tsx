"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  Clock,
  DollarSign,
  Building2,
  CalendarDays,
  X,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  Monitor,
  CalendarIcon,
  LinkIcon,
} from "lucide-react";
import { mockIssueAlerts } from "@/lib/mock-issue-alerts";
import type { IssueAlert, AlertSeverity, AlertStatus } from "@/types/issue-alerts";

const severityConfig: Record<
  AlertSeverity,
  { label: string; border: string; bg: string; text: string; dot: string }
> = {
  critical: {
    label: "Critical",
    border: "border-l-red-500",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    border: "border-l-orange-500",
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    border: "border-l-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    border: "border-l-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
};

function ConfidencePill({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      : score >= 60
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
        : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums",
              color
            )}
          >
            {score}%
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs">
          AI confidence that this historical issue is relevant to the current
          project based on spec and drawing similarity.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AlertDetailView({
  alert,
  onDismiss,
  onConvert,
  onSpecClick,
}: {
  alert: IssueAlert;
  onDismiss: () => void;
  onConvert: (type: "rfi" | "issue") => void;
  onSpecClick: (specSection: string) => void;
}) {
  const sev = severityConfig[alert.severity];

  return (
    <div className="px-4 pt-3 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
      {/* Rationale */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <Sparkles className="h-3 w-3" />
          Why this was flagged
        </div>
        <p className="text-sm leading-relaxed">{alert.rationale}</p>
      </div>

      {/* Source Reference */}
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <Building2 className="h-3 w-3" />
          Historical Reference
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground text-[11px]">Project</div>
            <div className="font-medium">{alert.historicalProject}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[11px]">Date</div>
            <div className="font-medium">
              {new Date(alert.historicalDate).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-[11px]">
              Spec Section
            </div>
            <span
              role="button"
              onClick={() => onSpecClick(alert.matchedSpecSection)}
              className="font-mono font-medium text-primary hover:text-primary/80 cursor-pointer underline underline-offset-2 decoration-primary/40 transition-colors"
            >
              {alert.matchedSpecSection}
            </span>
          </div>
          <div>
            <div className="text-muted-foreground text-[11px]">Drawing</div>
            <span
              role="button"
              className="font-mono font-medium text-primary hover:text-primary/80 cursor-pointer underline underline-offset-2 decoration-primary/40 transition-colors"
            >
              {alert.matchedDrawing}
            </span>
          </div>
        </div>
      </div>

      {/* Root Cause + Resolution side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <AlertTriangle className="h-3 w-3" />
            Root Cause
          </div>
          <p className="text-sm leading-relaxed">{alert.rootCause}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
            <CheckCircle2 className="h-3 w-3" />
            Suggested Resolution
          </div>
          <p className="text-sm leading-relaxed">{alert.suggestedResolution}</p>
        </div>
      </div>

      {/* Impact + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Cost impact:</span>
            <span className={cn("font-semibold", sev.text)}>
              {alert.costImpact}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Schedule:</span>
            <span className={cn("font-semibold", sev.text)}>
              {alert.scheduleImpactDays} days
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDismiss} className="h-8 text-xs">
            <X className="h-3 w-3 mr-1" />
            Dismiss
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConvert("issue")}
            className="h-8 text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            Convert to Issue
          </Button>
          <Button
            size="sm"
            onClick={() => onConvert("rfi")}
            className="h-8 text-xs"
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Convert to RFI
          </Button>
        </div>
      </div>
    </div>
  );
}

function getNextIssueNumber() {
  return `ISS-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function getTodayStr() {
  return new Date().toLocaleDateString("en-US");
}

function getDueDateStr() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-US");
}

function severityToImportance(sev: AlertSeverity) {
  switch (sev) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Normal";
    case "low":
      return "Low";
  }
}

function severityToType(category: string) {
  switch (category) {
    case "MEP":
      return "Coordination";
    case "Envelope":
      return "Design Conflict";
    case "Fire Protection":
      return "Code Compliance";
    case "Structural":
      return "Design Conflict";
    case "Electrical":
      return "Code Compliance";
    case "Plumbing":
      return "Design Conflict";
    default:
      return "";
  }
}

export function CreateIssuePanel({
  alert,
  onClose,
  onSave,
}: {
  alert: IssueAlert;
  onClose: () => void;
  onSave: () => void;
}) {
  const [number] = useState(getNextIssueNumber);
  const [status, setStatus] = useState("Draft");
  const [subject, setSubject] = useState(alert.alertTitle);
  const [createdOn] = useState(getTodayStr);
  const [type, setType] = useState(severityToType(alert.category));
  const [dueDate] = useState(getDueDateStr);
  const [importance, setImportance] = useState(severityToImportance(alert.severity));
  const [location, setLocation] = useState(alert.matchedDrawing);
  const [description, setDescription] = useState(
    `${alert.rationale}\n\nRoot Cause: ${alert.rootCause}\n\nSuggested Resolution: ${alert.suggestedResolution}`
  );

  return (
    <div className="w-[400px] shrink-0 border-l bg-background flex flex-col h-full animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <h2 className="text-base font-semibold">Add Issue</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Save">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Full screen">
            <Monitor className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Number */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">
            Number <span className="text-red-500">*</span>
          </Label>
          <Input value={number} readOnly className="bg-muted/30" />
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">
            Status <span className="text-red-500">*</span>
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-sky-600 text-white border-sky-600 hover:bg-sky-700 [&>svg]:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">
            Subject <span className="text-red-500">*</span>
          </Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject *"
          />
        </div>

        {/* Created on */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">
            Created on <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input value={createdOn} readOnly className="bg-muted/30 pr-9" />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Coordination">Coordination</SelectItem>
              <SelectItem value="Design Conflict">Design Conflict</SelectItem>
              <SelectItem value="Code Compliance">Code Compliance</SelectItem>
              <SelectItem value="Safety">Safety</SelectItem>
              <SelectItem value="Quality">Quality</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Due date */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Due date</Label>
          <div className="relative">
            <Input value={dueDate} readOnly className="pr-9" />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Importance */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Importance</Label>
          <Select value={importance} onValueChange={setImportance}>
            <SelectTrigger>
              <SelectValue placeholder="Select importance..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Location</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select location..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={alert.matchedDrawing}>{alert.matchedDrawing}</SelectItem>
              <SelectItem value="Level 1">Level 1</SelectItem>
              <SelectItem value="Level 2">Level 2</SelectItem>
              <SelectItem value="Level 3">Level 3</SelectItem>
              <SelectItem value="Roof">Roof</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="relative">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter your description *..."
              className="min-h-[120px] pr-9 resize-y"
            />
            <LinkIcon className="absolute right-3 bottom-3 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="px-4 py-3 border-t flex items-center gap-2 bg-muted/20">
        <Button
          size="sm"
          className="bg-sky-600 hover:bg-sky-700 text-white"
          onClick={onSave}
        >
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={onSave}>
          Save + add another
        </Button>
      </div>
    </div>
  );
}

export default function IssueAlertWidget({
  onCreateIssue,
}: {
  onCreateIssue?: (alert: IssueAlert) => void;
} = {}) {
  const [alerts, setAlerts] = useState<IssueAlert[]>(mockIssueAlerts);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);
  const [docCrunchSpec, setDocCrunchSpec] = useState<string | null>(null);

  const activeAlerts = useMemo(
    () => alerts.filter((a) => a.status === "active"),
    [alerts]
  );

  const inactiveAlerts = useMemo(
    () => alerts.filter((a) => a.status !== "active"),
    [alerts]
  );

  const severityCounts = useMemo(() => {
    const counts: Record<AlertSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    activeAlerts.forEach((a) => counts[a.severity]++);
    return counts;
  }, [activeAlerts]);

  const handleDismiss = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "dismissed" as AlertStatus } : a))
    );
    setExpandedId(null);
  };

  const handleConvert = (id: string, type: "rfi" | "issue") => {
    if (type === "issue") {
      const alert = alerts.find((a) => a.id === id);
      if (alert && onCreateIssue) onCreateIssue(alert);
      return;
    }
    const newStatus: AlertStatus = "converted_to_rfi";
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderAlertRow = (alert: IssueAlert) => {
    const sev = severityConfig[alert.severity];
    const isExpanded = expandedId === alert.id;
    const isInactive = alert.status !== "active";

    return (
      <div
        key={alert.id}
        className={cn(
          "rounded-lg border border-l-4 transition-all duration-200",
          sev.border,
          isInactive && "opacity-50",
          isExpanded && "shadow-sm"
        )}
      >
        {/* Compact row */}
        <button
          onClick={() => !isInactive && toggleExpand(alert.id)}
          className={cn(
            "w-full flex items-center gap-3 p-3 text-left",
            !isInactive && "cursor-pointer hover:bg-muted/30 transition-colors",
            isInactive && "cursor-default"
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "font-medium text-sm leading-tight",
                  isInactive && "line-through"
                )}
              >
                {alert.alertTitle}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  sev.bg,
                  sev.text
                )}
              >
                {sev.label}
              </span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); setDocCrunchSpec(alert.matchedSpecSection); }}
                className="inline-flex items-center rounded border bg-secondary/50 px-1.5 py-0.5 text-[10px] font-mono text-primary hover:text-primary/80 hover:bg-primary/5 hover:border-primary/30 cursor-pointer underline underline-offset-2 decoration-primary/40 transition-colors"
              >
                Spec {alert.matchedSpecSection}
              </span>
              <span
                role="button"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center rounded border bg-secondary/50 px-1.5 py-0.5 text-[10px] font-mono text-primary hover:text-primary/80 hover:bg-primary/5 hover:border-primary/30 cursor-pointer underline underline-offset-2 decoration-primary/40 transition-colors"
              >
                {alert.matchedDrawing}
              </span>
              <span className="inline-flex items-center rounded border bg-secondary/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {alert.category}
              </span>
              {isInactive && (
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {alert.status === "dismissed"
                    ? "Dismissed"
                    : alert.status === "converted_to_rfi"
                      ? "Converted to RFI"
                      : "Converted to Issue"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ConfidencePill score={alert.confidenceScore} />
            {!isInactive && (
              isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )
            )}
          </div>
        </button>

        {/* Expanded detail */}
        {isExpanded && !isInactive && (
          <>
            <Separator />
            <AlertDetailView
              alert={alert}
              onDismiss={() => handleDismiss(alert.id)}
              onConvert={(type) => handleConvert(alert.id, type)}
              onSpecClick={(spec) => setDocCrunchSpec(spec)}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <>
    <Card className="w-full">
      {/* Collapsed header — always visible, clickable to toggle */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <img
            src="/document-crunch-icon-filled-256.webp"
            alt="Document Crunch"
            className="h-8 w-8 rounded-lg"
          />
          <CardTitle className="text-base font-semibold">
            Document Crunch - AI Risk Prediction
          </CardTitle>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity pills — always visible as the summary */}
          {(["critical", "high", "medium", "low"] as AlertSeverity[]).map(
            (sev) => {
              const count = severityCounts[sev];
              if (count === 0) return null;
              const config = severityConfig[sev];
              return (
                <div
                  key={sev}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                    config.bg,
                    config.text
                  )}
                >
                  <div
                    className={cn("h-1.5 w-1.5 rounded-full", config.dot)}
                  />
                  {count} {config.label}
                </div>
              );
            }
          )}
          {activeAlerts.length === 0 && (
            <div className="flex items-center gap-1.5 rounded-full border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 text-xs font-medium">
              <CheckCircle2 className="h-3 w-3" />
              All clear
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
          )}
        </div>
      </button>

      {/* Expandable body */}
      {isOpen && (
        <>
          <Separator />
          <CardContent className="space-y-2 pt-4">
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-2 text-emerald-500" />
                <div className="font-medium">No active risks detected</div>
                <div className="text-xs mt-1">
                  All alerts have been addressed or dismissed
                </div>
              </div>
            ) : (
              activeAlerts.map(renderAlertRow)
            )}

            {/* Dismissed / converted toggle */}
            {inactiveAlerts.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowDismissed(!showDismissed)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showDismissed ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  {showDismissed ? "Hide" : "Show"} {inactiveAlerts.length}{" "}
                  resolved alert{inactiveAlerts.length !== 1 && "s"}
                </button>
                {showDismissed && (
                  <div className="mt-2 space-y-2">
                    {inactiveAlerts.map(renderAlertRow)}
                  </div>
                )}
              </div>
            )}

          </CardContent>
        </>
      )}
    </Card>

      {/* Document Crunch Modal */}
      
      {docCrunchSpec && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setDocCrunchSpec(null)}
        >
          <div
            className="relative max-w-[95vw] max-h-[92vh] shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src="/dc.png"
              alt="Document Crunch - Spec Review"
              className="block max-w-[95vw] max-h-[92vh]"
            />
            <button
              onClick={() => setDocCrunchSpec(null)}
              className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
