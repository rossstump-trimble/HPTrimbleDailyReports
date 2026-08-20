import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link2,
  Search,
  Loader2,
  TriangleAlert,
  Info,
  CalendarRange,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { parseP6XER } from "./ImportExportDialog";
import type { Activity, Dependency } from "@/hooks/useActivities";
import { WESTMINSTER_XER } from "@/data/mockScheduleData";

interface TrimbleSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Activity[];
  dependencies: Dependency[];
  onImportComplete?: (
    activities: Partial<Activity>[],
    dependencies: Partial<Dependency>[],
    sourceDetail?: string
  ) => Promise<void> | void;
}

interface TrimbleProject {
  id: string;
  name: string;
  owner: string;
  activities: number;
  lastUpdated: string;
  status: "active" | "complete" | "on-hold";
}

const MOCK_PROJECTS: TrimbleProject[] = [
  {
    id: "ts-001",
    name: "Westminster Office Campus",
    owner: "Meridian Builders",
    activities: 60,
    lastUpdated: "Mar 1, 2026",
    status: "active",
  },
  {
    id: "ts-002",
    name: "Harbor View Residential Tower",
    owner: "Coastal Development Group",
    activities: 124,
    lastUpdated: "Feb 27, 2026",
    status: "active",
  },
  {
    id: "ts-003",
    name: "Eastgate Distribution Center",
    owner: "Summit Logistics Partners",
    activities: 87,
    lastUpdated: "Feb 25, 2026",
    status: "active",
  },
  {
    id: "ts-004",
    name: "Riverfront Mixed-Use Development",
    owner: "Urban Core Ventures",
    activities: 210,
    lastUpdated: "Feb 20, 2026",
    status: "on-hold",
  },
  {
    id: "ts-005",
    name: "Northpark Medical Pavilion",
    owner: "HealthBridge Construction",
    activities: 95,
    lastUpdated: "Feb 18, 2026",
    status: "active",
  },
  {
    id: "ts-006",
    name: "Oakwood Elementary Renovation",
    owner: "CivicBuild Inc.",
    activities: 42,
    lastUpdated: "Jan 30, 2026",
    status: "complete",
  },
  {
    id: "ts-007",
    name: "Central Avenue Bridge Replacement",
    owner: "Atlas Infrastructure",
    activities: 68,
    lastUpdated: "Feb 12, 2026",
    status: "active",
  },
  {
    id: "ts-008",
    name: "Greenfield Solar Farm Phase 2",
    owner: "Apex Energy Solutions",
    activities: 53,
    lastUpdated: "Feb 8, 2026",
    status: "active",
  },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  complete: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "on-hold": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export function TrimbleSchedulingDialog({
  open,
  onOpenChange,
  activities,
  dependencies,
  onImportComplete,
}: TrimbleSchedulingDialogProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<TrimbleProject | null>(null);
  const [importing, setImporting] = useState(false);

  const hasExistingData = activities.length > 0 || dependencies.length > 0;

  useEffect(() => {
    if (open) {
      setSearch("");
      setStatusFilter("all");
      setImporting(false);
      const westminster = MOCK_PROJECTS.find((p) => p.id === "ts-001")!;
      setSelectedProject(westminster);
    }
  }, [open]);

  const filteredProjects = useMemo(() => {
    let results = MOCK_PROJECTS;
    if (statusFilter !== "all") {
      results = results.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.owner.toLowerCase().includes(q)
      );
    }
    return results;
  }, [search, statusFilter]);

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setSearch("");
      setStatusFilter("all");
      setSelectedProject(null);
      setImporting(false);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = async () => {
    if (!selectedProject) return;
    setImporting(true);

    try {
      const parsed = parseP6XER(WESTMINSTER_XER);
      if (parsed.activities.length === 0) {
        throw new Error("No activities found in the project.");
      }
      await onImportComplete?.(parsed.activities, parsed.dependencies, selectedProject.name);
      toast.success(
        `Linked to "${selectedProject.name}" \u2014 loaded ${parsed.activities.length} activities`
      );
      handleClose(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to load schedule");
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Trimble Scheduling
          </DialogTitle>
          <DialogDescription>
            Select a project to link and import its schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            This project will be linked to the Trimble Scheduling project and automatically receive updates when the schedule changes.
          </p>
        </div>

        {importing ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Linking project and loading schedule...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0 rounded-md border border-input bg-background px-3 h-10 focus-within:outline-none">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="search"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1 max-h-[280px] overflow-y-auto -mx-1 px-1">
              {filteredProjects.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No projects match your search.
                  </p>
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const isSelected = selectedProject?.id === project.id;
                  return (
                    <button
                      key={project.id}
                      className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <CalendarRange
                        className={`h-5 w-5 shrink-0 ${
                          isSelected
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {project.name}
                          </p>
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {project.owner} &middot; {project.activities}{" "}
                          activities &middot; Updated {project.lastUpdated}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] shrink-0 ${
                          STATUS_STYLES[project.status] || ""
                        }`}
                      >
                        {project.status === "on-hold"
                          ? "On Hold"
                          : project.status.charAt(0).toUpperCase() +
                            project.status.slice(1)}
                      </Badge>
                    </button>
                  );
                })
              )}
            </div>

            {selectedProject && hasExistingData && (
              <Alert variant="destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertDescription>
                  This will replace the current schedule ({activities.length}{" "}
                  activities, {dependencies.length} dependencies). This action
                  cannot be undone.
                </AlertDescription>
              </Alert>
            )}

          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          {selectedProject && !importing && (
            <Button
              className={
                hasExistingData
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0"
                  : ""
              }
              onClick={handleConfirm}
            >
              {hasExistingData ? "Replace & Link" : "Link Project"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
