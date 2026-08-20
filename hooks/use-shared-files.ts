import { useCallback, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";

export interface SharedFile {
  id: string;
  name: string;
  path: string;
  sharingMethod: "specific-members" | "signed-in" | "public";
  dateShared: Date;
  expiryDate?: Date | null;
}

interface SharedFileResponse {
  id: string;
  name: string;
  path: string;
  sharing_method: "specific-members" | "signed-in" | "public";
  date_shared: string;
  expiry_date: string | null;
}

export function useSharedFiles() {
  // Create Supabase client with fallback for missing environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  const supabase = supabaseUrl && supabaseKey 
    ? createBrowserClient(supabaseUrl, supabaseKey)
    : null;

  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<SharedFile[]>([]);

  const fetchSharedFiles = useCallback(async () => {
    if (!supabase) {
      console.warn("Supabase client not available - environment variables may be missing");
      toast.error("Unable to load shared files - configuration error");
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc("get_shared_files");

      if (error) {
        throw error;
      }

      setFiles(
        (data as SharedFileResponse[]).map((file) => ({
          id: file.id,
          name: file.name,
          path: file.path,
          sharingMethod: file.sharing_method,
          dateShared: new Date(file.date_shared),
          expiryDate: file.expiry_date ? new Date(file.expiry_date) : null,
        }))
      );
    } catch (error) {
      console.error("Error fetching shared files:", error);
      toast.error("Failed to load shared files");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const manageShare = useCallback(async (fileId: string) => {
    // This will be implemented when we create the share management dialog
    console.log("Managing share for file:", fileId);
  }, []);

  return {
    files,
    isLoading,
    fetchSharedFiles,
    manageShare,
  };
}
