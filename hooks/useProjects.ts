"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefetchTrigger } from "./useSupabaseMutation";

export const DEMO_PROJECT_ID = "demo-project";

export interface Project {
  id: string;
  name: string;
}

export function useProjects() {
  const [data, setData] = useState<Project[]>([]);
  const version = useRefetchTrigger("projects");

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("projects")
      .select("id, name")
      .order("name")
      .then((result: { data: any; error: any }) => {
        if (cancelled) return;
        if (result.error) {
          console.error("Failed to fetch projects:", result.error);
          setData([]);
        } else {
          setData(result.data as Project[]);
        }
      });

    return () => { cancelled = true; };
  }, [version]);

  return { data };
}

export function useClaimDemoProject() {
  return {
    mutate: () => {},
    isPending: false,
    isSuccess: true,
  };
}
