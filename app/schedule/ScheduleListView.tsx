"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Diamond,
  AlertTriangle,
  Link2,
  X,
  ArrowRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useProjectContext } from "@/contexts/ProjectContext";
import { useActivities, useDependencies, useDeleteDependency } from "@/hooks/useActivities";
import { useScheduleFilters } from "@/components/schedule/ScheduleFilterPanel";
import { NoProjectSelected } from "@/components/NoProjectSelected";
import { ActivityDetailDialog } from "@/components/schedule/ActivityDetailDialog";
import { ScheduleEmptyState } from "@/components/schedule/ScheduleEmptyState";
import { useToolbarActions } from "@/components/schedule/ScheduleToolbar";
import type { Activity, Dependency } from "@/hooks/useActivities";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

function ProgressBar({ value }: { value: number | null }) {
  const pct = value ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
    </div>
  );
}

function FloatBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-xs text-muted-foreground">—</span>;
  if (value <= 0)
    return (
      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
        {value}d
      </Badge>
    );
  if (value <= 5)
    return (
      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{value}d</span>
    );
  return <span className="text-xs text-muted-foreground">{value}d</span>;
}

interface FolderGroupProps {
  folder: Activity;
  activities: Activity[];
  onRowClick?: (a: Activity) => void;
}

function FolderGroup({ folder, activities, onRowClick }: FolderGroupProps) {
  const [open, setOpen] = useState(true);
  const criticalCount = activities.filter((c) => c.is_critical).length;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-secondary/50 bg-muted/30"
        onClick={() => setOpen((o) => !o)}
      >
        <TableCell className="px-4 py-2.5 font-semibold" colSpan={7}>
          <div className="flex items-center gap-2">
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
            <span>{folder.name}</span>
            <span className="text-xs text-muted-foreground font-normal ml-2">
              {activities.length} {activities.length === 1 ? "activity" : "activities"}
            </span>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1 shrink-0">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                {criticalCount} critical
              </Badge>
            )}
          </div>
        </TableCell>
      </TableRow>
      {open &&
        activities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} indented onRowClick={onRowClick} />
        ))}
    </>
  );
}

interface ActivityRowProps {
  activity: Activity;
  indented?: boolean;
  onRowClick?: (a: Activity) => void;
}

