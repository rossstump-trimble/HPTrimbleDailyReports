import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Plus, AlertTriangle, GripVertical, Trash2, Layers, MapPin, User, HardHat, X, CalendarCheck, ClipboardCheck, Link2, ChevronRight, FileText, Printer } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useSearchParams } from "react-router-dom";
import { useProjects, useClaimDemoProject, DEMO_PROJECT_ID } from "@/hooks/useProjects";
import { useProjectContext } from "@/contexts/ProjectContext";
import { useScheduleFilters } from "@/components/schedule/ScheduleFilterPanel";
import { NoProjectSelected } from "@/components/NoProjectSelected";
import { useActivities } from "@/hooks/useActivities";
import { useLookaheadTasks, useCreateLookaheadTask, useUpdateLookaheadTask, useDeleteLookaheadTask, type LookaheadStatus } from "@/hooks/useLookaheadTasks";
import { useCommitWeek, useWeeklyCommitments } from "@/hooks/useWeeklyCommitments";
import { useUpsertProgressSnapshot } from "@/hooks/useProgressSnapshots";
import { WeeklyReviewDialog } from "@/components/analytics/WeeklyReviewDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BreakdownDialog } from "@/components/lookahead/BreakdownDialog";
import { TaskDetailDialog } from "@/components/lookahead/TaskDetailDialog";
import { startOfWeek, differenceInCalendarDays, parseISO, format } from "date-fns";
import type { Activity } from "@/hooks/useActivities";
import { InlineEdit } from "@/components/schedule/InlineEdit";
import { useToolbarPortalRef } from "@/components/schedule/ScheduleNewModule";
import LookaheadReport from "@/app/schedule/LookaheadReport";

const columns: { key: LookaheadStatus; label: string; gradient: string }[] = [
  { key: "backlog", label: "Backlog", gradient: "gradient-secondary" },
  { key: "this_week", label: "This Week", gradient: "gradient-primary" },
  { key: "in_progress", label: "In Progress", gradient: "gradient-warm" },
  { key: "complete", label: "Complete", gradient: "gradient-success" },
];

