"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useRefetchTrigger } from "./useSupabaseMutation";

export interface CrewAssignment {
  id: string;
  task_id: string;
  role_id: string;
  headcount: number;
}

type CrewAssignmentWithTask = CrewAssignment & { lookahead_tasks: { project_id: string } };

export function useCrewAssignments(taskId?: string) {
  const [data, setData] = useState<CrewAssignmentWithTask[]>([]);
  const version = useRefetchTrigger("crew_assignments");

  useEffect(() => {
    if (!taskId) {
      setData([]);
      return;
    }

    let cancelled = false;

    supabase
      .from("crew_assignments")
      .select("*, lookahead_tasks(project_id)")
      .eq("task_id", taskId)
      .then((result: { data: any; error: any }) => {
        if (cancelled) return;
        if (result.error) {
          console.error("Failed to fetch crew assignments:", result.error);
          setData([]);
        } else {
          setData(result.data as CrewAssignmentWithTask[]);
        }
      });

    return () => { cancelled = true; };
  }, [taskId, version]);

  return { data };
}

export function useCrewAssignmentsByProject(projectId?: string) {
  const [data, setData] = useState<CrewAssignmentWithTask[]>([]);
  const version = useRefetchTrigger("crew_assignments");

  useEffect(() => {
    if (!projectId) {
      setData([]);
      return;
    }

    let cancelled = false;

    supabase
      .from("crew_assignments")
      .select("*, lookahead_tasks!inner(project_id)")
      .eq("lookahead_tasks.project_id", projectId)
      .then((result: { data: any; error: any }) => {
        if (cancelled) return;
        if (result.error) {
          console.error("Failed to fetch crew assignments:", result.error);
          setData([]);
        } else {
          setData(result.data as CrewAssignmentWithTask[]);
        }
      });

    return () => { cancelled = true; };
  }, [projectId, version]);

  return { data };
}

export function useCreateCrewAssignment() {
  const fn = useCallback(
    async (input: Omit<CrewAssignment, "id"> & { id?: string }) => {
      const { data, error } = await supabase
        .from("crew_assignments")
        .insert(input)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data as { id: string };
    },
    []
  );

  return useMutation(fn, ["crew_assignments"]);
}

export function useDeleteCrewAssignment() {
  const fn = useCallback(
    async (input: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("crew_assignments")
        .delete()
        .eq("id", input.id);
      if (error) throw new Error(error.message);
      return { id: input.id };
    },
    []
  );

  return useMutation(fn, ["crew_assignments"]);
}