function ActivityRow({ activity, indented, onRowClick }: ActivityRowProps) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-secondary/30 transition-colors"
      onClick={() => onRowClick?.(activity)}
    >
      <TableCell className={`px-4 py-2 text-left ${indented ? "pl-10" : ""}`}>
        <div className="flex items-center gap-2">
          {activity.is_milestone ? (
            <Diamond className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          ) : (
            <div className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span className={`text-sm ${activity.is_critical ? "font-semibold text-destructive" : ""}`}>
            {activity.name}
          </span>
          {activity.is_critical && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Critical</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-2 text-sm tabular-nums text-left">{activity.duration}d</TableCell>
      <TableCell className="px-4 py-2 text-sm text-muted-foreground tabular-nums text-left">
        {formatDate(activity.start_date)}
      </TableCell>
      <TableCell className="px-4 py-2 text-sm text-muted-foreground tabular-nums text-left">
        {formatDate(activity.end_date)}
      </TableCell>
      <TableCell className="px-4 py-2 text-left">
        <ProgressBar value={activity.progress} />
      </TableCell>
      <TableCell className="px-4 py-2 text-left">
        <FloatBadge value={activity.total_float} />
      </TableCell>
      <TableCell className="px-4 py-2 text-xs text-muted-foreground text-left">
        {[activity.owner, activity.subcontractor].filter(Boolean).join(" · ") || "—"}
      </TableCell>
    </TableRow>
  );
}

export default function ScheduleListView() {
  const { activeProjectId: projectId } = useProjectContext();
  const { data: activities, isLoading } = useActivities(projectId ?? undefined);
  const { data: dependencies } = useDependencies(projectId ?? undefined);
  const deleteDependency = useDeleteDependency();
  const filters = useScheduleFilters();
  const toolbarActions = useToolbarActions();
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const handleRowClick = (a: Activity) => { setDetailActivity(a); setDetailOpen(true); };
  const filterFolder = filters?.filterFolder ?? "";
  const filterLocation = filters?.filterLocation ?? "";
  const filterOwner = filters?.filterOwner ?? "";
  const filterPackage = filters?.filterPackage ?? "";
  const filterSubcontractor = filters?.filterSubcontractor ?? "";

  const { folders, ungrouped, childMap } = useMemo(() => {
    if (!activities) return { folders: [], ungrouped: [], childMap: new Map<string, Activity[]>() };

    const parentIds = new Set(activities.filter((a) => !a.start_date && !a.end_date && activities.some((c) => c.parent_id === a.id)).map((a) => a.id));
    const matchesMetadata = (a: Activity) => {
      if (filterLocation && a.location !== filterLocation) return false;
      if (filterOwner && a.owner !== filterOwner) return false;
      if (filterPackage && a.package !== filterPackage) return false;
      if (filterSubcontractor && a.subcontractor !== filterSubcontractor) return false;
      return true;
    };
    const folderFilterId = filterFolder ? activities.find((a) => parentIds.has(a.id) && a.name === filterFolder)?.id ?? null : null;
    const passesFilter = (a: Activity): boolean => {
      if (folderFilterId && a.id !== folderFilterId && a.parent_id !== folderFilterId) return false;
      if (parentIds.has(a.id)) {
        const hasMetadataFilter = filterLocation || filterOwner || filterPackage || filterSubcontractor;
        if (hasMetadataFilter) {
          const children = activities.filter((c) => c.parent_id === a.id);
          return children.some(matchesMetadata);
        }
        return true;
      }
      return matchesMetadata(a);
    };
    const hasAnyFilter = filterFolder || filterLocation || filterOwner || filterPackage || filterSubcontractor;
    const filteredActivities = hasAnyFilter ? activities.filter(passesFilter) : activities;

    const folderActivities = filteredActivities.filter((a) => parentIds.has(a.id));
    const childrenByFolder = new Map<string, Activity[]>();
    const topLevel: Activity[] = [];

    for (const a of filteredActivities) {
      if (parentIds.has(a.id)) continue;
      if (a.parent_id && parentIds.has(a.parent_id)) {
        const existing = childrenByFolder.get(a.parent_id) ?? [];
        existing.push(a);
        childrenByFolder.set(a.parent_id, existing);
      } else {
        topLevel.push(a);
      }
    }

    return { folders: folderActivities, ungrouped: topLevel, childMap: childrenByFolder };
  }, [activities, filterFolder, filterLocation, filterOwner, filterPackage, filterSubcontractor]);

  if (!projectId) {
    return <NoProjectSelected module="Schedule" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <ScheduleEmptyState
        onAddActivity={toolbarActions?.openAddActivity}
        onAddTemplate={toolbarActions?.openAddTemplate}
        onOpenSettings={toolbarActions?.openSettings}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-md overflow-hidden">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-9 px-4 py-2 text-xs uppercase tracking-wider text-left w-[30%]">Activity</TableHead>
              <TableHead className="h-9 px-4 py-2 text-xs uppercase tracking-wider text-left w-[5%]">Duration</TableHead>
              <TableHead className="h-9 px-4 py-2 text-xs uppercase tracking-wider text-left w-[14%]">Start</TableHead>
              <TableHead className="h-9 px-4 py-2 text-xs uppercase tracking-wider text-left w-[14%]">Finish</TableHead>
              <TableHead className="h-9 px-4 py-2 text-xs uppercase tracking-wider text-left w-[14%]">Progress</TableHead>
              <TableHead className="h-9 px-4 py-2 text-xs uppercase tracking-wider text-left w-[8%]">Float</TableHead>
              <TableHead className="h-9 px-4 py-2 text-xs uppercase tracking-wider text-left w-[15%]">Assigned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {folders.map((folder) => (
              <FolderGroup
                key={folder.id}
                folder={folder}
                activities={childMap.get(folder.id) ?? []}
                onRowClick={handleRowClick}
              />
            ))}
            {ungrouped.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} onRowClick={handleRowClick} />
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Dependencies */}
      {dependencies && dependencies.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-heading font-semibold">Dependencies</h3>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{dependencies.length}</Badge>
            </div>
            <div className="space-y-1">
              {dependencies.map((dep) => {
                const pred = activities?.find((a) => a.id === dep.predecessor_id);
                const succ = activities?.find((a) => a.id === dep.successor_id);
                return (
                  <div key={dep.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-secondary/30 group">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{pred?.name ?? "?"}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{dep.type}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{succ?.name ?? "?"}</span>
                      {dep.lag !== 0 && (
                        <span className="text-xs text-muted-foreground">lag: {dep.lag}d</span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteDependency.mutate({ id: dep.id, projectId: projectId! })}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <ActivityDetailDialog
        activity={detailActivity}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onBreakdown={() => {}}
      />
    </div>
  );
}
