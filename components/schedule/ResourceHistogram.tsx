import { useMemo } from "react";
import { differenceInCalendarDays, parseISO, addDays, format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import type { ResourceRole } from "@/hooks/useResourceRoles";
import type { CrewAssignment } from "@/hooks/useCrewAssignments";
import type { LookaheadTask } from "@/hooks/useLookaheadTasks";

const ROLE_COLORS = [
  "hsl(220 70% 55%)",   // blue
  "hsl(150 60% 45%)",   // green
  "hsl(35 90% 55%)",    // amber
  "hsl(340 70% 55%)",   // rose
  "hsl(270 60% 55%)",   // purple
  "hsl(180 60% 45%)",   // teal
  "hsl(15 80% 55%)",    // orange
  "hsl(200 70% 50%)",   // sky
];

interface Props {
  timelineStart: Date;
  totalDays: number;
  dayWidth: number;
  roles: ResourceRole[];
  assignments: (CrewAssignment & { lookahead_tasks: { project_id: string } })[];
  tasks: LookaheadTask[];
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

interface DayDemand {
  role_id: string;
  role_name: string;
  count: number;
  color: string;
  capacity: number;
}

export function ResourceHistogram({ timelineStart, totalDays, dayWidth, roles, assignments, tasks, scrollRef, onScroll }: Props) {
  const HISTOGRAM_HEIGHT = 120;

  // Map role_id -> color, capacity
  const roleMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string; capacity: number }>();
    roles.forEach((r, i) => {
      m.set(r.id, { name: r.name, color: ROLE_COLORS[i % ROLE_COLORS.length], capacity: r.capacity });
    });
    return m;
  }, [roles]);

  // Build daily demand: Map<dayIndex, DayDemand[]>
  const { dailyDemand, maxDemand, overloads } = useMemo(() => {
    const demand = new Map<number, Map<string, number>>();

    // For each assignment, find the task and spread headcount across its date range
    for (const a of assignments) {
      const task = tasks.find((t) => t.id === a.task_id);
      if (!task?.start_date || !task?.end_date) continue;

      const taskStart = differenceInCalendarDays(parseISO(task.start_date), timelineStart);
      const taskEnd = differenceInCalendarDays(parseISO(task.end_date), timelineStart);

      for (let d = Math.max(0, taskStart); d < Math.min(totalDays, taskEnd); d++) {
        if (!demand.has(d)) demand.set(d, new Map());
        const dayMap = demand.get(d)!;
        dayMap.set(a.role_id, (dayMap.get(a.role_id) ?? 0) + a.headcount);
      }
    }

    // Compute max and overloads
    let max = 0;
    const overloadList: { roleName: string; excess: number; startDay: number; endDay: number }[] = [];

    // Track consecutive overload ranges per role
    const activeOverloads = new Map<string, { roleName: string; excess: number; startDay: number }>();

    for (let d = 0; d < totalDays; d++) {
      const dayMap = demand.get(d);
      const dayTotal = dayMap ? Array.from(dayMap.values()).reduce((s, v) => s + v, 0) : 0;
      if (dayTotal > max) max = dayTotal;

      // Check per-role overloads
      for (const [roleId, info] of Array.from(roleMap.entries())) {
        const count = dayMap?.get(roleId) ?? 0;
        const excess = count - info.capacity;

        if (excess > 0) {
          if (!activeOverloads.has(roleId)) {
            activeOverloads.set(roleId, { roleName: info.name, excess, startDay: d });
          } else {
            const active = activeOverloads.get(roleId)!;
            active.excess = Math.max(active.excess, excess);
          }
        } else if (activeOverloads.has(roleId)) {
          const active = activeOverloads.get(roleId)!;
          overloadList.push({ ...active, endDay: d - 1 });
          activeOverloads.delete(roleId);
        }
      }
    }
    // Close any remaining
    for (const [, active] of Array.from(activeOverloads.entries())) {
      overloadList.push({ ...active, endDay: totalDays - 1 });
    }

    return { dailyDemand: demand, maxDemand: max, overloads: overloadList };
  }, [assignments, tasks, timelineStart, totalDays, roleMap]);

  // Scale: max of maxDemand or max capacity
  const maxCapacity = Math.max(...roles.map((r) => r.capacity), 1);
  const scaleMax = Math.max(maxDemand, maxCapacity, 1);
  const yScale = (HISTOGRAM_HEIGHT - 20) / scaleMax; // leave room for labels

  return (
    <div>
      {/* Overload alerts */}
      {overloads.length > 0 && (
        <div className="px-3 py-2 mb-1 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive space-y-0.5">
            {overloads.slice(0, 3).map((o, i) => (
              <div key={i}>
                <strong>{o.roleName}</strong> exceeds capacity by {o.excess} on{" "}
                {format(addDays(timelineStart, o.startDay), "MMM d")}
                {o.endDay !== o.startDay && `–${format(addDays(timelineStart, o.endDay), "MMM d")}`}
              </div>
            ))}
            {overloads.length > 3 && <div>...and {overloads.length - 3} more overloads</div>}
          </div>
        </div>
      )}

      <div className="flex border-t">
        {/* Legend */}
        <div className="w-72 flex-shrink-0 border-r bg-secondary/30 p-2 space-y-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resources</span>
          {roles.map((r, i) => (
            <div key={r.id} className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: ROLE_COLORS[i % ROLE_COLORS.length] }} />
              <span className="truncate">{r.name}</span>
              <span className="text-muted-foreground ml-auto">{r.capacity}</span>
            </div>
          ))}
        </div>

        {/* Histogram bars */}
        <div className="flex-1 overflow-x-auto" ref={scrollRef} onScroll={onScroll}>
          <div className="relative" style={{ width: totalDays * dayWidth, height: HISTOGRAM_HEIGHT }}>
            {/* Grid lines */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = addDays(timelineStart, i);
              const dow = day.getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isMonday = dow === 1;
              return (
                <div
                  key={i}
                  className={`absolute top-0 bottom-0 border-r ${isMonday ? "border-border" : "border-border/30"} ${isWeekend ? "bg-muted/20" : ""}`}
                  style={{ left: i * dayWidth, width: dayWidth }}
                />
              );
            })}

            {/* Capacity lines per role */}
            {roles.map((r, i) => {
              const y = HISTOGRAM_HEIGHT - r.capacity * yScale;
              return (
                <div
                  key={r.id}
                  className="absolute left-0 right-0 border-t-2 border-dashed pointer-events-none z-10"
                  style={{
                    top: y,
                    borderColor: ROLE_COLORS[i % ROLE_COLORS.length],
                    opacity: 0.5,
                  }}
                />
              );
            })}

            {/* Stacked bars per day */}
            {Array.from({ length: totalDays }).map((_, dayIdx) => {
              const dayMap = dailyDemand.get(dayIdx);
              if (!dayMap || dayMap.size === 0) return null;

              // Stack bars by role order
              let yOffset = 0;
              const segments: { roleId: string; count: number; color: string; isOverload: boolean; y: number; h: number }[] = [];

              for (const role of roles) {
                const count = dayMap.get(role.id) ?? 0;
                if (count === 0) continue;
                const info = roleMap.get(role.id)!;
                const h = count * yScale;
                const isOverload = count > info.capacity;
                segments.push({
                  roleId: role.id,
                  count,
                  color: info.color,
                  isOverload,
                  y: yOffset,
                  h,
                });
                yOffset += h;
              }

              return (
                <div key={dayIdx} className="absolute bottom-0" style={{ left: dayIdx * dayWidth, width: dayWidth }}>
                  {segments.map((seg) => (
                    <div
                      key={seg.roleId}
                      className={`absolute left-0.5 right-0.5 rounded-t-sm ${seg.isOverload ? "ring-1 ring-destructive/60" : ""}`}
                      style={{
                        bottom: seg.y,
                        height: seg.h,
                        backgroundColor: seg.color,
                        opacity: seg.isOverload ? 1 : 0.7,
                        boxShadow: seg.isOverload ? "0 0 6px rgba(239,68,68,0.4)" : undefined,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
