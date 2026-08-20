"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefetchTrigger } from "./useSupabaseMutation";

export interface ResourceRole {
  id: string;
  project_id: string;
  name: string;
  capacity: number;
}

export function useResourceRoles(projectId?: string) {
  const [data, setData] = useState<ResourceRole[]>([]);
  const version = useRefetchTrigger("resource_roles");

  useEffect(() => {
    if (!projectId) {
      setData([]);
      return;
    }

    let cancelled = false;

    supabase
      .from("resource_roles")
      .select("*")
      .eq("project_id", projectId)
      .order("name")
      .then((result: { data: any; error: any }) => {
        if (cancelled) return;
        if (result.error) {
          console.error("Failed to fetch resource roles:", result.error);
          setData([]);
        } else {
          setData(result.data as ResourceRole[]);
        }
      });

    return () => { cancelled = true; };
  }, [projectId, version]);

  return { data };
}
