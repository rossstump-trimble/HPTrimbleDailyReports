"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Diamond,
  AlertTriangle,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  isSameMonth,
  isSameDay,
  differenceInCalendarDays,
  eachDayOfInterval,
  max as dateMax,
  min as dateMin,
} from "date-fns";
import { useProjectContext } from "@/contexts/ProjectContext";
import { useActivities } from "@/hooks/useActivities";
import { useScheduleFilters } from "@/components/schedule/ScheduleFilterPanel";
import { NoProjectSelected } from "@/components/NoProjectSelected";
import { ActivityDetailDialog } from "@/components/schedule/ActivityDetailDialog";
import { ScheduleEmptyState } from "@/components/schedule/ScheduleEmptyState";
import { useToolbarActions } from "@/components/schedule/ScheduleToolbar";
import type { Activity } from "@/hooks/useActivities";

type ViewMode = "month" | "week";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const BAR_COLORS = [
  "bg-blue-600 text-white",
  "bg-emerald-600 text-white",
  "bg-violet-600 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-600 text-white",
  "bg-fuchsia-600 text-white",
  "bg-primary text-primary-foreground",
];

function getBarColor(index: number): string {
  return BAR_COLORS[index % BAR_COLORS.length];
}

interface SpanSegment {
  activity: Activity;
  startCol: number;
  spanCols: number;
  lane: number;
  isStart: boolean;
  isEnd: boolean;
  colorIdx: number;
}

function computeWeekSegments(
  weekStart: Date,
  weekEnd: Date,
  activities: Activity[],
  activityColorMap: Map<string, number>
): { segments: SpanSegment[]; totalLanes: number } {
  const overlapping = activities.filter((a) => {
    if (!a.start_date || !a.end_date) return false;
    try {
      const aStart = parseISO(a.start_date);
      const aEnd = parseISO(a.end_date);
      return aStart <= weekEnd && aEnd >= weekStart;
    } catch {
      return false;
    }
  });

  overlapping.sort((a, b) => {
    const aStart = parseISO(a.start_date!);
    const bStart = parseISO(b.start_date!);
    if (aStart < bStart) return -1;
    if (aStart > bStart) return 1;
    return b.duration - a.duration;
  });

  const segments: SpanSegment[] = [];
  const laneEnds: number[] = [];

  for (const a of overlapping) {
    const aStart = parseISO(a.start_date!);
    const aEnd = parseISO(a.end_date!);

    const visStart = dateMax([aStart, weekStart]);
    const visEnd = dateMin([aEnd, weekEnd]);

    const startCol = differenceInCalendarDays(visStart, weekStart);
    const endCol = differenceInCalendarDays(visEnd, weekStart);
    const spanCols = endCol - startCol + 1;

    let lane = -1;
    for (let l = 0; l < laneEnds.length; l++) {
      if (laneEnds[l] < startCol) {
        lane = l;
        break;
      }
    }
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(-1);
    }
    laneEnds[lane] = endCol;

    segments.push({
      activity: a,
      startCol,
      spanCols,
      lane,
      isStart: aStart >= weekStart,
      isEnd: aEnd <= weekEnd,
      colorIdx: activityColorMap.get(a.id) ?? 0,
    });
  }

  return { segments, totalLanes: laneEnds.length };
}

const MONTH_BAR_H = 20;
const MONTH_BAR_GAP = 2;
const MONTH_MAX_LANES = 4;
const MONTH_HEADER_H = 26;
const MONTH_ROW_MIN_H = 140;