/** Returns a due-date badge config or null */
function getDueBadge(endDate: string | null, status: string): { label: string; className: string } | null {
  if (!endDate || status === "complete") return null;
  const diff = differenceInCalendarDays(parseISO(endDate), new Date());
  if (diff < 0) return { label: "Overdue", className: "bg-destructive/15 text-destructive border-destructive/30" };
  if (diff === 0) return { label: "Due today", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" };
  if (diff <= 2) return { label: `Due in ${diff}d`, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" };
  return null;
}

/** Interactive progress dots (0/25/50/75/100) */
function ProgressDots({ progress, onUpdate }: { progress: number; onUpdate: (next: number) => void }) {
  const steps = [25, 50, 75, 100];
  return (
    <div className="flex items-center gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
      {steps.map((step) => (
        <button
          key={step}
          onClick={() => {
            // If clicking the current filled dot, step back to previous increment
            const next = progress >= step ? step - 25 : step;
            onUpdate(next);
          }}
          className={`h-2 w-2 rounded-full border transition-colors ${
            progress >= step
              ? "bg-primary border-primary"
              : "bg-secondary border-border hover:border-primary/50"
          }`}
          title={`${step}%`}
        />
      ))}
      <span className="text-[10px] text-muted-foreground ml-1">{progress}%</span>
    </div>
  );
}

export default function Lookahead() {
  const { activeProjectId: projectId } = useProjectContext();
  const toolbarPortalNode = useToolbarPortalRef();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: projects } = useProjects();
  const { data: activities } = useActivities(projectId ?? undefined);
  const { data: tasks, isLoading } = useLookaheadTasks(projectId ?? undefined);
  const [reportOpen, setReportOpen] = useState(false);
  const claimDemo = useClaimDemoProject();
  const commitWeekMut = useCommitWeek();
  const upsertSnapshot = useUpsertProgressSnapshot();
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];
  const { data: weekCommitments } = useWeeklyCommitments(projectId ?? undefined, currentWeekStart);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Auto-claim demo project if data is blocked by RLS
  useEffect(() => {
    if (
      projectId === DEMO_PROJECT_ID &&
      !isLoading &&
      tasks !== undefined &&
      tasks.length === 0 &&
      !claimDemo.isPending &&
      !claimDemo.isSuccess
    ) {
      claimDemo.mutate();
    }
  }, [projectId, isLoading, tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const [detailFromSubmittals, setDetailFromSubmittals] = useState(false);

  // Auto-open task detail when navigated with ?activityId=
  useEffect(() => {
    const activityId = searchParams.get("activityId");
    if (activityId && tasks?.length) {
      const found = tasks.find((t) => t.activity_id === activityId);
      if (found) {
        setDetailTask(found);
        setDetailOpen(true);
        setDetailFromSubmittals(searchParams.get("from") === "submittals");
        setSearchParams((prev) => { prev.delete("activityId"); prev.delete("from"); return prev; }, { replace: true });
      }
    }
  }, [searchParams, tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const createTask = useCreateLookaheadTask();
  const updateTask = useUpdateLookaheadTask();
  const deleteTask = useDeleteLookaheadTask();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newActivityId, setNewActivityId] = useState<string>("none");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ column: LookaheadStatus; beforeId: string | null } | null>(null);

  const filters = useScheduleFilters();
  const filterLocation = filters?.filterLocation ?? "";
  const filterOwner = filters?.filterOwner ?? "";
  const filterPackage = filters?.filterPackage ?? "";
  const filterSubcontractor = filters?.filterSubcontractor ?? "";

  // Breakdown + detail dialog state
  const [breakdownActivity, setBreakdownActivity] = useState<Activity | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filtered tasks (uses shared sidebar filters)
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (filterLocation && t.location !== filterLocation) return false;
      if (filterOwner && t.owner !== filterOwner) return false;
      if (filterPackage && t.package !== filterPackage) return false;
      if (filterSubcontractor && t.subcontractor !== filterSubcontractor) return false;
      return true;
    });
  }, [tasks, filterLocation, filterOwner, filterPackage, filterSubcontractor]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      const payload: any = { project_id: projectId, name: newName };
      if (newActivityId && newActivityId !== "none") payload.activity_id = newActivityId;
      if (newStartDate) payload.start_date = newStartDate;
      if (newEndDate) payload.end_date = newEndDate;
      if (newOwner) payload.owner = newOwner;
      if (newLocation) payload.location = newLocation;
      await createTask.mutateAsync(payload);
      toast.success("Task added");
      setAddOpen(false);
      setNewName("");
      setNewActivityId("none");
      setNewStartDate("");
      setNewEndDate("");
      setNewOwner("");
      setNewLocation("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDrop = async (status: LookaheadStatus, beforeId: string | null = null) => {
    if (!draggedId || !projectId) return;
    const draggedTask = filteredTasks.find((t) => t.id === draggedId);
    if (!draggedTask) { setDraggedId(null); return; }

    // Constraint gate: block move to "this_week" if any constraint is uncleared
    if (status === "this_week" && draggedTask.status !== "this_week") {
      const uncleared = [
        !draggedTask.constraint_labor && "Labor",
        !draggedTask.constraint_equipment && "Equipment",
        !draggedTask.constraint_materials && "Materials",
        !draggedTask.constraint_design && "Design",
      ].filter(Boolean);
      if (uncleared.length > 0) {
        toast.error(`Cannot move to This Week — clear constraints first: ${uncleared.join(", ")}`);
        setDraggedId(null);
        setDropTarget(null);
        return;
      }
    }

    const colTasks = filteredTasks.filter((t) => t.status === status && t.id !== draggedId);
    
    // Calculate new sort_order based on drop position
    let newSortOrder: number;
    if (!beforeId) {
      // Drop at end
      const maxOrder = colTasks.length > 0 ? Math.max(...colTasks.map((t) => t.sort_order ?? 0)) : 0;
      newSortOrder = maxOrder + 1;
    } else {
      const targetIdx = colTasks.findIndex((t) => t.id === beforeId);
      if (targetIdx <= 0) {
        const firstOrder = colTasks[0]?.sort_order ?? 0;
        newSortOrder = firstOrder - 1;
      } else {
        const prev = colTasks[targetIdx - 1]?.sort_order ?? 0;
        const curr = colTasks[targetIdx]?.sort_order ?? prev + 2;
        newSortOrder = Math.floor((prev + curr) / 2);
        // If no room, reindex the whole column
        if (newSortOrder === prev || newSortOrder === curr) {
          const reindexed = [...colTasks];
          reindexed.splice(targetIdx, 0, draggedTask);
          const updates = reindexed.map((t, i) => 
            updateTask.mutateAsync({ id: t.id, status, sort_order: i * 10 } as any)
          );
          await Promise.all(updates);
          setDraggedId(null);
          setDropTarget(null);
          return;
        }
      }
    }

    try {
      const update: any = { id: draggedId, status, sort_order: newSortOrder };
      await updateTask.mutateAsync(update);
    } catch (err: any) {
      toast.error(err.message);
    }
    setDraggedId(null);
    setDropTarget(null);
  };

  const handleProgressUpdate = async (taskId: string, newProgress: number) => {
    try {
      const update: any = { id: taskId, progress: newProgress };
      if (newProgress >= 100) update.status = "complete";
      await updateTask.mutateAsync(update);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleConstraint = async (taskId: string, field: string, current: boolean) => {
    try {
      await updateTask.mutateAsync({ id: taskId, [field]: !current } as any);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleRoadblock = async (taskId: string, current: boolean) => {
    try {
      await updateTask.mutateAsync({ id: taskId, has_roadblock: !current });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!projectId) {
    return <NoProjectSelected module="Lookahead" />;
  }

  const currentProject = projects?.find((p) => p.id === projectId);

  // Group activities: identify which have linked tasks
  const activityTaskMap = new Map<string, typeof tasks>();
  const unlinkedTasks: typeof tasks = [];
  if (tasks) {
    for (const t of tasks) {
      if (t.activity_id) {
        const list = activityTaskMap.get(t.activity_id) ?? [];
        list.push(t);
        activityTaskMap.set(t.activity_id, list);
      } else {
        unlinkedTasks.push(t);
      }
    }
  }

  // Get parent activity name for a task
  const getParentName = (activityId: string | null) => {
    if (!activityId || !activities) return undefined;
    return activities.find((a) => a.id === activityId)?.name;
  };

  // Show leaf activities (non-folders) that have no linked tasks yet
  const leafActivities = activities?.filter((a) => {
    const hasChildren = activities.some((c) => c.parent_id === a.id);
    return !hasChildren;
  }) ?? [];
  const unplannedActivities = leafActivities.filter((a) => !activityTaskMap.has(a.id));

  // Check for critical path roadblock warnings
  const roadblockWarnings: { taskName: string; activityName: string }[] = [];
  if (tasks && activities) {
    for (const t of tasks) {
      if (t.has_roadblock && t.activity_id) {
        const parent = activities.find((a) => a.id === t.activity_id);
        if (parent?.is_critical) {
          roadblockWarnings.push({ taskName: t.name, activityName: parent.name });
        }
      }
    }
  }

  // Build predecessor lookup for dependency dimming
  const predecessorComplete = (task: any): boolean => {
    if (!task.predecessor_task_id || !tasks) return true;
    const pred = tasks.find((t) => t.id === task.predecessor_task_id);
    return !pred || pred.status === "complete" || Number(pred.progress ?? 0) >= 100;
  };

  const toolbarButtons = toolbarPortalNode ? createPortal(
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (!projectId || !tasks) return;
          const thisWeekTasks = tasks.filter((t) => t.status === "this_week" || t.status === "in_progress");
          if (!thisWeekTasks.length) { toast.error("No tasks in 'This Week' or 'In Progress' to commit"); return; }
          commitWeekMut.mutate(
            { projectId, tasks: thisWeekTasks, weekStart: currentWeekStart },
            {
              onSuccess: () => {
                const totalActivities = activities?.length ?? 1;
                const avgProgress = activities?.length
                  ? activities.reduce((s, a) => s + Number(a.progress ?? 0), 0) / totalActivities
                  : 0;
                upsertSnapshot.mutate({
                  project_id: projectId,
                  week_start: currentWeekStart,
                  planned_pct: Math.round(avgProgress),
                  actual_pct: Math.round(avgProgress),
                });
                toast.success(`${thisWeekTasks.length} tasks committed for this week`);
              },
            }
          );
        }}
        disabled={commitWeekMut.isPending}
      >
        <CalendarCheck className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Commit Week</span>
      </Button>
      {(weekCommitments?.length ?? 0) > 0 && (
        <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)}>
          <ClipboardCheck className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Review Week</span>
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={() => setReportOpen(true)}>
        <FileText className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Report</span>
      </Button>
      <Button size="sm" onClick={() => setAddOpen(true)}>
        <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Task</span>
      </Button>
    </>,
    toolbarPortalNode
  ) : null;

  return (
    <div className="space-y-4">
      {toolbarButtons}

      {/* Critical path roadblock warnings */}
      {roadblockWarnings.length > 0 && (
        <div className="space-y-1">
          {roadblockWarnings.map((w, i) => (
            <div key={i} className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                Roadblock on <strong>{w.taskName}</strong> may impact critical path activity <strong>{w.activityName}</strong>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Weekly PPC Metric */}
      {weekCommitments && weekCommitments.length > 0 && (() => {
        const total = weekCommitments.length;
        const completed = weekCommitments.filter((c) => c.completed).length;
        const ppc = total > 0 ? Math.round((completed / total) * 100) : 0;
        const ppcColor = ppc >= 80 ? "text-success" : ppc >= 60 ? "text-amber-500" : "text-destructive";
        return (
          <Card className="border-0 shadow-md">
            <CardContent className="py-3 px-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">This Week&apos;s PPC</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-heading font-bold ${ppcColor}`}>{ppc}%</span>
                <span className="text-xs text-muted-foreground">{completed}/{total} committed tasks complete</span>
              </div>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${ppc >= 80 ? "bg-success" : ppc >= 60 ? "bg-amber-500" : "bg-destructive"}`}
                  style={{ width: `${ppc}%` }}
                />
              </div>
              {ppc < 80 && (
                <span className="text-[10px] text-muted-foreground">Target: 80%</span>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Unplanned activities (collapsible) */}
      {unplannedActivities.length > 0 && (
        <Collapsible defaultOpen={false}>
          <Card className="border-0 shadow-md">
            <CollapsibleTrigger asChild>
              <CardHeader className="py-3 cursor-pointer select-none group">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  Unplanned Activities
                  <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs">{unplannedActivities.length}</span>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {unplannedActivities.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setBreakdownActivity(a); setBreakdownOpen(true); }}
                      className="px-3 py-1.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      {a.name}
                      <span className="text-xs ml-1.5">({a.duration}d)</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks
            .filter((t) => t.status === col.key)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          return (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onDragOver={(e) => {
                e.preventDefault();
                // If over the column but not a card, set drop target to end
                if ((e.target as HTMLElement).closest('[data-task-id]') === null) {
                  setDropTarget({ column: col.key, beforeId: null });
                }
              }}
              onDrop={() => handleDrop(col.key, dropTarget?.column === col.key ? dropTarget.beforeId : null)}
            >
              <Card className="border-0 shadow-md min-h-[400px]">
                <div className={`h-1 ${col.gradient} rounded-t-lg`} />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading flex items-center justify-between">
                    {col.label}
                    <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs">{colTasks.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {colTasks.map((task) => {
                    const parentName = getParentName(task.activity_id);
                    const dueBadge = getDueBadge(task.end_date, task.status);
                    const predReady = predecessorComplete(task);
                    return (
                      <div
                        key={task.id}
                        data-task-id={task.id}
                        draggable
                        onDragStart={() => setDraggedId(task.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDropTarget({ column: col.key, beforeId: task.id });
                        }}
                        className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                          task.has_roadblock ? "border-destructive/30 bg-destructive/5" : "bg-card"
                        } ${!predReady ? "opacity-50" : ""} ${
                          dropTarget?.column === col.key && dropTarget?.beforeId === task.id
                            ? "border-t-2 border-t-primary"
                            : ""
                        }`}
                      >
                        {/* Parent activity badge */}
                        {parentName && (
                          <div className="text-[10px] text-primary font-medium mb-1 truncate">{parentName}</div>
                        )}
                        
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <InlineEdit
                              value={task.name}
                              onSave={(val) => updateTask.mutate({ id: task.id, name: val })}
                              onSingleClick={() => { setDetailTask(task); setDetailOpen(true); }}
                              className="text-sm font-medium text-left hover:text-primary transition-colors"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            {(task as any).predecessor_task_id && (
                              <Link2 className="h-3 w-3 text-muted-foreground" />
                            )}
                            {task.has_roadblock && (
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => deleteTask.mutate({ id: task.id, projectId: projectId! })}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>

                        {/* Due date badge */}
                        {dueBadge && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${dueBadge.className}`}>
                              {dueBadge.label}
                            </span>
                          </div>
                        )}

                        {/* Metadata chips */}
                        {((task as any).location || (task as any).owner || (task as any).subcontractor) && (
                          <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                            {(task as any).location && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                                <MapPin className="h-2.5 w-2.5" />{(task as any).location}
                              </span>
                            )}
                            {(task as any).owner && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                                <User className="h-2.5 w-2.5" />{(task as any).owner}
                              </span>
                            )}
                            {(task as any).subcontractor && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                                <HardHat className="h-2.5 w-2.5" />{(task as any).subcontractor}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Duration display */}
                        <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
                          {(task as any).duration ? (
                            <InlineEdit
                              value={String((task as any).duration)}
                              onSave={(val) => updateTask.mutate({ id: task.id, duration: parseInt(val) || (task as any).duration })}
                              type="number"
                              min={1}
                              suffix="d"
                              className="inline"
                            />
                          ) : null}
                          {(task as any).start_date && <span>· {(task as any).start_date}</span>}
                        </div>

                        {/* Interactive progress dots */}
                        <ProgressDots
                          progress={Number((task as any).progress ?? 0)}
                          onUpdate={(next) => handleProgressUpdate(task.id, next)}
                        />

                        {/* Constraints */}
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                          {[
                            { key: "constraint_labor", label: "Labor", val: task.constraint_labor },
                            { key: "constraint_equipment", label: "Equip", val: task.constraint_equipment },
                            { key: "constraint_materials", label: "Materials", val: task.constraint_materials },
                            { key: "constraint_design", label: "Design", val: task.constraint_design },
                          ].map((c) => (
                            <button
                              key={c.key}
                              onClick={() => toggleConstraint(task.id, c.key, c.val ?? false)}
                              className={`px-1.5 py-0.5 rounded-full border transition-colors ${
                                c.val ? "bg-success/10 border-success/30 text-success" : "bg-secondary border-border text-muted-foreground"
                              }`}
                            >
                              {c.val ? "✓" : "○"} {c.label}
                            </button>
                          ))}
                        </div>

                        {/* Roadblock toggle */}
                        <button
                          onClick={() => toggleRoadblock(task.id, task.has_roadblock ?? false)}
                          className={`mt-2 text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                            task.has_roadblock ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-secondary border-border text-muted-foreground"
                          }`}
                        >
                          {task.has_roadblock ? "⚠ Roadblock" : "Flag Roadblock"}
                        </button>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      Drop tasks here
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Add Task Dialog — Enriched */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Lookahead Task</DialogTitle>
            <DialogDescription>Add a task to the backlog</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Task Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Pour Concrete Slab B" required />
            </div>

            <div className="space-y-2">
              <Label>Link to Activity (optional)</Label>
              <Select value={newActivityId} onValueChange={setNewActivityId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {leafActivities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" />Owner</Label>
                <Input value={newOwner} onChange={(e) => setNewOwner(e.target.value)} placeholder="e.g. John" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />Location</Label>
                <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="e.g. Level 2" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createTask.isPending}>
                {createTask.isPending ? "Adding..." : "Add Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Breakdown Dialog */}
      <BreakdownDialog
        activity={breakdownActivity}
        open={breakdownOpen}
        onOpenChange={setBreakdownOpen}
      />

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={detailTask}
        open={detailOpen}
        onOpenChange={(open) => { setDetailOpen(open); if (!open) setDetailFromSubmittals(false); }}
        parentActivityName={detailTask ? getParentName(detailTask.activity_id) : undefined}
        allTasks={tasks ?? []}
        fromSubmittals={detailFromSubmittals}
      />

      {/* Weekly Review Dialog */}
      {weekCommitments && weekCommitments.length > 0 && (
        <WeeklyReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          commitments={weekCommitments}
          taskNames={(() => {
            const m = new Map<string, string>();
            tasks?.forEach((t) => m.set(t.id, t.name));
            return m;
          })()}
        />
      )}

      {/* Lookahead Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-heading flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Lookahead Report
                </DialogTitle>
                <DialogDescription>
                  Issued {format(new Date(), "MMM d, yyyy")}
                </DialogDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="mr-6">
                <Printer className="h-4 w-4 mr-2" />Print / Share
              </Button>
            </div>
          </DialogHeader>
          <LookaheadReport />
        </DialogContent>
      </Dialog>
    </div>
  );
}
