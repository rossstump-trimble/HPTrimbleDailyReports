"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GanttChart, Plus, Diamond, Trash2, Link2, X, FolderOpen, ChevronRight, ChevronDown, GripVertical, Layers, Filter, ChevronsUpDown, ChevronsDownUp, Save, Eye, Lock, AlertTriangle, Info, CalendarRange, MoreHorizontal, Upload, Download, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useBaselines, useCreateBaseline, useDeleteBaseline, type BaselineSnapshot } from "@/hooks/useBaselines";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProjects, useClaimDemoProject, DEMO_PROJECT_ID } from "@/hooks/useProjects";
import { useProjectContext } from "@/contexts/ProjectContext";
import { NoProjectSelected } from "@/components/NoProjectSelected";
import { useActivities, useDependencies, useCreateActivity, useUpdateActivity, useDeleteActivity, useCreateDependency, useDeleteDependency } from "@/hooks/useActivities";
import { emitRefetch } from "@/hooks/useSupabaseMutation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { differenceInCalendarDays, addDays, format, parseISO, max, min } from "date-fns";
import type { Activity, Dependency } from "@/hooks/useActivities";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SCHEDULE_TEMPLATES } from "@/data/scheduleTemplates";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ActivityDetailDialog } from "@/components/schedule/ActivityDetailDialog";
import { BreakdownDialog } from "@/components/lookahead/BreakdownDialog";
import { useTaskCountsByActivity } from "@/hooks/useLookaheadTasksByActivity";
import { useBulkShiftTasks } from "@/hooks/useLookaheadTasks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateCPM, traceImpactPath, type CpmResult, type CpmDependency } from "@/lib/cpmEngine";
import { RecoveryDialog, type RecoveryOption } from "@/components/schedule/RecoveryDialog";
import { ImportExportDialog, type ImportExportMode } from "@/components/schedule/ImportExportDialog";
import { ScheduleSettingsDialog, type ScheduleSource } from "@/components/schedule/ScheduleSettingsDialog";
import { ScheduleEmptyState } from "@/components/schedule/ScheduleEmptyState";
import { InlineEdit } from "@/components/schedule/InlineEdit";
import { ResourceHistogram } from "@/components/schedule/ResourceHistogram";
import { useResourceRoles } from "@/hooks/useResourceRoles";
import { useCrewAssignmentsByProject } from "@/hooks/useCrewAssignments";
import { useLookaheadTasks } from "@/hooks/useLookaheadTasks";
import { useToolbarPortalRef } from "@/components/schedule/ScheduleNewModule";
import { useScheduleFilters } from "@/components/schedule/ScheduleFilterPanel";

const DAY_WIDTH = 20;
const ROW_HEIGHT = 36;

/** Snap pixel delta to nearest day boundary */
const snapToDays = (px: number) => Math.round(px / DAY_WIDTH) * DAY_WIDTH;

function getBarColor(
  progress: number,
  isCritical: boolean,
  showCriticalPath: boolean,
  totalFloat?: number,
  nearCriticalThreshold: number = 5
) {
  // Negative float = purple (impossible schedule) — highest priority
  if (totalFloat !== undefined && totalFloat < 0) return "bg-purple-600/80";
  if (showCriticalPath) {
    if (isCritical) return "gradient-warm";
    if (totalFloat !== undefined && totalFloat <= nearCriticalThreshold) return "bg-orange-500/80";
    return "bg-muted-foreground/30";
  }
  if (isCritical) return "gradient-warm";
  if (progress >= 100) return "gradient-success";
  if (progress >= 50) return "gradient-primary";
  return "gradient-secondary";
}

