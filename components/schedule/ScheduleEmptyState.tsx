"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GanttChart,
  Plus,
  Upload,
  Library,
  Link2,
  Settings,
  FolderOpen,
  Save,
} from "lucide-react";

interface ScheduleEmptyStateProps {
  onAddActivity?: () => void;
  onAddTemplate?: () => void;
  onOpenSettings?: () => void;
}

export function ScheduleEmptyState({
  onAddActivity,
  onAddTemplate,
  onOpenSettings,
}: ScheduleEmptyStateProps) {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
          <GanttChart className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="font-heading font-bold text-lg mb-2">Get Started with Your Schedule</h3>
        <p className="text-muted-foreground text-sm mb-8 max-w-md">
          Import an existing schedule or build one from scratch with templates and manual activities.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full text-left">
          <button
            className="flex flex-col items-center text-center p-4 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
            onClick={onOpenSettings}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Upload className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-semibold mb-1">Import or Link</h4>
            <p className="text-xs text-muted-foreground">Import a file, connect to File Library, or link to Trimble Scheduling.</p>
          </button>

          <button
            className="flex flex-col items-center text-center p-4 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
            onClick={onAddTemplate}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <FolderOpen className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-semibold mb-1">Use a Template</h4>
            <p className="text-xs text-muted-foreground">Quickly populate your schedule with common construction activities.</p>
          </button>

          <button
            className="flex flex-col items-center text-center p-4 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
            onClick={onAddActivity}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Plus className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-semibold mb-1">Add Manually</h4>
            <p className="text-xs text-muted-foreground">Build your schedule by adding activities one at a time.</p>
          </button>
        </div>

        <div className="flex items-center gap-3 mt-8 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> Link tasks to define sequence</span>
          <span className="text-muted-foreground/40">&middot;</span>
          <span className="flex items-center gap-1.5"><Save className="h-3.5 w-3.5" /> Set a baseline to track progress</span>
        </div>
      </CardContent>
    </Card>
  );
}
