import { useLookaheadTasks } from "./useLookaheadTasks";

export function useTaskCountsByActivity(projectId?: string): Map<string, number> {
  const { data: tasks } = useLookaheadTasks(projectId);
  const counts = new Map<string, number>();
  if (tasks) {
    for (const t of tasks) {
      if (t.activity_id) {
        counts.set(t.activity_id, (counts.get(t.activity_id) ?? 0) + 1);
      }
    }
  }
  return counts;
}
