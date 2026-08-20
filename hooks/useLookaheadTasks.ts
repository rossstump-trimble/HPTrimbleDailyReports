"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useRefetchTrigger } from "./useSupabaseMutation";

export type LookaheadStatus = "backlog" | "this_week" | "in_progress" | "complete";

export interface LookaheadTask {
  id: string;
  project_id: string;
  activity_id: string | null;
  name: string;
  status: LookaheadStatus;
  sort_order: number;
  progress: number | null;
  start_date: string | null;
  end_date: string | null;
  duration: number | null;
  has_roadblock: boolean;
  roadblock_note: string | null;
  constraint_labor: boolean;
  constraint_equipment: boolean;
  constraint_materials: boolean;
  constraint_design: boolean;
  location: string | null;
  owner: string | null;
  package: string | null;
  subcontractor: string | null;
  predecessor_task_id: string | null;
}

export function useLookaheadTasks(projectId?: string) {
  const [data, setData] = useState<LookaheadTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const version = useRefetchTrigger("lookahead_tasks");

  useEffect(() => {
    if (!projectId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    supabase
      .from("lookahead_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order")
      .then((result: { data: any; error: any }) => {
        if (cancelled) return;
        if (result.error) {
          console.error("Failed to fetch lookahead tasks:", result.error);
          setData([]);
        } else {
          setData(result.data as LookaheadTask[]);
        }
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId, version]);

  return { data, isLoading };
}

export function useCreateLookaheadTask() {
  const fn = useCallback(
    async (input: Partial<LookaheadTask> & { project_id: string; name: string }) => {
      const id = input.id || crypto.randomUUID();
      const { data, error } = await supabase
        .from("lookahead_tasks")
        .insert({ ...input, id } as any)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data as { id: string };
    },
    []
  );

  return useMutation(fn, ["lookahead_tasks"]);
}

export function useUpdateLookaheadTask() {
  const fn = useCallback(
    async (input: { id: string } & Partial<LookaheadTask>) => {
      const { id, ...fields } = input;
      const { error } = await supabase
        .from("lookahead_tasks")
        .update(fields)
        .eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    },
    []
  );

  return useMutation(fn, ["lookahead_tasks"]);
}

export function useDeleteLookaheadTask() {
  const fn = useCallback(
    async (input: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("lookahead_tasks")
        .delete()
        .eq("id", input.id);
      if (error) throw new Error(error.message);
      return { id: input.id };
    },
    []
  );

  return useMutation(fn, ["lookahead_tasks"]);
}

export function useBulkShiftTasks() {
  const fn = useCallback(
    async (input: { activityId: string; daysDelta: number; projectId: string }) => {
      const { data: tasks, error: fetchError } = await supabase
        .from("lookahead_tasks")
        .select("id, start_date, end_date")
        .eq("activity_id", input.activityId);

      if (fetchError) throw new Error(fetchError.message);
      if (!tasks?.length) return { id: "" };

      const updates = tasks.map((t: { id: string; start_date: string | null; end_date: string | null }) => {
        const shift = (dateStr: string | null) => {
          if (!dateStr) return null;
          const d = new Date(dateStr);
          d.setDate(d.getDate() + input.daysDelta);
          return d.toISOString().split("T")[0];
        };
        return supabase
          .from("lookahead_tasks")
          .update({ start_date: shift(t.start_date), end_date: shift(t.end_date) })
          .eq("id", t.id);
      });

      await Promise.all(updates);
      return { id: "" };
    },
    []
  );

  return useMutation(fn, ["lookahead_tasks"]);
}