function MonthView({
  currentDate,
  activities,
  activityColorMap,
  onActivityClick,
}: {
  currentDate: Date;
  activities: Activity[];
  activityColorMap: Map<string, number>;
  onActivityClick: (a: Activity) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const today = new Date();

  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="border-l border-t rounded-lg overflow-hidden">
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-r border-b bg-muted/40 px-2 py-1.5 text-xs font-medium text-muted-foreground text-center"
          >
            {label}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => {
        const wStart = week[0];
        const wEnd = week[6];
        const { segments, totalLanes } = computeWeekSegments(wStart, wEnd, activities, activityColorMap);
        const visibleLanes = Math.min(totalLanes, MONTH_MAX_LANES);
        const overflowCount = segments.filter((s) => s.lane >= MONTH_MAX_LANES).length;
        const barZoneHeight = visibleLanes * (MONTH_BAR_H + MONTH_BAR_GAP) + (overflowCount > 0 ? 16 : 0);

        return (
          <div key={wi} className="grid grid-cols-7 relative">
            {week.map((day, di) => {
              const isToday = isSameDay(day, today);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div
                  key={di}
                  className={`border-r border-b transition-colors ${
                    isToday
                      ? "bg-primary/10"
                      : !isCurrentMonth
                      ? "bg-muted/20"
                      : isWeekend
                      ? "bg-muted/10"
                      : "bg-card"
                  }`}
                  style={{ minHeight: Math.max(MONTH_ROW_MIN_H, MONTH_HEADER_H + barZoneHeight + 12) }}
                >
                  <div className="p-1">
                    <span
                      className={`text-xs font-medium leading-5 w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-primary text-primary-foreground font-semibold"
                          : !isCurrentMonth
                          ? "text-muted-foreground/40"
                          : "text-foreground"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                </div>
              );
            })}

            {segments
              .filter((s) => s.lane < MONTH_MAX_LANES)
              .map((seg) => {
                const leftPct = (seg.startCol / 7) * 100;
                const widthPct = (seg.spanCols / 7) * 100;
                const top = MONTH_HEADER_H + seg.lane * (MONTH_BAR_H + MONTH_BAR_GAP);
                const roundedL = seg.isStart ? "rounded-l" : "";
                const roundedR = seg.isEnd ? "rounded-r" : "";

                return (
                  <div
                    key={seg.activity.id}
                    className="absolute z-10 px-0.5 cursor-pointer"
                    style={{
                      top,
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      height: MONTH_BAR_H,
                    }}
                    onClick={() => onActivityClick(seg.activity)}
                  >
                    <div
                      className={`h-full ${roundedL} ${roundedR} ${getBarColor(seg.colorIdx)} flex items-center overflow-hidden hover:brightness-110 transition-[filter]`}
                      title={`${seg.activity.name} (${seg.activity.duration}d)`}
                    >
                      <span className="text-[10px] font-medium leading-none px-1.5 truncate">
                        {seg.activity.is_milestone && (
                          <Diamond className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />
                        )}
                        {seg.activity.name}
                      </span>
                    </div>
                  </div>
                );
              })}

            {overflowCount > 0 && (
              <div
                className="absolute z-10 text-[10px] text-muted-foreground pl-2"
                style={{ top: MONTH_HEADER_H + MONTH_MAX_LANES * (MONTH_BAR_H + MONTH_BAR_GAP), left: 0 }}
              >
                +{overflowCount} more
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const WEEK_BAR_H = 24;
const WEEK_BAR_GAP = 3;
const WEEK_HEADER_H = 0;
const WEEK_MAX_LANES = 20;
const WEEK_ROW_MIN_H = 360;

function WeekView({
  currentDate,
  activities,
  activityColorMap,
  onActivityClick,
}: {
  currentDate: Date;
  activities: Activity[];
  activityColorMap: Map<string, number>;
  onActivityClick: (a: Activity) => void;
}) {
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = days[6];
  const today = new Date();

  const { segments, totalLanes } = computeWeekSegments(weekStart, weekEnd, activities, activityColorMap);
  const barZoneHeight = Math.max(totalLanes, 1) * (WEEK_BAR_H + WEEK_BAR_GAP) + 8;

  return (
    <div className="border-l border-t rounded-lg overflow-hidden">
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`border-r border-b px-2 py-1.5 text-center ${
              isSameDay(day, today) ? "bg-primary/15 ring-2 ring-inset ring-primary/40" : "bg-muted/40"
            }`}
          >
            <div className="text-xs font-medium text-muted-foreground">{WEEKDAY_LABELS[day.getDay()]}</div>
            <div className={`text-lg font-semibold ${isSameDay(day, today) ? "text-primary" : "text-foreground"}`}>
              {day.getDate()}
            </div>
            <div className="text-[10px] text-muted-foreground">{format(day, "MMM")}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 relative" style={{ minHeight: Math.max(WEEK_ROW_MIN_H, barZoneHeight + 16) }}>
        {days.map((day, di) => {
          const isTodayCell = isSameDay(day, today);
          return (
            <div
              key={di}
              className={`border-r border-b ${
                isTodayCell
                  ? "bg-primary/10"
                  : day.getDay() === 0 || day.getDay() === 6
                  ? "bg-muted/10"
                  : "bg-card"
              }`}
              style={{ minHeight: Math.max(WEEK_ROW_MIN_H, barZoneHeight + 16) }}
            />
          );
        })}

        {segments
          .filter((s) => s.lane < WEEK_MAX_LANES)
          .map((seg) => {
            const leftPct = (seg.startCol / 7) * 100;
            const widthPct = (seg.spanCols / 7) * 100;
            const top = 8 + WEEK_HEADER_H + seg.lane * (WEEK_BAR_H + WEEK_BAR_GAP);
            const roundedL = seg.isStart ? "rounded-l-md" : "";
            const roundedR = seg.isEnd ? "rounded-r-md" : "";

            return (
              <div
                key={seg.activity.id}
                className="absolute z-10 px-0.5 cursor-pointer"
                style={{
                  top,
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  height: WEEK_BAR_H,
                }}
                onClick={() => onActivityClick(seg.activity)}
              >
                <div
                  className={`h-full ${roundedL} ${roundedR} ${getBarColor(seg.colorIdx)} flex items-center overflow-hidden shadow-sm hover:brightness-110 transition-[filter]`}
                  title={`${seg.activity.name} (${seg.activity.duration}d)${seg.activity.is_critical ? " — Critical" : ""}`}
                >
                  <span className="text-[11px] font-medium leading-none px-2 truncate">
                    {seg.activity.is_milestone && (
                      <Diamond className="h-2.5 w-2.5 inline mr-1 -mt-px" />
                    )}
                    {seg.activity.name}
                    {seg.isStart && <span className="opacity-70 ml-1">({seg.activity.duration}d)</span>}
                  </span>
                  {seg.activity.is_critical && (
                    <AlertTriangle className="h-3 w-3 shrink-0 mr-1 opacity-80" />
                  )}
                </div>
              </div>
            );
          })}

        {segments.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/50 italic">
            No activities this week
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScheduleCalendarView() {
  const { activeProjectId: projectId } = useProjectContext();
  const { data: activities, isLoading } = useActivities(projectId ?? undefined);
  const toolbarActions = useToolbarActions();
  const filters = useScheduleFilters();
  const filterFolder = filters?.filterFolder ?? "";
  const filterLocation = filters?.filterLocation ?? "";
  const filterOwner = filters?.filterOwner ?? "";
  const filterPackage = filters?.filterPackage ?? "";
  const filterSubcontractor = filters?.filterSubcontractor ?? "";
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const handleActivityClick = useCallback((a: Activity) => { setDetailActivity(a); setDetailOpen(true); }, []);

  const scheduledActivities = useMemo(() => {
    let list = (activities ?? []).filter((a) => a.start_date && a.end_date);
    const hasAnyFilter = filterFolder || filterLocation || filterOwner || filterPackage || filterSubcontractor;
    if (hasAnyFilter) {
      const parentIds = new Set(activities?.filter((a) => activities.some((c) => c.parent_id === a.id)).map((a) => a.id) ?? []);
      const matchesMetadata = (a: typeof list[0]) => {
        if (filterLocation && a.location !== filterLocation) return false;
        if (filterOwner && a.owner !== filterOwner) return false;
        if (filterPackage && a.package !== filterPackage) return false;
        if (filterSubcontractor && a.subcontractor !== filterSubcontractor) return false;
        return true;
      };
      const folderFilterId = filterFolder && activities ? activities.find((a) => parentIds.has(a.id) && a.name === filterFolder)?.id ?? null : null;
      list = list.filter((a) => {
        if (folderFilterId && a.id !== folderFilterId && a.parent_id !== folderFilterId) return false;
        return matchesMetadata(a);
      });
    }
    return list;
  }, [activities, filterFolder, filterLocation, filterOwner, filterPackage, filterSubcontractor]);

  const activityColorMap = useMemo(() => {
    const map = new Map<string, number>();
    scheduledActivities.forEach((a, i) => map.set(a.id, i));
    return map;
  }, [scheduledActivities]);

  const navigateBack = useCallback(() => {
    setCurrentDate((d) => (viewMode === "month" ? addMonths(d, -1) : addWeeks(d, -1)));
  }, [viewMode]);

  const navigateForward = useCallback(() => {
    setCurrentDate((d) => (viewMode === "month" ? addMonths(d, 1) : addWeeks(d, 1)));
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

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

  const headerLabel =
    viewMode === "month"
      ? format(currentDate, "MMMM yyyy")
      : `${format(startOfWeek(currentDate), "MMM d")} – ${format(endOfWeek(currentDate), "MMM d, yyyy")}`;

  return (
    <div className="space-y-4 min-h-[calc(100vh-12rem)] flex flex-col">
      <Card className="border-0 shadow-md flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={navigateBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-8 px-3 text-xs shrink-0 flex items-center justify-center" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={navigateForward}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold ml-2">{headerLabel}</h2>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("month")}
              className={`h-8 min-w-[4.5rem] flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`h-8 min-w-[4rem] flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Week
            </button>
          </div>
        </div>
        <CardContent className="p-4 flex-1 min-h-0 overflow-auto">
          {scheduledActivities.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No activities have dates assigned yet. Set start dates in the Gantt view.
            </div>
          ) : viewMode === "month" ? (
            <MonthView currentDate={currentDate} activities={scheduledActivities} activityColorMap={activityColorMap} onActivityClick={handleActivityClick} />
          ) : (
            <WeekView currentDate={currentDate} activities={scheduledActivities} activityColorMap={activityColorMap} onActivityClick={handleActivityClick} />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-primary" /> Today
        </span>
        <span className="flex items-center gap-1">
          <Diamond className="h-3 w-3 text-amber-500" /> Milestone
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-destructive" /> Critical path
        </span>
      </div>

      <ActivityDetailDialog
        activity={detailActivity}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onBreakdown={() => {}}
      />
    </div>
  );
}
