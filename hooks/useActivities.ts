"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useRefetchTrigger, emitRefetch } from "./useSupabaseMutation";

export interface Activity {
  id: string;
  project_id: string;
  name: string;
  duration: number;
  start_date: string | null;
  end_date: string | null;
  progress: number | null;
  is_milestone: boolean;
  is_critical: boolean;
  total_float: number | null;
  free_float: number | null;
  parent_id: string | null;
  sort_order: number;
  location: string | null;
  owner: string | null;
  package: string | null;
  subcontractor: string | null;
}

export interface Dependency {
  id: string;
  project_id: string;
  predecessor_id: string;
  successor_id: string;
  type: string;
  lag: number;
}

export function useActivities(projectId?: string) {
  const [data, setData] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const version = useRefetchTrigger("activities");

  useEffect(() => {
    if (!projectId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    supabase
      .from("activities")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order")
      .then((result: { data: any; error: any }) => {
        if (cancelled) return;
        if (result.error) {
          console.error("Failed to fetch activities:", result.error);
          setData([]);
        } else {
          setData(result.data as Activity[]);
        }
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId, version]);

  return { data, isLoading };
}

export function useDependencies(projectId?: string) {
  const [data, setData] = useState<Dependency[]>([]);
  const version = useRefetchTrigger("dependencies");

  useEffect(() => {
    if (!projectId) {
      setData([]);
      return;
    }

    let cancelled = false;

    supabase
      .from("dependencies")
      .select("*")
      .eq("project_id", projectId)
      .then((result: { data: any; error: any }) => {
        if (cancelled) return;
        if (result.error) {
          console.error("Failed to fetch dependencies:", result.error);
          setData([]);
        } else {
          setData(result.data as Dependency[]);
        }
      });

    return () => { cancelled = true; };
  }, [projectId, version]);

  return { data };
}

export function useCreateActivity() {
  const fn = useCallback(
    async (input: Partial<Activity> & { project_id: string; name: string }) => {
      const id = input.id || crypto.randomUUID();
      const { data, error } = await supabase
        .from("activities")
        .insert({ ...input, id } as any)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data as { id: string };
    },
    []
  );

  return useMutation(fn, ["activities"]);
}

export function useUpdateActivity() {
  const fn = useCallback(
    async (input: { id: string } & Partial<Activity>) => {
      const { id, ...fields } = input;
      const { error } = await supabase
        .from("activities")
        .update(fields)
        .eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    },
    []
  );

  return useMutation(fn, ["activities"]);
}

export function useDeleteActivity() {
  const fn = useCallback(
    async (input: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", input.id);
      if (error) throw new Error(error.message);
      return { id: input.id };
    },
    []
  );

  return useMutation(fn, ["activities"]);
}

export function useCreateDependency() {
  const fn = useCallback(
    async (input: Omit<Dependency, "id" | "lag"> & { id?: string; lag?: number }) => {
      const id = input.id || crypto.randomUUID();
      const { data, error } = await supabase
        .from("dependencies")
        .insert({ ...input, id, lag: input.lag ?? 0 })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data as { id: string };
    },
    []
  );

  return useMutation(fn, ["dependencies"]);
}

export function useDeleteDependency() {
  const fn = useCallback(
    async (input: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("dependencies")
        .delete()
        .eq("id", input.id);
      if (error) throw new Error(error.message);
      return { id: input.id };
    },
    []
  );

  return useMutation(fn, ["dependencies"]);
}
