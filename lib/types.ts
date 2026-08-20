export interface FolderPermissionDB {
  id: string;
  folder_id: string;
  entity_id: string | null;
  entity_type: "user" | "group" | "default";
  access_level: "full-access" | "read-only" | "no-access";
  created_at?: string;
  updated_at?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  group?: {
    id: string;
    name: string;
    description: string;
  };
  inherited?: boolean;
  overridden?: boolean;
  direct_file_permission?: boolean;
  inherited_from_folder?: boolean;
  inherit_from_parent?: boolean;
}

export interface SelectedEntity {
  id: string;
  name: string;
  type: "user" | "group" | "default";
  access: "full-access" | "read-only" | "no-access";
  is_mixed?: boolean;
}

// Add these helper types if needed
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  classification: string;
}
