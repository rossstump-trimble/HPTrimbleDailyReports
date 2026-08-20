export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          duration: number
          end_date: string | null
          free_float: number | null
          id: string
          is_critical: boolean
          is_milestone: boolean
          location: string | null
          name: string
          owner: string | null
          package: string | null
          parent_id: string | null
          progress: number | null
          project_id: string
          sort_order: number
          start_date: string | null
          subcontractor: string | null
          total_float: number | null
        }
        Insert: {
          created_at?: string
          duration?: number
          end_date?: string | null
          free_float?: number | null
          id: string
          is_critical?: boolean
          is_milestone?: boolean
          location?: string | null
          name: string
          owner?: string | null
          package?: string | null
          parent_id?: string | null
          progress?: number | null
          project_id: string
          sort_order?: number
          start_date?: string | null
          subcontractor?: string | null
          total_float?: number | null
        }
        Update: {
          created_at?: string
          duration?: number
          end_date?: string | null
          free_float?: number | null
          id?: string
          is_critical?: boolean
          is_milestone?: boolean
          location?: string | null
          name?: string
          owner?: string | null
          package?: string | null
          parent_id?: string | null
          progress?: number | null
          project_id?: string
          sort_order?: number
          start_date?: string | null
          subcontractor?: string | null
          total_float?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      baselines: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
          snapshot?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_assignments: {
        Row: {
          created_at: string
          headcount: number
          id: string
          role_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          headcount?: number
          id?: string
          role_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          headcount?: number
          id?: string
          role_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "resource_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "lookahead_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      dependencies: {
        Row: {
          created_at: string
          id: string
          lag: number
          predecessor_id: string
          project_id: string
          successor_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id: string
          lag?: number
          predecessor_id: string
          project_id: string
          successor_id: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          lag?: number
          predecessor_id?: string
          project_id?: string
          successor_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependencies_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependencies_successor_id_fkey"
            columns: ["successor_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      lookahead_tasks: {
        Row: {
          activity_id: string | null
          constraint_design: boolean
          constraint_equipment: boolean
          constraint_labor: boolean
          constraint_materials: boolean
          created_at: string
          duration: number | null
          end_date: string | null
          has_roadblock: boolean
          id: string
          location: string | null
          name: string
          owner: string | null
          package: string | null
          predecessor_task_id: string | null
          progress: number | null
          project_id: string
          roadblock_note: string | null
          sort_order: number
          start_date: string | null
          status: string
          subcontractor: string | null
        }
        Insert: {
          activity_id?: string | null
          constraint_design?: boolean
          constraint_equipment?: boolean
          constraint_labor?: boolean
          constraint_materials?: boolean
          created_at?: string
          duration?: number | null
          end_date?: string | null
          has_roadblock?: boolean
          id: string
          location?: string | null
          name: string
          owner?: string | null
          package?: string | null
          predecessor_task_id?: string | null
          progress?: number | null
          project_id: string
          roadblock_note?: string | null
          sort_order?: number
          start_date?: string | null
          status?: string
          subcontractor?: string | null
        }
        Update: {
          activity_id?: string | null
          constraint_design?: boolean
          constraint_equipment?: boolean
          constraint_labor?: boolean
          constraint_materials?: boolean
          created_at?: string
          duration?: number | null
          end_date?: string | null
          has_roadblock?: boolean
          id?: string
          location?: string | null
          name?: string
          owner?: string | null
          package?: string | null
          predecessor_task_id?: string | null
          progress?: number | null
          project_id?: string
          roadblock_note?: string | null
          sort_order?: number
          start_date?: string | null
          status?: string
          subcontractor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lookahead_tasks_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lookahead_tasks_predecessor_task_id_fkey"
            columns: ["predecessor_task_id"]
            isOneToOne: false
            referencedRelation: "lookahead_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lookahead_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      resource_roles: {
        Row: {
          capacity: number
          created_at: string
          id: string
          name: string
          project_id: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          name: string
          project_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_commitments: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          project_id: string
          task_id: string
          week_start: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          project_id: string
          task_id: string
          week_start: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          project_id?: string
          task_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_commitments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_commitments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "lookahead_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
