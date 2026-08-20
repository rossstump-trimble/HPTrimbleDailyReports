export interface Database {
  public: {
    Tables: {
      folders: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
          modified_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
          modified_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
          modified_by?: string | null;
        };
      };
      files: {
        Row: {
          id: string;
          name: string;
          folder_id: string;
          file_type:
            | "ifc"
            | "pdf"
            | "skp"
            | "zip"
            | "e57"
            | "fp"
            | "gp"
            | "doc";
          size: number;
          modified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          folder_id: string;
          file_type:
            | "ifc"
            | "pdf"
            | "skp"
            | "zip"
            | "e57"
            | "fp"
            | "gp"
            | "doc";
          size: number;
          modified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          folder_id?: string;
          file_type?:
            | "ifc"
            | "pdf"
            | "skp"
            | "zip"
            | "e57"
            | "fp"
            | "gp"
            | "doc";
          size?: number;
          modified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      folder_permissions: {
        Row: {
          id: string;
          folder_id: string;
          user_id: string | null;
          access_level: "full-access" | "read-only" | "no-access";
          created_at: string;
          updated_at: string;
        };
      };
      // ... other tables
    };
  };
}