export default function Schedule() {
  const { activeProjectId: projectId } = useProjectContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: projects } = useProjects();
  const { data: activities, isLoading } = useActivities(projectId ?? undefined);
  const { data: dependencies } = useDependencies(projectId ?? undefined);
  const claimDemo = useClaimDemoProject();

  // Auto-claim demo project if data is blocked by RLS
  useEffect(() => {
    if (
      projectId === DEMO_PROJECT_ID &&
      !isLoading &&
      activities !== undefined &&
      activities.length === 0 &&
      !claimDemo.isPending &&
      !claimDemo.isSuccess
    ) {
      claimDemo.mutate();
    }
  }, [projectId, isLoading, activities]); // eslint-disable-line react-hooks/exhaustive-deps

  const [detailFromSubmittals, setDetailFromSubmittals] = useState(false);

  // Auto-open activity detail when navigated with ?activityId=
  useEffect(() => {
    const activityId = searchParams.get("activityId");
    if (activityId && activities?.length) {
      const found = activities.find((a) => a.id === activityId);
      if (found) {
        setDetailActivity(found);
        setDetailOpen(true);
        setDetailFromSubmittals(searchParams.get("from") === "submittals");
        setSearchParams((prev) => { prev.delete("activityId"); prev.delete("from"); return prev; }, { replace: true });
      }
    }
  }, [searchParams, activities]); // eslint-disable-line react-hooks/exhaustive-deps

  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const createDependency = useCreateDependency();
  const deleteDependency = useDeleteDependency();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState("5");
  const [newStart, setNewStart] = useState("");
  const [newActivityType, setNewActivityType] = useState<"activity" | "folder">("activity");
  const [newParentId, setNewParentId] = useState<string>("");

  // Import/Export & Settings dialog state
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [importExportMode, setImportExportMode] = useState<ImportExportMode>("export");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scheduleSource, setScheduleSource] = useState<ScheduleSource>(null);
  const [sourceDetail, setSourceDetail] = useState<string | null>(null);

  // Template dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [creatingTemplates, setCreatingTemplates] = useState(false);

  // Collapsed folders state
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const filters = useScheduleFilters();
  const filterFolder = filters?.filterFolder ?? "";
  const filterLocation = filters?.filterLocation ?? "";
  const filterOwner = filters?.filterOwner ?? "";
  const filterPackage = filters?.filterPackage ?? "";
  const filterSubcontractor = filters?.filterSubcontractor ?? "";

  // Drag resize state
  const [resizing, setResizing] = useState<{ id: string; startX: number; origDuration: number; origEndDate: string } | null>(null);
  const [resizeDelta, setResizeDelta] = useState(0);

  // Drag move state
  const [dragging, setDragging] = useState<{ id: string; startX: number; origStartDate: string; origEndDate: string; duration: number } | null>(null);
  const [dragDelta, setDragDelta] = useState(0);

  // Reorder drag state
  const taskListRef = useRef<HTMLDivElement>(null);
  const [reorderDrag, setReorderDrag] = useState<{
    id: string;
    startY: number;
    currentY: number;
    originalIndex: number;
    dropTarget: string | null; // folder id to drop into
    dropIndex: number | null; // insertion index
  } | null>(null);

  // RAF ref for throttling
  const rafRef = useRef<number | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const histogramScrollRef = useRef<HTMLDivElement>(null);
  const isScrollSyncing = useRef(false);

  const handleTimelineScroll = useCallback(() => {
    if (isScrollSyncing.current) return;
    isScrollSyncing.current = true;
    if (histogramScrollRef.current && timelineScrollRef.current) {
      histogramScrollRef.current.scrollLeft = timelineScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isScrollSyncing.current = false; });
  }, []);

  const handleHistogramScroll = useCallback(() => {
    if (isScrollSyncing.current) return;
    isScrollSyncing.current = true;
    if (timelineScrollRef.current && histogramScrollRef.current) {
      timelineScrollRef.current.scrollLeft = histogramScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isScrollSyncing.current = false; });
  }, []);

  // Dependency linking state
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [linkTypeDialogOpen, setLinkTypeDialogOpen] = useState(false);
  const [pendingLink, setPendingLink] = useState<{ predecessorId: string; successorId: string } | null>(null);
  const [selectedDepType, setSelectedDepType] = useState<"FS" | "SS" | "FF" | "SF">("FS");

  // Activity detail / breakdown dialog state
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [breakdownActivity, setBreakdownActivity] = useState<Activity | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const taskCounts = useTaskCountsByActivity(projectId ?? undefined);
  const bulkShiftTasks = useBulkShiftTasks();

  // Overlay state
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [activeBaselineId, setActiveBaselineId] = useState<string | null>(null);
  const [baselineDialogOpen, setBaselineDialogOpen] = useState(false);
  const [baselineName, setBaselineName] = useState("");
  const [baselineType, setBaselineType] = useState<"contract" | "rebaseline">("contract");

  // Baseline hooks
  const { data: baselines } = useBaselines(projectId ?? undefined);
  const createBaseline = useCreateBaseline();
  const deleteBaseline = useDeleteBaseline();

  // Resource histogram data
  const { data: resourceRoles } = useResourceRoles(projectId ?? undefined);
  const { data: crewAssignments } = useCrewAssignmentsByProject(projectId ?? undefined);
  const { data: lookaheadTasks } = useLookaheadTasks(projectId ?? undefined);

  // Near-critical threshold (days)
  const nearCriticalThreshold = 5;

  // Impact path state (auto-clears after 5s)
  const [impactPath, setImpactPath] = useState<{ sourceId: string; impactedIds: Set<string>; totalDelayDays: number; sourceName: string } | null>(null);
  const impactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recovery dialog state
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [recoveryDelayInfo, setRecoveryDelayInfo] = useState<{
    activityId: string;
    activityName: string;
    delayDays: number;
    totalFloat: number;
    projectDelayDays: number;
  } | null>(null);

  // Store previous CPM results for impact path comparison
  const prevCpmForImpactRef = useRef<Map<string, CpmResult>>(new Map());
  const cpmResults = useMemo(() => {
    if (!activities?.length || !dependencies?.length) return new Map<string, CpmResult>();
    return calculateCPM(
      activities.map((a) => ({ id: a.id, duration: a.duration, start_date: a.start_date, parent_id: a.parent_id })),
      dependencies.map((d) => ({ predecessor_id: d.predecessor_id, successor_id: d.successor_id, type: d.type as "FS" | "SS" | "FF" | "SF", lag: d.lag }))
    );
  }, [activities, dependencies]);

  // Keep previous CPM snapshot for impact path comparison
  useEffect(() => {
    if (cpmResults.size > 0) {
      prevCpmForImpactRef.current = new Map(cpmResults);
    }
  }, [cpmResults]);
  const prevCpmRef = useRef<Map<string, { is_critical: boolean; total_float: number; free_float: number }>>(new Map());
  useEffect(() => {
    if (cpmResults.size === 0 || !activities?.length) return;
    const updates: Array<{ id: string; is_critical: boolean; total_float: number; free_float: number }> = [];
    for (const [id, result] of Array.from(cpmResults.entries())) {
      const prev = prevCpmRef.current.get(id);
      const activity = activities.find((a) => a.id === id);
      if (!activity) continue;
      const newCritical = result.isCritical;
      const newTotalFloat = result.totalFloat;
      const newFreeFloat = result.freeFloat;
      // Only update if values actually changed from what's in DB
      if (
        activity.is_critical !== newCritical ||
        activity.total_float !== newTotalFloat ||
        activity.free_float !== newFreeFloat
      ) {
        // Also check against our last persisted values to avoid re-sending
        if (
          !prev ||
          prev.is_critical !== newCritical ||
          prev.total_float !== newTotalFloat ||
          prev.free_float !== newFreeFloat
        ) {
          updates.push({ id, is_critical: newCritical, total_float: newTotalFloat, free_float: newFreeFloat });
        }
      }
    }
    if (updates.length > 0) {
      const newPrev = new Map(prevCpmRef.current);
      for (const upd of updates) {
        newPrev.set(upd.id, { is_critical: upd.is_critical, total_float: upd.total_float, free_float: upd.free_float });
        updateActivity.mutate({ id: upd.id, is_critical: upd.is_critical, total_float: upd.total_float, free_float: upd.free_float });
      }
      prevCpmRef.current = newPrev;
    }
  }, [cpmResults]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: get CPM-computed values for an activity (prefer live CPM over DB)
  const getCpmData = useCallback((activityId: string) => {
    const cpm = cpmResults.get(activityId);
    if (cpm) return { isCritical: cpm.isCritical, totalFloat: cpm.totalFloat, freeFloat: cpm.freeFloat };
    return { isCritical: false, totalFloat: 0, freeFloat: 0 };
  }, [cpmResults]);

  // Active baseline snapshot parsed
  const baselineSnapshotMap = useMemo(() => {
    if (!showBaseline || !activeBaselineId || !baselines) return new Map<string, BaselineSnapshot>();
    const baseline = baselines.find((b) => b.id === activeBaselineId);
    if (!baseline) return new Map<string, BaselineSnapshot>();
    const snapshot = baseline.snapshot as unknown as BaselineSnapshot[];
    const map = new Map<string, BaselineSnapshot>();
    if (Array.isArray(snapshot)) {
      for (const entry of snapshot) {
        map.set(entry.id, entry);
      }
    }
    return map;
  }, [showBaseline, activeBaselineId, baselines]);

  // Set baseline handler
  const handleSetBaseline = async () => {
    if (!projectId || !activities?.length || !baselineName.trim()) return;
    const snapshot: BaselineSnapshot[] = activities.map((a) => {
      const cpm = getCpmData(a.id);
      return {
        id: a.id,
        start_date: a.start_date,
        end_date: a.end_date,
        duration: a.duration,
        is_critical: cpm.isCritical,
        total_float: cpm.totalFloat,
      };
    });
    try {
      const result = await createBaseline.mutateAsync({ projectId, name: baselineName.trim(), snapshot });
      toast.success(`Baseline "${baselineName.trim()}" saved`);
      setBaselineDialogOpen(false);
      setBaselineName("");
      setActiveBaselineId(result.id);
      setShowBaseline(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Track if any drag is active for text-selection prevention
  const isAnyDragActive = !!(dragging || resizing || reorderDrag);

  // Prevent text selection during drag
  useEffect(() => {
    if (isAnyDragActive) {
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
    } else {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    }
    return () => {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, [isAnyDragActive]);

  // Timeline boundaries
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (!activities?.length) {
      const s = new Date();
      return { timelineStart: s, timelineEnd: addDays(s, 90), totalDays: 90 };
    }
    const dates = activities.flatMap((a) => {
      const d: Date[] = [];
      if (a.start_date) d.push(parseISO(a.start_date));
      if (a.end_date) d.push(parseISO(a.end_date));
      return d;
    }).filter(Boolean);
    if (!dates.length) {
      const s = new Date();
      return { timelineStart: s, timelineEnd: addDays(s, 90), totalDays: 90 };
    }
    const s = addDays(min(dates), -7);
    const e = addDays(max(dates), 14);
    return { timelineStart: s, timelineEnd: e, totalDays: differenceInCalendarDays(e, s) };
  }, [activities]);

  const months = useMemo(() => {
    const result: { label: string; startDay: number; width: number }[] = [];
    let current = new Date(timelineStart);
    while (current < timelineEnd) {
      const monthStart = current > timelineStart ? differenceInCalendarDays(current, timelineStart) : 0;
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const end = nextMonth < timelineEnd ? nextMonth : timelineEnd;
      const width = differenceInCalendarDays(end, current > timelineStart ? current : timelineStart);
      result.push({ label: format(current, "MMM yyyy"), startDay: monthStart, width });
      current = nextMonth;
    }
    return result;
  }, [timelineStart, timelineEnd]);

  // --- Resize handlers ---
  const handleResizeStart = useCallback((e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing({ id: activity.id, startX: e.clientX, origDuration: activity.duration, origEndDate: activity.end_date || "" });
    setResizeDelta(0);
    document.body.style.cursor = "ew-resize";

    const startX = e.clientX;
    const onMove = (ev: MouseEvent) => {
      const rawDx = ev.clientX - startX;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setResizeDelta(snapToDays(rawDx));
      });
    };
    const onUp = (ev: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const dx = ev.clientX - startX;
      const daysDelta = Math.round(dx / DAY_WIDTH);
      const newDuration = Math.max(1, activity.duration + daysDelta);
      const delayDays = newDuration - activity.duration;
      if (newDuration !== activity.duration && activity.start_date) {
        const newEnd = format(addDays(parseISO(activity.start_date), newDuration), "yyyy-MM-dd");
        // Save old CPM for impact path comparison
        const oldCpm = new Map(cpmResults);
        updateActivity.mutate({ id: activity.id, duration: newDuration, end_date: newEnd }, {
          onSuccess: () => {
            // Buffer alert
            if (delayDays > 0) {
              const cpm = oldCpm.get(activity.id);
              const totalFloat = cpm?.totalFloat ?? 0;
              if (delayDays <= totalFloat) {
                toast.success(`Task "${activity.name}" delayed ${delayDays}d. No impact to end date. Float reduced from ${totalFloat} to ${totalFloat - delayDays}d.`);
              } else {
                const projectDelay = delayDays - Math.max(0, totalFloat);
                setRecoveryDelayInfo({
                  activityId: activity.id,
                  activityName: activity.name,
                  delayDays,
                  totalFloat,
                  projectDelayDays: projectDelay,
                });
                toast.error(`CRITICAL IMPACT: Project end date pushed by ${projectDelay}d due to "${activity.name}" delay.`, {
                  duration: 8000,
                  action: {
                    label: "Recover Schedule",
                    onClick: () => setRecoveryDialogOpen(true),
                  },
                });
              }
            }
          },
        });
      }
      setResizing(null);
      setResizeDelta(0);
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [updateActivity]);

  // --- Drag move handlers ---
  const handleDragStart = useCallback((e: React.MouseEvent, activity: Activity) => {
    if (linkSource) return;
    e.preventDefault();
    setDragging({ id: activity.id, startX: e.clientX, origStartDate: activity.start_date || "", origEndDate: activity.end_date || "", duration: activity.duration });
    setDragDelta(0);
    document.body.style.cursor = "grabbing";

    const startX = e.clientX;
    const onMove = (ev: MouseEvent) => {
      const rawDx = ev.clientX - startX;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDragDelta(snapToDays(rawDx));
      });
    };
    const onUp = (ev: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const dx = ev.clientX - startX;
      const daysDelta = Math.round(dx / DAY_WIDTH);
      if (daysDelta !== 0 && activity.start_date) {
        const newStart = format(addDays(parseISO(activity.start_date), daysDelta), "yyyy-MM-dd");
        const newEnd = format(addDays(parseISO(activity.end_date || activity.start_date), daysDelta), "yyyy-MM-dd");
        const oldCpm = new Map(cpmResults);
        updateActivity.mutate({ id: activity.id, start_date: newStart, end_date: newEnd }, {
          onSuccess: () => {
            // Buffer alert for drag (shift)
            const absDelta = Math.abs(daysDelta);
            if (daysDelta > 0) {
              const cpm = oldCpm.get(activity.id);
              const totalFloat = cpm?.totalFloat ?? 0;
              if (absDelta <= totalFloat) {
                toast.success(`Task "${activity.name}" shifted +${absDelta}d. No impact to end date. Float reduced from ${totalFloat} to ${totalFloat - absDelta}d.`);
              } else {
                const projectDelay = absDelta - Math.max(0, totalFloat);
                setRecoveryDelayInfo({
                  activityId: activity.id,
                  activityName: activity.name,
                  delayDays: absDelta,
                  totalFloat,
                  projectDelayDays: projectDelay,
                });
                toast.error(`CRITICAL IMPACT: Project end date pushed by ${projectDelay}d due to "${activity.name}" shift.`, {
                  duration: 8000,
                  action: {
                    label: "Recover Schedule",
                    onClick: () => setRecoveryDialogOpen(true),
                  },
                });
              }
            }
          },
        });
        // Top-down cascade: shift all linked lookahead tasks
        if (projectId) {
          bulkShiftTasks.mutate({ activityId: activity.id, daysDelta, projectId });
        }
      }
      setDragging(null);
      setDragDelta(0);
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [updateActivity, linkSource]);

  // --- Reorder drag handlers ---
  const handleReorderStart = useCallback((e: React.MouseEvent, activityId: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setReorderDrag({
      id: activityId,
      startY: e.clientY,
      currentY: e.clientY,
      originalIndex: index,
      dropTarget: null,
      dropIndex: null,
    });
    document.body.style.cursor = "grabbing";

    const startY = e.clientY;
    const onMove = (ev: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setReorderDrag((prev) => {
          if (!prev) return null;
          // Calculate which row we're hovering over
          const listEl = taskListRef.current;
          if (!listEl) return { ...prev, currentY: ev.clientY };
          
          const listRect = listEl.getBoundingClientRect();
          const relY = ev.clientY - listRect.top + listEl.scrollTop;
          const hoverIndex = Math.floor(relY / ROW_HEIGHT);
          const hoverInRowY = relY - hoverIndex * ROW_HEIGHT;
          
          // Determine if hovering over a folder (middle zone) or between rows (edges)
          let dropTarget: string | null = null;
          let dropIndex: number | null = null;
          
          if (hoverIndex >= 0 && hoverIndex < visibleRowsRef.current.length) {
            const hoverRow = visibleRowsRef.current[hoverIndex];
            const isFolder = parentIdsRef.current.has(hoverRow.id);
            
            if (isFolder && hoverRow.id !== prev.id && hoverInRowY > 8 && hoverInRowY < ROW_HEIGHT - 8) {
              // Hovering over middle of a folder — drop into it
              dropTarget = hoverRow.id;
            } else {
              // Between rows — insertion
              dropIndex = hoverInRowY < ROW_HEIGHT / 2 ? hoverIndex : hoverIndex + 1;
            }
          } else {
            dropIndex = visibleRowsRef.current.length;
          }
          
          return { ...prev, currentY: ev.clientY, dropTarget, dropIndex };
        });
      });
    };
    const onUp = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      
      // Finalize drop
      setReorderDrag((prev) => {
        if (!prev) return null;
        finalizeReorderRef.current?.(prev);
        return null;
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  // Refs to access current visible rows inside callbacks
  const finalizeReorderRef = useRef<((drag: NonNullable<typeof reorderDrag>) => void) | null>(null);
  const visibleRowsRef = useRef<Activity[]>([]);
  const parentIdsRef = useRef<Set<string>>(new Set());

  // Scroll timeline to today on load
  useEffect(() => {
    if (!timelineScrollRef.current || !activities?.length) return;
    const todayOffset = differenceInCalendarDays(new Date(), timelineStart);
    if (todayOffset >= 0 && todayOffset <= totalDays) {
      const containerWidth = timelineScrollRef.current.clientWidth;
      const timelineVisibleWidth = containerWidth - 288;
      timelineScrollRef.current.scrollLeft = Math.max(0, todayOffset * DAY_WIDTH - timelineVisibleWidth / 3);
    }
  }, [timelineStart, totalDays, activities]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, []);

  // --- Link dependency ---
  const handleBarClick = useCallback((activityId: string) => {
    if (!linkSource) return;
    if (linkSource === activityId) {
      setLinkSource(null);
      return;
    }
    const exists = dependencies?.some(
      (d) => d.predecessor_id === linkSource && d.successor_id === activityId
    );
    if (exists) {
      toast.error("Dependency already exists");
      setLinkSource(null);
      return;
    }
    setPendingLink({ predecessorId: linkSource, successorId: activityId });
    setSelectedDepType("FS");
    setLinkTypeDialogOpen(true);
    setLinkSource(null);
  }, [linkSource, dependencies]);

  const confirmDependency = useCallback(() => {
    if (!pendingLink || !projectId) return;
    createDependency.mutate(
      { project_id: projectId, predecessor_id: pendingLink.predecessorId, successor_id: pendingLink.successorId, type: selectedDepType },
      {
        onSuccess: () => toast.success(`Dependency linked (${selectedDepType})`),
        onError: (err: any) => toast.error(err.message),
      }
    );
    setLinkTypeDialogOpen(false);
    setPendingLink(null);
  }, [pendingLink, projectId, selectedDepType, createDependency]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    
    if (newActivityType === "folder") {
      try {
        await createActivity.mutateAsync({
          project_id: projectId,
          name: newName,
          duration: 1,
          is_milestone: false,
          parent_id: newParentId || null,
          sort_order: (activities?.length ?? 0) + 1,
        });
        toast.success("Folder added");
        setAddDialogOpen(false);
        setNewName("");
        setNewActivityType("activity");
        setNewParentId("");
      } catch (err: any) {
        toast.error(err.message);
      }
    } else {
      const startDate = newStart || format(new Date(), "yyyy-MM-dd");
      const dur = parseInt(newDuration) || 5;
      try {
        await createActivity.mutateAsync({
          project_id: projectId,
          name: newName,
          duration: dur,
          start_date: startDate,
          end_date: format(addDays(parseISO(startDate), dur), "yyyy-MM-dd"),
          parent_id: newParentId || null,
          sort_order: (activities?.length ?? 0) + 1,
        });
        toast.success("Activity added");
        setAddDialogOpen(false);
        setNewName("");
        setNewDuration("5");
        setNewStart("");
        setNewActivityType("activity");
        setNewParentId("");
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  // --- Template creation ---
  const handleToggleTemplate = (name: string) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCreateTemplates = async () => {
    if (!projectId || selectedTemplates.size === 0) return;
    setCreatingTemplates(true);
    try {
      let sortOrder = (activities?.length ?? 0) + 1;
      for (const templateName of Array.from(selectedTemplates)) {
        const template = SCHEDULE_TEMPLATES.find((t) => t.name === templateName);
        if (!template) continue;

        // Create parent folder
        const parent = await createActivity.mutateAsync({
          project_id: projectId,
          name: template.name,
          duration: 1,
          is_milestone: false,
          sort_order: sortOrder++,
        });

        // Create subtasks and collect IDs for auto-linking
        const createdIds: string[] = [];
        const startDate = format(new Date(), "yyyy-MM-dd");
        for (let si = 0; si < template.subtasks.length; si++) {
          const subtask = template.subtasks[si];
          const subtaskStart = format(addDays(parseISO(startDate), si * 5), "yyyy-MM-dd");
          const subtaskEnd = format(addDays(parseISO(subtaskStart), 5), "yyyy-MM-dd");
          const child = await createActivity.mutateAsync({
            project_id: projectId,
            name: subtask,
            duration: 5,
            start_date: subtaskStart,
            end_date: subtaskEnd,
            parent_id: parent.id,
            is_milestone: false,
            sort_order: sortOrder++,
          });
          createdIds.push(child.id);
        }

        // Auto-link consecutive subtasks with Finish-to-Start dependencies
        for (let i = 0; i < createdIds.length - 1; i++) {
          await createDependency.mutateAsync({
            project_id: projectId,
            predecessor_id: createdIds[i],
            successor_id: createdIds[i + 1],
            type: "FS",
          });
        }
      }
      toast.success(`Created ${selectedTemplates.size} template(s) with dependencies`);
      setTemplateDialogOpen(false);
      setSelectedTemplates(new Set());
      // Auto-enable critical path so users see it immediately
      setShowCriticalPath(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingTemplates(false);
    }
  };

  // --- Build hierarchical activity list ---
  // Active filter count
  const activeFilterCount = [filterFolder, filterLocation, filterOwner, filterPackage, filterSubcontractor].filter(Boolean).length;

  const { visibleRows, childrenMap, parentIds } = useMemo(() => {
    if (!activities?.length) return { visibleRows: [], childrenMap: new Map<string, Activity[]>(), parentIds: new Set<string>() };

    const cMap = new Map<string, Activity[]>();
    const pIds = new Set<string>();

    // Group children by parent
    for (const a of activities) {
      if (a.parent_id) {
        const siblings = cMap.get(a.parent_id) || [];
        siblings.push(a);
        cMap.set(a.parent_id, siblings);
        pIds.add(a.parent_id);
      }
    }

    // Determine which activities pass metadata filters
    const matchesMetadata = (a: Activity) => {
      if (filterLocation && a.location !== filterLocation) return false;
      if (filterOwner && a.owner !== filterOwner) return false;
      if (filterPackage && a.package !== filterPackage) return false;
      if (filterSubcontractor && a.subcontractor !== filterSubcontractor) return false;
      return true;
    };

    // Determine which folder IDs match the folder filter
    const folderFilterId = filterFolder
      ? activities.find((a) => pIds.has(a.id) && a.name === filterFolder)?.id ?? null
      : null;

    // Collect IDs of activities that pass all filters
    const passesFilter = (a: Activity): boolean => {
      // Folder filter
      if (folderFilterId) {
        if (a.id !== folderFilterId && a.parent_id !== folderFilterId) return false;
      }
      // Metadata filters — folders pass if any child passes
      if (pIds.has(a.id)) {
        const hasMetadataFilter = filterLocation || filterOwner || filterPackage || filterSubcontractor;
        if (hasMetadataFilter) {
          const children = cMap.get(a.id) || [];
          return children.some(matchesMetadata);
        }
        return true;
      }
      return matchesMetadata(a);
    };

    const hasAnyFilter = filterFolder || filterLocation || filterOwner || filterPackage || filterSubcontractor;

    // Build visible rows: parents first, then children (if not collapsed)
    const rows: Activity[] = [];
    for (const a of activities) {
      if (a.parent_id) continue; // skip children in top-level pass
      if (hasAnyFilter && !passesFilter(a)) continue;
      rows.push(a);
      if (pIds.has(a.id) && !collapsedFolders.has(a.id)) {
        const children = cMap.get(a.id) || [];
        for (const child of children) {
          if (hasAnyFilter && !matchesMetadata(child)) continue;
          rows.push(child);
        }
      }
    }

    return { visibleRows: rows, childrenMap: cMap, parentIds: pIds };
  }, [activities, collapsedFolders, filterFolder, filterLocation, filterOwner, filterPackage, filterSubcontractor]);

  // Filter options (unique values)
  const filterOptions = useMemo(() => {
    if (!activities) return { folders: [] as string[], locations: [] as string[], owners: [] as string[], packages: [] as string[], subcontractors: [] as string[] };
    const folders = activities.filter((a) => parentIds.has(a.id)).map((a) => a.name);
    const locations = Array.from(new Set(activities.map((a) => a.location).filter(Boolean))) as string[];
    const owners = Array.from(new Set(activities.map((a) => a.owner).filter(Boolean))) as string[];
    const packages = Array.from(new Set(activities.map((a) => a.package).filter(Boolean))) as string[];
    const subcontractors = Array.from(new Set(activities.map((a) => a.subcontractor).filter(Boolean))) as string[];
    return { folders, locations, owners, packages, subcontractors };
  }, [activities, parentIds]);

  // Keep refs in sync
  useEffect(() => {
    visibleRowsRef.current = visibleRows;
    parentIdsRef.current = parentIds;
  }, [visibleRows, parentIds]);

  // Finalize reorder drop
  const finalizeReorder = useCallback((drag: NonNullable<typeof reorderDrag>) => {
    if (!activities || !projectId) return;
    
    const draggedActivity = activities.find((a) => a.id === drag.id);
    if (!draggedActivity) return;
    
    const updates: Array<{ id: string; sort_order: number; parent_id: string | null }> = [];
    
    if (drag.dropTarget) {
      // Dropped onto a folder — set parent_id
      const currentParent = draggedActivity.parent_id;
      if (currentParent !== drag.dropTarget) {
        // Get existing children of target folder
        const targetChildren = activities.filter((a) => a.parent_id === drag.dropTarget);
        const maxSort = targetChildren.reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0);
        updates.push({ id: drag.id, sort_order: maxSort + 10, parent_id: drag.dropTarget });
      }
    } else if (drag.dropIndex !== null) {
      // Dropped between rows — reorder and possibly change parent
      const rows = visibleRows.filter((r) => r.id !== drag.id);
      const insertIdx = Math.min(drag.dropIndex, rows.length);
      
      // Determine new parent: if inserting after a child row, inherit its parent.
      // If inserting after a parent row, become top-level.
      let newParentId: string | null = null;
      if (insertIdx > 0) {
        const prevRow = rows[insertIdx - 1];
        if (prevRow.parent_id) {
          // Previous row is a child — check if next row is also a child of same parent
          newParentId = prevRow.parent_id;
        } else if (parentIds.has(prevRow.id)) {
          // Previous row is a folder and we're inserting right after it
          // Check if we're inserting INTO its children area (collapsed or not)
          if (insertIdx < rows.length && rows[insertIdx].parent_id === prevRow.id) {
            newParentId = prevRow.id;
          }
        }
      }
      
      // Build new order
      rows.splice(insertIdx, 0, { ...draggedActivity, parent_id: newParentId } as Activity);
      
      // Reassign sort_order for all rows
      let sortCounter = 10;
      for (const row of rows) {
        const newSort = sortCounter;
        const newParent = row.id === drag.id ? newParentId : row.parent_id;
        sortCounter += 10;
        
        const original = activities.find((a) => a.id === row.id);
        if (original && (original.sort_order !== newSort || original.parent_id !== newParent)) {
          updates.push({ id: row.id, sort_order: newSort, parent_id: newParent ?? null });
        }
      }
    }
    
    // Apply updates
    for (const upd of updates) {
      updateActivity.mutate({ id: upd.id, sort_order: upd.sort_order, parent_id: upd.parent_id });
    }
    
    if (updates.length > 0) {
      toast.success("Reordered");
    }
  }, [activities, visibleRows, parentIds, projectId, updateActivity]);

  useEffect(() => {
    finalizeReorderRef.current = finalizeReorder;
  });

  const toggleFolder = (id: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Get list of folders for the parent picker in Add dialog
  const folderOptions = useMemo(() => {
    if (!activities) return [];
    return activities.filter((a) => parentIds.has(a.id) || (!a.parent_id && !a.start_date));
  }, [activities, parentIds]);

  // Compute snapped day deltas for tooltip display
  const dragDaysDelta = dragging ? Math.round(dragDelta / DAY_WIDTH) : 0;
  const resizeDaysDelta = resizing ? Math.round(resizeDelta / DAY_WIDTH) : 0;

  const toolbarPortalNode = useToolbarPortalRef();

  const toolbarButtons = (
    <>
      <Button onClick={() => { setNewStart(format(new Date(), "yyyy-MM-dd")); setNewActivityType("activity"); setNewParentId(""); setAddDialogOpen(true); }}>
        <Plus className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Add Activity</span>
      </Button>
      <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
        <Settings className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={() => { setImportExportMode("export"); setImportExportOpen(true); }}>
        <Download className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLinkSource(linkSource ? null : "__pick__")}>
            <Link2 className="h-4 w-4 mr-2" />
            {linkSource ? "Cancel Link" : "Link Tasks"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelectedTemplates(new Set()); setTemplateDialogOpen(true); }}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Add Template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/lookahead")}>
            <CalendarRange className="h-4 w-4 mr-2" />
            Lookahead
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  if (!projectId) {
    return <NoProjectSelected module="Schedule" />;
  }

  const currentProject = projects?.find((p) => p.id === projectId);

  return (
    <div className="space-y-4 pr-2">
      {toolbarPortalNode && createPortal(toolbarButtons, toolbarPortalNode)}

      {/* Link mode instruction */}
      {linkSource === "__pick__" && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-sm text-primary">
          Click a bar to select the <strong>predecessor</strong> task, then click another bar to set the <strong>successor</strong>.
        </div>
      )}

      {/* Recovery Warning */}
      {showBaseline && activeBaselineId && (() => {
        const slippedActivities = (activities ?? []).filter((a) => {
          const bl = baselineSnapshotMap.get(a.id);
          if (!bl?.end_date || !a.end_date) return false;
          return differenceInCalendarDays(parseISO(a.end_date), parseISO(bl.end_date)) > 5;
        });
        if (slippedActivities.length === 0) return null;
        const maxSlip = Math.max(...slippedActivities.map((a) => {
          const bl = baselineSnapshotMap.get(a.id);
          return differenceInCalendarDays(parseISO(a.end_date!), parseISO(bl!.end_date!));
        }));
        return (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm font-medium flex items-center justify-between">
              <span>Recovery Warning: {slippedActivities.length} {slippedActivities.length === 1 ? "activity" : "activities"} behind schedule by more than 5 days.</span>
              <Button
                variant="outline"
                size="sm"
                className="ml-3 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  const worst = slippedActivities[0];
                  const bl = baselineSnapshotMap.get(worst.id);
                  const slip = bl?.end_date && worst.end_date ? differenceInCalendarDays(parseISO(worst.end_date), parseISO(bl.end_date)) : maxSlip;
                  setRecoveryDelayInfo({
                    activityId: worst.id,
                    activityName: worst.name,
                    delayDays: slip,
                    totalFloat: getCpmData(worst.id).totalFloat,
                    projectDelayDays: slip,
                  });
                  setRecoveryDialogOpen(true);
                }}
              >
                Recover Schedule
              </Button>
            </AlertDescription>
          </Alert>
        );
      })()}

      {/* Contextual banners based on schedule state */}
      {(() => {
        const hasActivities = (activities?.length ?? 0) > 0;
        const hasDependencies = (dependencies?.length ?? 0) > 0;
        const hasBaseline = (baselines?.length ?? 0) > 0;

        if (hasActivities && !hasDependencies) {
          return (
            <Alert className="border-primary/30 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Your activities aren&apos;t linked yet. Click <strong>&ldquo;Link Tasks&rdquo;</strong> to define the sequence and activate the critical path.
              </AlertDescription>
            </Alert>
          );
        }
        if (hasDependencies && !hasBaseline) {
          return (
            <Alert className="border-muted-foreground/30 bg-secondary/50">
              <Save className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-sm text-muted-foreground">
                Your schedule has a critical path. Consider <strong>setting a baseline</strong> to track future changes against your approved plan.
              </AlertDescription>
            </Alert>
          );
        }
        return null;
      })()}

      {/* Overlay toggles */}
      {!!activities?.length && <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <Switch checked={showCriticalPath} onCheckedChange={setShowCriticalPath} id="cp-toggle" />
          <Label htmlFor="cp-toggle" className={`text-xs font-medium cursor-pointer ${!showCriticalPath && (dependencies?.length ?? 0) > 0 ? "animate-pulse" : ""}`}>Show Critical Path</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                The critical path highlights the longest chain of linked activities. Any delay on a critical task delays the entire project. Link tasks using the &ldquo;Link Tasks&rdquo; button to see it.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showBaseline} onCheckedChange={(v) => { setShowBaseline(v); if (v && !activeBaselineId && baselines?.length) setActiveBaselineId(baselines[0].id); }} id="bl-toggle" />
          <Label htmlFor="bl-toggle" className="text-xs font-medium cursor-pointer">Compare to Baseline</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                A baseline is a snapshot of your plan at a point in time. Set one when your schedule is approved, then compare against it to see which activities have slipped.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showResources} onCheckedChange={setShowResources} id="res-toggle" />
          <Label htmlFor="res-toggle" className="text-xs font-medium cursor-pointer">Show Resources</Label>
        </div>
        {showBaseline && baselines && baselines.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={activeBaselineId ?? ""} onValueChange={setActiveBaselineId}>
              <SelectTrigger className="w-52 h-8 text-xs">
                <SelectValue placeholder="Select baseline..." />
              </SelectTrigger>
              <SelectContent>
                {baselines.map((b, idx) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="flex items-center gap-1.5">
                      {idx === baselines.length - 1 && <Lock className="h-3 w-3 text-muted-foreground" />}
                      {b.name}
                      <span className="text-muted-foreground ml-1">({idx + 1} of {baselines.length})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeBaselineId && baselines.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  const bl = baselines.find((b) => b.id === activeBaselineId);
                  const isFirst = baselines[baselines.length - 1]?.id === activeBaselineId;
                  if (isFirst) {
                    toast.error("Cannot delete the Contract Baseline");
                    return;
                  }
                  if (bl && projectId) {
                    deleteBaseline.mutate({ id: bl.id, projectId }, {
                      onSuccess: () => {
                        toast.success(`Baseline "${bl.name}" deleted`);
                        setActiveBaselineId(baselines[0]?.id ?? null);
                      },
                    });
                  }
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="outline" size="sm" onClick={() => { setBaselineName(""); setBaselineDialogOpen(true); }} disabled={!activities?.length}>
                    <Save className="h-3.5 w-3.5 mr-1.5" />Set Baseline
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Save a snapshot of all current dates and durations. Your first baseline is typically your &ldquo;Contract Baseline&rdquo; &mdash; the approved plan.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {!activities?.length ? (
          <ScheduleEmptyState
            onAddActivity={() => { setNewStart(format(new Date(), "yyyy-MM-dd")); setAddDialogOpen(true); }}
            onAddTemplate={() => { setSelectedTemplates(new Set()); setTemplateDialogOpen(true); }}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : (
          <Card className="border-0 shadow-md overflow-hidden">
            <>
            <div className="flex overflow-auto max-h-[70vh]" ref={timelineScrollRef} onScroll={handleTimelineScroll}>
              {/* Task List */}
              <div className="flex-shrink-0 w-72 border-r bg-card z-20 sticky left-0" ref={taskListRef}>
                <div className="h-[52px] border-b flex items-center px-3 bg-secondary sticky top-0 z-30">
                  <div className="flex items-center gap-1 mr-1">
                    <button
                      onClick={() => setCollapsedFolders(new Set())}
                      className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                      title="Expand All"
                    >
                      <ChevronsDownUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setCollapsedFolders(new Set(parentIds))}
                      className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                      title="Collapse All"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex-1">Activity</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-12 text-right">Days</span>
                </div>
                {visibleRows.map((a, rowIndex) => {
                  const isParent = parentIds.has(a.id);
                  const isChild = !!a.parent_id;
                  const isCollapsed = collapsedFolders.has(a.id);
                  const isDraggedRow = reorderDrag?.id === a.id;
                  const isDropTarget = reorderDrag?.dropTarget === a.id;
                  const showInsertBefore = reorderDrag && reorderDrag.dropTarget === null && reorderDrag.dropIndex === rowIndex && reorderDrag.id !== a.id;
                  const showInsertAfter = reorderDrag && reorderDrag.dropTarget === null && reorderDrag.dropIndex === rowIndex + 1 && rowIndex === visibleRows.length - 1;

                  return (
                    <div key={a.id} className="relative">
                      {/* Insert indicator line before this row */}
                      {showInsertBefore && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-20 -translate-y-px" />
                      )}
                      <div
                        className={`h-9 flex items-center border-b hover:bg-secondary/30 group text-sm transition-colors ${
                          linkSource === a.id ? "bg-primary/10" : ""
                        } ${isChild ? "pl-6" : "pl-1"} ${
                          isDraggedRow ? "opacity-40 bg-muted" : ""
                        } ${
                          isDropTarget ? "bg-primary/10 ring-2 ring-inset ring-primary" : ""
                        }`}
                      >
                        {/* Drag handle */}
                        <div
                          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-secondary/60 text-muted-foreground/50 hover:text-muted-foreground"
                          onMouseDown={(e) => handleReorderStart(e, a.id, rowIndex)}
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </div>

                        {isParent ? (
                          <button
                            onClick={() => toggleFolder(a.id)}
                            className="flex items-center gap-1 mr-1 text-muted-foreground hover:text-foreground"
                          >
                            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            <FolderOpen className="h-3 w-3 text-primary" />
                          </button>
                        ) : a.is_milestone ? (
                          <Diamond className="h-3 w-3 mr-2 text-warning flex-shrink-0" />
                        ) : (
                          <div className="w-3 mr-2" />
                        )}
                        <span
                          className={`truncate flex-1 ${isParent ? "font-semibold" : ""} ${isChild ? "text-xs text-muted-foreground" : ""}`}
                        >
                          <InlineEdit
                            value={a.name}
                            onSave={(val) => updateActivity.mutate({ id: a.id, name: val })}
                            onSingleClick={() => { setDetailActivity(a); setDetailOpen(true); }}
                            className={`cursor-pointer hover:text-primary ${isParent ? "font-semibold" : ""} ${isChild ? "text-xs" : ""}`}
                          />
                        </span>
                        {taskCounts.get(a.id) ? (
                          <span className="text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 mr-1 flex-shrink-0">
                            {taskCounts.get(a.id)} tasks
                          </span>
                        ) : null}
                        <span className="text-xs text-muted-foreground w-12 text-right mr-1">
                          {resizing?.id === a.id ? (
                            `${Math.max(1, a.duration + resizeDaysDelta)}d`
                          ) : (
                            <InlineEdit
                              value={String(a.duration)}
                              type="number"
                              min={1}
                              suffix="d"
                              onSave={(val) => {
                                const num = parseInt(val, 10);
                                if (num >= 1) updateActivity.mutate({ id: a.id, duration: num });
                              }}
                              inputClassName="w-10 text-right text-xs"
                            />
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteActivity.mutate({ id: a.id, projectId: projectId! })}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      {/* Insert indicator line after last row */}
                      {showInsertAfter && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-20 translate-y-px" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Timeline */}
              <div className="flex-1">
                {/* Month headers */}
                <div className="border-b bg-secondary sticky top-0 z-10">
                  {/* Month row */}
                  <div className="h-6 flex">
                    {months.map((m, i) => (
                      <div key={i} className="flex-shrink-0 border-r border-b flex items-center justify-center text-xs font-medium text-muted-foreground" style={{ width: m.width * DAY_WIDTH, minWidth: m.width * DAY_WIDTH }}>
                        {m.label}
                      </div>
                    ))}
                  </div>
                  {/* Day numbers row */}
                  <div className="h-[26px] flex">
                    {Array.from({ length: totalDays }).map((_, i) => {
                      const day = addDays(timelineStart, i);
                      const dayOfWeek = day.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      return (
                        <div
                          key={i}
                          className={`flex-shrink-0 flex items-center justify-center text-[9px] border-r border-border/30 ${isWeekend ? "bg-muted/40 text-muted-foreground/60" : "text-muted-foreground"}`}
                          style={{ width: DAY_WIDTH, minWidth: DAY_WIDTH }}
                        >
                          {day.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bars area */}
                <div className="relative" style={{ width: totalDays * DAY_WIDTH, minHeight: visibleRows.length * ROW_HEIGHT }}>
                  {/* Grid lines + weekend shading */}
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const day = addDays(timelineStart, i);
                    const dayOfWeek = day.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isMonday = dayOfWeek === 1;
                    return (
                      <div
                        key={i}
                        className={`absolute top-0 bottom-0 border-r ${isMonday ? "border-border" : "border-border/30"} ${isWeekend ? "bg-muted/20" : ""}`}
                        style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                      />
                    );
                  })}

                  {/* Today line */}
                  {(() => {
                    const todayOffset = differenceInCalendarDays(new Date(), timelineStart);
                    if (todayOffset >= 0 && todayOffset <= totalDays) {
                      return <div className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20" style={{ left: todayOffset * DAY_WIDTH }} />;
                    }
                    return null;
                  })()}

                  {/* SVG for dependency lines */}
                  <svg className="absolute inset-0 pointer-events-none z-10" style={{ width: totalDays * DAY_WIDTH, height: visibleRows.length * ROW_HEIGHT }}>
                    <defs>
                      <marker id="dep-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" />
                      </marker>
                      <marker id="dep-arrow-critical" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--destructive))" />
                      </marker>
                      <marker id="dep-arrow-negative" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="hsl(270 60% 50%)" />
                      </marker>
                      <marker id="dep-arrow-impact" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="hsl(25 95% 53%)" />
                      </marker>
                    </defs>
                    {dependencies?.map((dep) => {
                      const predIdx = visibleRows.findIndex((a) => a.id === dep.predecessor_id);
                      const succIdx = visibleRows.findIndex((a) => a.id === dep.successor_id);
                      if (predIdx === -1 || succIdx === -1) return null;
                      const pred = visibleRows[predIdx];
                      const succ = visibleRows[succIdx];
                      if (!pred?.start_date || !succ?.start_date) return null;

                      const predStartOff = differenceInCalendarDays(parseISO(pred.start_date), timelineStart);
                      const predStartX = predStartOff * DAY_WIDTH;
                      const predEndX = (predStartOff + pred.duration) * DAY_WIDTH;
                      const succStartOff = differenceInCalendarDays(parseISO(succ.start_date), timelineStart);
                      const succStartX = succStartOff * DAY_WIDTH;
                      const succEndX = (succStartOff + succ.duration) * DAY_WIDTH;
                      const y1 = predIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                      const y2 = succIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

                      let x1: number, x2: number;
                      const depType = dep.type || "FS";
                      if (depType === "FS") { x1 = predEndX; x2 = succStartX; }
                      else if (depType === "SS") { x1 = predStartX; x2 = succStartX; }
                      else if (depType === "FF") { x1 = predEndX; x2 = succEndX; }
                      else { x1 = predStartX; x2 = succEndX; } // SF

                      const predCpm = getCpmData(pred.id);
                      const succCpm = getCpmData(succ.id);
                      const isNegativeFloatLine = predCpm.totalFloat < 0 && succCpm.totalFloat < 0;
                      const isCriticalLine = showCriticalPath && predCpm.isCritical && succCpm.isCritical;
                      // Impact path highlighting
                      const isImpactLine = impactPath && (
                        (impactPath.sourceId === dep.predecessor_id || impactPath.impactedIds.has(dep.predecessor_id)) &&
                        impactPath.impactedIds.has(dep.successor_id)
                      );
                      const lineStroke = isImpactLine ? "hsl(25 95% 53%)" : isNegativeFloatLine ? "hsl(270 60% 50%)" : isCriticalLine ? "hsl(var(--destructive))" : "hsl(var(--primary))";
                      const lineWidth = isImpactLine ? 2.5 : isNegativeFloatLine ? 3 : isCriticalLine ? 2.5 : 1.5;
                      const lineOpacity = impactPath && !isImpactLine ? 0.2 : showCriticalPath && !isCriticalLine && !isNegativeFloatLine ? 0.3 : 0.7;
                      const markerEnd = isImpactLine ? "url(#dep-arrow-impact)" : isNegativeFloatLine ? "url(#dep-arrow-negative)" : isCriticalLine ? "url(#dep-arrow-critical)" : "url(#dep-arrow)";

                      const midX = x1 + (x1 < x2 ? 12 : -12);
                      return (
                        <g key={dep.id}>
                          <path
                            d={`M${x1},${y1} L${midX},${y1} L${midX},${y2} L${x2},${y2}`}
                            fill="none"
                            stroke={lineStroke}
                            strokeWidth={lineWidth}
                            strokeDasharray={depType === "FS" ? "none" : "6 3"}
                            markerEnd={markerEnd}
                            opacity={lineOpacity}
                          />
                          <text x={(x1 + x2) / 2} y={Math.min(y1, y2) - 4} textAnchor="middle" fill={lineStroke} fontSize={9} opacity={0.6}>
                            {depType}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Activity bars */}
                  {visibleRows.map((a, i) => {
                    if (!a.start_date) return null;
                    const isResizing = resizing?.id === a.id;
                    const isDragging = dragging?.id === a.id;
                    const isParent = parentIds.has(a.id);
                    const startOffset = differenceInCalendarDays(parseISO(a.start_date), timelineStart);
                    const effectiveDuration = isResizing ? Math.max(1, a.duration + resizeDaysDelta) : a.duration;
                    const barWidth = effectiveDuration * DAY_WIDTH;
                    const originalLeft = startOffset * DAY_WIDTH;
                    const left = isDragging ? (originalLeft + dragDelta) : originalLeft;
                    const cpmData = getCpmData(a.id);
                    const barColor = getBarColor(Number(a.progress ?? 0), cpmData.isCritical, showCriticalPath, cpmData.totalFloat, nearCriticalThreshold);
                    const isCriticalDimmed = showCriticalPath && !cpmData.isCritical && (cpmData.totalFloat === undefined || cpmData.totalFloat > nearCriticalThreshold);
                    const isLinkTarget = linkSource && linkSource !== "__pick__" && linkSource !== a.id;
                    const isLinkSource = linkSource === a.id;

                    // Compute tooltip info
                    let tooltipText = "";
                    if (isDragging && a.start_date) {
                      const newStart = format(addDays(parseISO(a.start_date), dragDaysDelta), "MMM d");
                      tooltipText = `→ ${newStart}`;
                    } else if (isResizing) {
                      tooltipText = `${effectiveDuration}d`;
                    }

                    // Baseline data for this activity
                    const baselineEntry = baselineSnapshotMap.get(a.id);
                    const baselineVariance = (() => {
                      if (!baselineEntry?.start_date || !a.start_date) return null;
                      const diff = differenceInCalendarDays(parseISO(a.start_date), parseISO(baselineEntry.start_date));
                      return diff;
                    })();

                    return (
                      <div key={a.id}>
                        {/* Baseline ghost bar */}
                        {showBaseline && baselineEntry?.start_date && baselineEntry?.end_date && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="absolute rounded bg-amber-400/40 border border-amber-500/30 pointer-events-auto cursor-default"
                                  style={{
                                    left: differenceInCalendarDays(parseISO(baselineEntry.start_date), timelineStart) * DAY_WIDTH,
                                    top: i * ROW_HEIGHT + ROW_HEIGHT - 10,
                                    width: differenceInCalendarDays(parseISO(baselineEntry.end_date), parseISO(baselineEntry.start_date)) * DAY_WIDTH,
                                    height: 6,
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div>Baseline Start: {format(parseISO(baselineEntry.start_date), "MMM d")}</div>
                                {a.start_date && <div>Current Start: {format(parseISO(a.start_date), "MMM d")}</div>}
                                {baselineVariance !== null && <div className={baselineVariance > 0 ? "text-destructive font-medium" : baselineVariance < 0 ? "text-green-500 font-medium" : ""}>Variance: {baselineVariance > 0 ? `+${baselineVariance}` : baselineVariance} days</div>}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Ghost bar showing original position during drag */}
                        {isDragging && (
                          <div
                            className="absolute rounded-md bg-foreground/10 pointer-events-none"
                            style={{
                              left: originalLeft,
                              top: i * ROW_HEIGHT + 6,
                              width: a.duration * DAY_WIDTH,
                              height: ROW_HEIGHT - 12,
                            }}
                          />
                        )}

                        {/* Main bar */}
                        <div
                          className={`absolute flex items-center group/bar ${
                            isDragging || isResizing ? "z-30" : "z-0"
                          } ${
                            !isDragging && !isResizing ? "transition-all duration-150 ease-out" : ""
                          } ${
                            isLinkTarget ? "cursor-crosshair" : isLinkSource ? "ring-2 ring-primary rounded-md" : ""
                          } ${
                            isCriticalDimmed && !impactPath ? "opacity-50" : ""
                          } ${
                            impactPath?.sourceId === a.id ? "ring-2 ring-orange-500 rounded-md" : ""
                          } ${
                            impactPath?.impactedIds.has(a.id) ? "ring-2 ring-yellow-500 rounded-md" : ""
                          }`}
                          style={{
                            left,
                            top: i * ROW_HEIGHT + 6,
                            width: barWidth,
                            height: ROW_HEIGHT - 12,
                            transform: isDragging ? "scaleY(1.1)" : undefined,
                            transformOrigin: "center",
                          }}
                          onClick={() => {
                            if (linkSource === "__pick__") {
                              setLinkSource(a.id);
                            } else if (linkSource && linkSource !== a.id) {
                              handleBarClick(a.id);
                            }
                          }}
                        >
                          {/* Drag/resize tooltip */}
                          {tooltipText && (
                            <div
                              className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-foreground text-background text-[10px] font-medium whitespace-nowrap pointer-events-none z-40 shadow-md"
                            >
                              {tooltipText}
                            </div>
                          )}

                          {a.is_milestone ? (
                            <Diamond className="h-5 w-5 text-warning mx-auto" />
                          ) : isParent ? (
                            /* Parent summary bar — thinner bracket style */
                            <div className="w-full h-2 rounded-sm bg-primary/60 relative">
                              <div className="absolute left-0 top-0 w-1 h-full bg-primary rounded-l-sm" />
                              <div className="absolute right-0 top-0 w-1 h-full bg-primary rounded-r-sm" />
                            </div>
                          ) : (
                            <>
                              {/* Bar body — draggable */}
                              <div
                                className={`w-full h-full rounded-md ${barColor} relative overflow-hidden ${
                                  !linkSource ? "cursor-grab active:cursor-grabbing" : ""
                                } ${isDragging ? "shadow-lg ring-1 ring-primary/30" : "shadow-sm"} ${
                                  isResizing ? "shadow-lg" : ""
                                }`}
                                onMouseDown={(e) => {
                                  if (!linkSource) handleDragStart(e, a);
                                }}
                              >
                                {Number(a.progress ?? 0) > 0 && (
                                  <div className="absolute inset-y-0 left-0 bg-foreground/10 rounded-l-md" style={{ width: `${a.progress}%` }} />
                                )}
                                <span className="absolute inset-0 flex items-center justify-center text-[11px] text-white font-semibold truncate px-1.5 select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                                  {barWidth > 40 ? a.name : ""}
                                </span>
                              </div>

                              {/* Slippage hatching: red striped extension when live finish > baseline finish */}
                              {showBaseline && baselineEntry?.end_date && a.end_date && (() => {
                                const slippage = differenceInCalendarDays(parseISO(a.end_date), parseISO(baselineEntry.end_date));
                                if (slippage <= 0) return null;
                                return (
                                  <div
                                    className="absolute top-0 bottom-0 rounded-r-md pointer-events-none"
                                    style={{
                                      left: barWidth,
                                      width: slippage * DAY_WIDTH,
                                      background: "repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(239,68,68,0.4) 3px, rgba(239,68,68,0.4) 6px)",
                                    }}
                                  />
                                );
                              })()}

                              {/* End-date variance badge */}
                              {showBaseline && baselineEntry?.end_date && a.end_date && (() => {
                                const endVariance = differenceInCalendarDays(parseISO(a.end_date), parseISO(baselineEntry.end_date));
                                if (endVariance === 0) return null;
                                const slippagePx = Math.max(0, endVariance) * DAY_WIDTH;
                                return (
                                  <div
                                    className={`absolute top-1/2 -translate-y-1/2 pointer-events-none rounded-full px-1.5 py-px text-[11px] font-bold leading-tight whitespace-nowrap z-10 ${
                                      endVariance > 0
                                        ? "bg-red-500 text-white border border-red-600"
                                        : "bg-green-600 text-white border border-green-700"
                                    }`}
                                    style={{ left: barWidth + 4 }}
                                  >
                                    {endVariance > 0 ? `+${endVariance}d` : `${endVariance}d`}
                                  </div>
                                );
                              })()}

                              {/* Resize handle (right edge) */}
                              {!linkSource && (
                                <div
                                  className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-foreground/20 rounded-r-md transition-colors ${
                                    isResizing ? "bg-foreground/20 opacity-100" : "opacity-0 group-hover/bar:opacity-100"
                                  }`}
                                  onMouseDown={(e) => handleResizeStart(e, a)}
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Resource Histogram */}
            {showResources && resourceRoles && resourceRoles.length > 0 && crewAssignments && lookaheadTasks && (
              <ResourceHistogram
                timelineStart={timelineStart}
                totalDays={totalDays}
                dayWidth={DAY_WIDTH}
                roles={resourceRoles}
                assignments={crewAssignments}
                tasks={lookaheadTasks}
                scrollRef={histogramScrollRef}
                onScroll={handleHistogramScroll}
              />
            )}
            </>
          </Card>
        )}
      </motion.div>

      {/* Instructions hint */}
      {activities && activities.length > 0 && !linkSource && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>🖱️ <strong>Drag</strong> bar to reschedule</span>
          <span>↔️ <strong>Drag right edge</strong> to resize duration</span>
          <span>🔗 Click <strong>Link Tasks</strong> to create dependencies</span>
          <span>☰ <strong>Drag handle</strong> to reorder</span>
        </div>
      )}

      {/* Add Activity Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add {newActivityType === "folder" ? "Folder" : "Activity"}</DialogTitle>
            <DialogDescription>Create a new {newActivityType === "folder" ? "folder to group activities" : "activity in the schedule"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddActivity} className="space-y-4">
            {/* Type toggle */}
            <div className="space-y-2">
              <Label>Type</Label>
              <ToggleGroup
                type="single"
                value={newActivityType}
                onValueChange={(v) => { if (v) setNewActivityType(v as "activity" | "folder"); }}
                className="justify-start"
              >
                <ToggleGroupItem value="activity" variant="outline" className="text-sm px-4">
                  Activity (scheduled work with dates)
                </ToggleGroupItem>
                <ToggleGroupItem value="folder" variant="outline" className="text-sm px-4">
                  <FolderOpen className="h-3.5 w-3.5 mr-1.5" />Folder (groups activities, no dates)
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">Folders organize your schedule into sections. Only activities have dates and appear on the critical path.</p>
            </div>

            <div className="space-y-2">
              <Label>{newActivityType === "folder" ? "Folder Name" : "Activity Name"}</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={newActivityType === "folder" ? "e.g. Foundations" : "e.g. Pour Concrete"} required />
            </div>

            {/* Parent folder selector */}
            {folderOptions.length > 0 && (
              <div className="space-y-2">
                <Label>Parent Folder (optional)</Label>
                <Select value={newParentId} onValueChange={setNewParentId}>
                  <SelectTrigger><SelectValue placeholder="None (top level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top level)</SelectItem>
                    {folderOptions.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        <span className="flex items-center gap-1.5">
                          <FolderOpen className="h-3 w-3 text-primary" />{f.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date/duration only for activities */}
            {newActivityType === "activity" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Duration (days)</Label>
                  <Input type="number" min={1} value={newDuration} onChange={(e) => setNewDuration(e.target.value)} required />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createActivity.isPending}>
                {createActivity.isPending ? "Adding..." : `Add ${newActivityType === "folder" ? "Folder" : "Activity"}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Picker Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Work Templates</DialogTitle>
            <DialogDescription>Select work categories to quickly populate your schedule with common activities.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            {SCHEDULE_TEMPLATES.map((template) => (
              <Collapsible key={template.name}>
                <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/30">
                  <Checkbox
                    checked={selectedTemplates.has(template.name)}
                    onCheckedChange={() => handleToggleTemplate(template.name)}
                  />
                  <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{template.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto mr-2">{template.subtasks.length} tasks</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-90" />
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="pl-11 pb-2 space-y-1">
                    {template.subtasks.map((subtask) => (
                      <div key={subtask} className="text-xs text-muted-foreground py-0.5">• {subtask}</div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateTemplates}
              disabled={selectedTemplates.size === 0 || creatingTemplates}
            >
              {creatingTemplates ? "Creating..." : `Create ${selectedTemplates.size > 0 ? selectedTemplates.size : ""} Selected`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dependency type picker dialog */}
      <Dialog open={linkTypeDialogOpen} onOpenChange={(open) => { if (!open) { setLinkTypeDialogOpen(false); setPendingLink(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Dependency Type</DialogTitle>
            <DialogDescription>
              {pendingLink && (
                <span>
                  <strong>{activities?.find((a) => a.id === pendingLink.predecessorId)?.name}</strong>
                  {" → "}
                  <strong>{activities?.find((a) => a.id === pendingLink.successorId)?.name}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={selectedDepType} onValueChange={(v) => setSelectedDepType(v as any)} className="space-y-2">
            {([
              ["FS", "Finish-to-Start", "Successor starts after predecessor finishes"],
              ["SS", "Start-to-Start", "Both start at the same time"],
              ["FF", "Finish-to-Finish", "Both finish at the same time"],
              ["SF", "Start-to-Finish", "Successor finishes when predecessor starts"],
            ] as const).map(([type, label, desc]) => (
              <label key={type} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedDepType === type ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"}`}>
                <RadioGroupItem value={type} className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">{label} <span className="font-mono text-xs text-muted-foreground">({type})</span></div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </label>
            ))}
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLinkTypeDialogOpen(false); setPendingLink(null); }}>Cancel</Button>
            <Button onClick={confirmDependency} disabled={createDependency.isPending}>
              {createDependency.isPending ? "Linking..." : "Create Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Detail Dialog */}
      <ActivityDetailDialog
        activity={detailActivity}
        open={detailOpen}
        onOpenChange={(open) => { setDetailOpen(open); if (!open) setDetailFromSubmittals(false); }}
        onBreakdown={(a) => { setBreakdownActivity(a); setBreakdownOpen(true); }}
        fromSubmittals={detailFromSubmittals}
      />

      {/* Breakdown Dialog */}
      <BreakdownDialog
        activity={breakdownActivity}
        open={breakdownOpen}
        onOpenChange={setBreakdownOpen}
      />

      {/* Set Baseline Dialog */}
      <Dialog open={baselineDialogOpen} onOpenChange={setBaselineDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Set Baseline</DialogTitle>
            <DialogDescription>Snapshot the current schedule dates as a baseline for comparison.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Baseline Name</Label>
              <Input value={baselineName} onChange={(e) => setBaselineName(e.target.value)} placeholder="e.g. Contract Baseline Rev 0" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <ToggleGroup
                type="single"
                value={baselineType}
                onValueChange={(v) => { if (v) setBaselineType(v as "contract" | "rebaseline"); }}
                className="justify-start"
              >
                <ToggleGroupItem value="contract" variant="outline" className="text-sm px-4">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />Contract Baseline
                </ToggleGroupItem>
                <ToggleGroupItem value="rebaseline" variant="outline" className="text-sm px-4">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Re-Baseline
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <p className="text-xs text-muted-foreground">
              This will save {activities?.length ?? 0} activity dates{cpmResults.size > 0 ? " and critical path data" : ""} as a frozen snapshot.
              {baselines?.length ? ` (Baseline ${(baselines?.length ?? 0) + 1})` : ""}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBaselineDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSetBaseline} disabled={!baselineName.trim() || createBaseline.isPending}>
              {createBaseline.isPending ? "Saving..." : "Save Baseline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ImportExportDialog
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
        mode={importExportMode}
        activities={activities ?? []}
        dependencies={dependencies ?? []}
        projectName={currentProject?.name}
      />

      {/* Schedule Settings Dialog */}
      <ScheduleSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        activities={activities ?? []}
        dependencies={dependencies ?? []}
        projectName={currentProject?.name}
        scheduleSource={scheduleSource}
        sourceDetail={sourceDetail}
        onScheduleSourceChange={(source, detail) => { setScheduleSource(source); setSourceDetail(detail ?? null); }}
        onImportComplete={async (importedActivities, importedDeps) => {
          if (!projectId) return;

          const CHUNK = 50;
          const insertChunked = async (table: string, rows: Record<string, unknown>[]) => {
            for (let i = 0; i < rows.length; i += CHUNK) {
              const chunk = rows.slice(i, i + CHUNK);
              const { error } = await supabase.from(table).insert(chunk as any);
              if (error) throw new Error(`Failed to insert ${table} (rows ${i + 1}-${i + chunk.length}): ${error.message}`);
            }
          };

          const { error: depDelErr } = await supabase.from("dependencies").delete().eq("project_id", projectId);
          if (depDelErr) throw new Error("Failed to delete existing dependencies: " + depDelErr.message);

          const { error: actDelErr } = await supabase.from("activities").delete().eq("project_id", projectId);
          if (actDelErr) throw new Error("Failed to delete existing activities: " + actDelErr.message);

          const idMap = new Map<string, string>();
          const activityRows = importedActivities.map((a, i) => {
            const id = crypto.randomUUID();
            const isFolder = !a.start_date;
            idMap.set(String(i), id);
            return {
              id,
              project_id: projectId,
              name: a.name || "Imported Task",
              duration: a.duration ?? (isFolder ? 1 : 5),
              start_date: isFolder ? null : (a.start_date || format(new Date(), "yyyy-MM-dd")),
              end_date: isFolder ? null : (a.end_date || format(addDays(new Date(), a.duration ?? 5), "yyyy-MM-dd")),
              progress: a.progress ?? 0,
              is_milestone: a.is_milestone ?? false,
              sort_order: i + 1,
            };
          });

          await insertChunked("activities", activityRows);

          const parentUpdates = importedActivities
            .map((a, i) => ({ idx: String(i), parentIdx: a.parent_id }))
            .filter((u) => u.parentIdx && idMap.has(u.parentIdx!));

          for (let i = 0; i < parentUpdates.length; i += CHUNK) {
            const batch = parentUpdates.slice(i, i + CHUNK);
            await Promise.all(batch.map((u) => {
              const realId = idMap.get(u.idx);
              const realParentId = idMap.get(u.parentIdx!);
              if (realId && realParentId) {
                return supabase.from("activities").update({ parent_id: realParentId }).eq("id", realId);
              }
            }));
          }

          const depRows = importedDeps
            .map((d) => {
              const predId = idMap.get(d.predecessor_id || "");
              const succId = idMap.get(d.successor_id || "");
              if (!predId || !succId) return null;
              return {
                id: crypto.randomUUID(),
                project_id: projectId,
                predecessor_id: predId,
                successor_id: succId,
                type: (d.type as "FS" | "SS" | "FF" | "SF") || "FS",
                lag: d.lag ?? 0,
              };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null);

          if (depRows.length > 0) {
            await insertChunked("dependencies", depRows);
          }

          emitRefetch("activities");
          emitRefetch("dependencies");
        }}
        onClearSchedule={async () => {
          if (!projectId) return;
          const { error: depDelErr } = await supabase.from("dependencies").delete().eq("project_id", projectId);
          if (depDelErr) throw new Error("Failed to delete dependencies: " + depDelErr.message);
          const { error: actDelErr } = await supabase.from("activities").delete().eq("project_id", projectId);
          if (actDelErr) throw new Error("Failed to delete activities: " + actDelErr.message);
          emitRefetch("activities");
          emitRefetch("dependencies");
        }}
      />

      {/* Recovery Dialog */}
      <RecoveryDialog
        open={recoveryDialogOpen}
        onOpenChange={setRecoveryDialogOpen}
        activities={activities ?? []}
        dependencies={dependencies ?? []}
        delayInfo={recoveryDelayInfo}
        onApply={async (option: RecoveryOption) => {
          // Apply changes from the recovery option
          for (const change of option.changes) {
            if (change.type === "activity" && change.activity_id && change.field === "duration" && change.new_value != null) {
              const act = activities?.find((a) => a.id === change.activity_id);
              if (act?.start_date) {
                const newEnd = format(addDays(parseISO(act.start_date), Number(change.new_value)), "yyyy-MM-dd");
                await updateActivity.mutateAsync({ id: change.activity_id, duration: Number(change.new_value), end_date: newEnd });
              }
            } else if (change.type === "dependency" && change.predecessor_id && change.successor_id && change.new_type) {
              // Find and delete existing dependency, create new one
              const existing = dependencies?.find(
                (d) => d.predecessor_id === change.predecessor_id && d.successor_id === change.successor_id
              );
              if (existing && projectId) {
                await deleteDependency.mutateAsync({ id: existing.id, projectId });
              }
              if (projectId) {
                await createDependency.mutateAsync({
                  project_id: projectId,
                  predecessor_id: change.predecessor_id,
                  successor_id: change.successor_id,
                  type: change.new_type as "FS" | "SS" | "FF" | "SF",
                  lag: change.new_lag ?? 0,
                });
              }
            }
          }

          // Auto-save recovery baseline
          if (projectId && activities?.length) {
            const snapshot = activities.map((a) => {
              const cpm = getCpmData(a.id);
              return { id: a.id, start_date: a.start_date, end_date: a.end_date, duration: a.duration, is_critical: cpm.isCritical, total_float: cpm.totalFloat };
            });
            await createBaseline.mutateAsync({
              projectId,
              name: `Recovery - ${format(new Date(), "MMM d, yyyy")}`,
              snapshot,
            });
          }

          toast.success(`Applied "${option.name}" — ${option.days_recovered}d recovered`);
        }}
      />
    </div>
  );
}
