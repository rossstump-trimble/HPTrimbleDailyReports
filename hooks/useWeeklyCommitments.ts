"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useRefetchTrigger } from "./useSupabaseMutation";

export interface WeeklyCommitment {
  id: string;
  task_id: string;
  completed: boolean;
}

export function useWeeklyCommitments(projectId?: string, weekStart?: string) {
  const [data, setData] = useState<WeeklyCommitment[]>([]);
  const version = useRefetchTrigger("weekly_commitments");

  useEffect(() => {
    if (!projectId || !weekStart) {
      setData([]);
      return;
    }

    let cancelled = false;

    supabase
      .from("weekly_commitments")
      .select("id, task_id, completed")
      .eq("project_id", projectId)
      .eq("week_start", weekStart)
      .then((result: { data: any; error: any }) => {
        if (cancelled) return;
        if (result.error) {
          console.error("Failed to fetch weekly commitments:", result.error);
          setData([]);
        } else {
          setData(result.data as WeeklyCommitment[]);
        }
      });

    return () => { cancelled = true; };
  }, [projectId, weekStart, version]);

  return { data };
}

export function useCommitWeek() {
  const fn = useCallback(
    async (input: { projectId: string; weekStart: string; tasks: { id: string }[] }) => {
      const rows = input.tasks.map((t) => ({
        project_id: input.projectId,
        task_id: t.id,
        week_start: input.weekStart,
        completed: false,
      }));

      const { error } = await supabase
        .from("weekly_commitments")
        .upsert(rows, { onConflict: "project_id,task_id,week_start" });

      if (error) throw new Error(error.message);
      return {};
    },
    []
  );

  return useMutation(fn, ["weekly_commitments"]);
}
