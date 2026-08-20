export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      installed_apps: {
        Row: {
          id: string;
          app_id: string;
          app_name: string;
          app_version?: string;
          app_description?: string;
          publisher?: string;
          installed_at?: string;
          icon_url?: string;
          product_url?: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          app_name: string;
          app_version?: string;
          app_description?: string;
          publisher?: string;
          installed_at?: string;
          icon_url?: string;
          product_url?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          app_name?: string;
          app_version?: string;
          app_description?: string;
          publisher?: string;
          installed_at?: string;
          icon_url?: string;
          product_url?: string;
        };
      };
      // Include other tables as needed
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
