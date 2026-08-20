import { useProjects } from "@/hooks/useProjects";
import { useProjectContext } from "@/contexts/ProjectContext";
import { useActivities } from "@/hooks/useActivities";
import { useLookaheadTasks } from "@/hooks/useLookaheadTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function LookaheadReport() {
  const { activeProjectId: projectId } = useProjectContext();
  const { data: projects } = useProjects();
  const { data: activities } = useActivities(projectId ?? undefined);
  const { data: tasks } = useLookaheadTasks(projectId ?? undefined);

  const currentProject = projects?.find((p) => p.id === projectId);

  // Group tasks by activity
  const grouped = new Map<string | null, typeof tasks>();
  if (tasks) {
    for (const t of tasks) {
      const key = t.activity_id ?? "__unlinked__";
      const list = grouped.get(key) ?? [];
      list.push(t);
      grouped.set(key, list);
    }
  }

  const getActivityName = (id: string | null) => {
    if (!id || id === "__unlinked__") return "Unlinked Tasks";
    return activities?.find((a) => a.id === id)?.name ?? "Unknown Activity";
  };

  const statusColors: Record<string, string> = {
    backlog: "bg-secondary text-muted-foreground",
    this_week: "bg-primary/10 text-primary",
    in_progress: "bg-warning/10 text-warning",
    complete: "bg-success/10 text-success",
  };

  return (
    <div className="space-y-6">
      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">Lookahead Report</h1>
        <p className="text-sm text-muted-foreground">Issued {format(new Date(), "MMM d, yyyy")}</p>
      </div>

      {Array.from(grouped.entries()).map(([activityId, groupTasks]) => (
        <Card key={activityId ?? "unlinked"} className="border-0 shadow-md print:shadow-none print:border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">{getActivityName(activityId)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="py-2 pr-3">Task</th>
                    <th className="py-2 pr-3">Location</th>
                    <th className="py-2 pr-3">Owner</th>
                    <th className="py-2 pr-3">Subcontractor</th>
                    <th className="py-2 pr-3">Duration</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Constraints</th>
                    <th className="py-2">Roadblock</th>
                  </tr>
                </thead>
                <tbody>
                  {groupTasks?.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3 font-medium">{t.name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{(t as any).location ?? "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{(t as any).owner ?? "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{(t as any).subcontractor ?? "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{(t as any).duration ?? 1}d</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[t.status] ?? ""}`}>
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-1 text-[10px]">
                          {t.constraint_labor && <span className="text-success">L</span>}
                          {t.constraint_equipment && <span className="text-success">E</span>}
                          {t.constraint_materials && <span className="text-success">M</span>}
                          {t.constraint_design && <span className="text-success">D</span>}
                          {!t.constraint_labor && !t.constraint_equipment && !t.constraint_materials && !t.constraint_design && <span className="text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="py-2">
                        {t.has_roadblock ? (
                          <span className="flex items-center gap-1 text-destructive text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {t.roadblock_note ? t.roadblock_note.slice(0, 30) : "Yes"}
                          </span>
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-success" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {(!tasks || tasks.length === 0) && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            No lookahead tasks to display. Plan work from the Lookahead or Schedule page first.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
