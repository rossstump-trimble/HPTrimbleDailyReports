"use client";

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "./useSupabaseMutation";

export function useUpsertProgressSnapshot() {
  const fn = useCallback(
    async (input: {
      project_id: string;
      week_start: string;
      planned_pct: number;
      actual_pct: number;
    }) => {
      const { error } = await supabase
        .from("progress_snapshots")
        .upsert(input, { onConflict: "project_id,week_start" });
      if (error) throw new Error(error.message);
      return {};
    },
    []
  );

  return useMutation(fn, ["progress_snapshots"]);
}
