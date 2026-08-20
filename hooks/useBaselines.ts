"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useRefetchTrigger } from "./useSupabaseMutation";

export interface BaselineSnapshot {
  id: string;
  start_date: string | null;
  end_date: string | null;
  duration: number;
  is_critical: boolean;
  total_float: number;
}

export interface Baseline {
  id: string;
  project_id: string;
  name: string;
  snapshot: unknown;
  created_at: string;
}

export function useBaselines(projectId?: string) {
  const [data, setData] = useState<Baseline[]>([]);
  const version = useRefetchTrigger("baselines");

  useEffect(() => {
    if (!projectId) {
      setData([]);
      return;
    }

    let cancelled = false;

    supabase
      .from("baselines")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .then((result: { data: any; error: any }) => {
        if (cancelled) return;
        if (result.error) {
          console.error("Failed to fetch baselines:", result.error);
          setData([]);
        } else {
          setData(result.data as Baseline[]);
        }
      });

    return () => { cancelled = true; };
  }, [projectId, version]);

  return { data };
}

export function useCreateBaseline() {
  const fn = useCallback(
    async (input: { project_id?: string; projectId?: string; name: string; snapshot: unknown }) => {
      const project_id = input.project_id || input.projectId;
      if (!project_id) throw new Error("project_id is required");
      const { data, error } = await supabase
        .from("baselines")
        .insert({ project_id, name: input.name, snapshot: input.snapshot as any })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data as { id: string };
    },
    []
  );

  return useMutation(fn, ["baselines"]);
}

export function useDeleteBaseline() {
  const fn = useCallback(
    async (input: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("baselines")
        .delete()
        .eq("id", input.id);
      if (error) throw new Error(error.message);
      return { id: input.id };
    },
    []
  );

  return useMutation(fn, ["baselines"]);
}
