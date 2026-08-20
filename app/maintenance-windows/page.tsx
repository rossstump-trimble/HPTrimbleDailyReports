"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type WindowStatus = "scheduled" | "in-progress" | "completed";

interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: WindowStatus;
  affectedServices: string[];
  impact: "low" | "medium" | "high";
}

// ---------------------------------------------------------------------------
// Sample data — replace with a real API call once available
// ---------------------------------------------------------------------------
const MAINTENANCE_WINDOWS: MaintenanceWindow[] = [
  {
    id: "mw-2026-04",
    title: "Scheduled Infrastructure Maintenance",
    description:
      "Routine infrastructure updates to improve system performance and stability. Users may experience brief interruptions during this window.",
    startDate: "2026-03-15T02:00:00Z",
    endDate: "2026-03-15T06:00:00Z",
    status: "scheduled",
    affectedServices: ["ProjectSight Web", "API", "File Storage"],
    impact: "medium",
  },
  {
    id: "mw-2026-03",
    title: "Database Upgrade",
    description:
      "Database schema migration and indexing improvements. Read-only mode will be active for approximately 30 minutes.",
    startDate: "2026-03-20T01:00:00Z",
    endDate: "2026-03-20T03:00:00Z",
    status: "scheduled",
    affectedServices: ["ProjectSight Web", "API"],
    impact: "high",
  },
  {
    id: "mw-2026-02",
    title: "SSL Certificate Rotation",
    description:
      "Routine rotation of SSL/TLS certificates. Brief connection resets may occur.",
    startDate: "2026-02-28T03:00:00Z",
    endDate: "2026-02-28T03:30:00Z",
    status: "completed",
    affectedServices: ["All Services"],
    impact: "low",
  },
  {
    id: "mw-2026-01",
    title: "Storage Cluster Expansion",
    description:
      "Expansion of file storage cluster capacity. No user-facing impact expected.",
    startDate: "2026-02-10T22:00:00Z",
    endDate: "2026-02-11T02:00:00Z",
    status: "completed",
    affectedServices: ["File Storage"],
    impact: "low",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatDuration(start: string, end: string): string {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.round((diffMs % 3_600_000) / 60_000);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

const STATUS_CONFIG: Record<
  WindowStatus,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  scheduled: {
    label: "Scheduled",
    icon: <Clock className="h-4 w-4" />,
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  "in-progress": {
    label: "In Progress",
    icon: <AlertTriangle className="h-4 w-4" />,
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-4 w-4" />,
    badgeClass:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800",
  },
};

const IMPACT_CONFIG: Record<
  "low" | "medium" | "high",
  { label: string; badgeClass: string }
> = {
  low: {
    label: "Low Impact",
    badgeClass:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  },
  medium: {
    label: "Medium Impact",
    badgeClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  high: {
    label: "High Impact",
    badgeClass:
      "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const MaintenanceCard: React.FC<{ window: MaintenanceWindow }> = ({
  window: mw,
}) => {
  const status = STATUS_CONFIG[mw.status];
  const impact = IMPACT_CONFIG[mw.impact];

  return (
    <Card
      className={cn(
        "border",
        mw.status === "completed" && "opacity-70"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-semibold">{mw.title}</CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={cn("flex items-center gap-1 text-xs", impact.badgeClass)}
            >
              {impact.label}
            </Badge>
            <Badge
              variant="outline"
              className={cn("flex items-center gap-1 text-xs", status.badgeClass)}
            >
              {status.icon}
              {status.label}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-sm">{mw.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">
              Start
            </p>
            <p>{formatDateTime(mw.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">
              End (est. {formatDuration(mw.startDate, mw.endDate)})
            </p>
            <p>{formatDateTime(mw.endDate)}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
            Affected Services
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mw.affectedServices.map((svc) => (
              <Badge key={svc} variant="secondary" className="text-xs font-normal">
                {svc}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MaintenanceWindowsPage() {
  const upcoming = MAINTENANCE_WINDOWS.filter(
    (w) => w.status === "scheduled" || w.status === "in-progress"
  );
  const past = MAINTENANCE_WINDOWS.filter((w) => w.status === "completed");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance Windows</h1>
        <p className="text-muted-foreground mt-1">
          Current and upcoming scheduled maintenance periods for ProjectSight services.
        </p>
      </div>

      {/* Notice banner */}
      <div className="flex gap-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
        <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <p>
          All times are displayed in your local timezone. Subscribe to our{" "}
          <a
            href="https://status.trimble.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-200"
          >
            status page
          </a>{" "}
          for real-time notifications.
        </p>
      </div>

      {/* Upcoming / In Progress */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Upcoming &amp; In Progress</h2>
        {upcoming.length > 0 ? (
          upcoming.map((mw) => <MaintenanceCard key={mw.id} window={mw} />)
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No upcoming maintenance windows scheduled at this time.
          </p>
        )}
      </section>

      <Separator />

      {/* Past */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Past Maintenance</h2>
        {past.length > 0 ? (
          past.map((mw) => <MaintenanceCard key={mw.id} window={mw} />)
        ) : (
          <p className="text-sm text-muted-foreground py-4">No past records found.</p>
        )}
      </section>
    </div>
  );
}
