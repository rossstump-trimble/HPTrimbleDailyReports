"use client";

import { useState, useMemo, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  MoreHorizontal,
  Download,
  Link2,
  FolderOpen,
  CalendarRange,
  Settings,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useProjectContext } from "@/contexts/ProjectContext";
import { addDays, parseISO } from "date-fns";
import { useActivities, useDependencies, useCreateActivity, useCreateDependency } from "@/hooks/useActivities";
import { emitRefetch } from "@/hooks/useSupabaseMutation";
import { useToolbarPortalRef } from "@/components/schedule/ScheduleNewModule";
import { ImportExportDialog, type ImportExportMode } from "@/components/schedule/ImportExportDialog";
import { ScheduleSettingsDialog, type ScheduleSource } from "@/components/schedule/ScheduleSettingsDialog";
import { SCHEDULE_TEMPLATES } from "@/data/scheduleTemplates";

interface ScheduleToolbarActions {
  openSettings: () => void;
  openAddActivity: () => void;
  openAddTemplate: () => void;
}

const ToolbarActionsContext = createContext<ScheduleToolbarActions | null>(null);

export function useToolbarActions() {
  return useContext(ToolbarActionsContext);
}

interface ScheduleToolbarProps {
  /** When on Gantt: activates link mode. When on List/Calendar: optionally switch to Gantt first */
  onLinkTasks?: () => void;
  /** When on List/Calendar: called so user can switch to Gantt to use Link Tasks */
  onSwitchToGantt?: () => void;
  children?: React.ReactNode;
}

export function ScheduleToolbar({ onLinkTasks, onSwitchToGantt, children }: ScheduleToolbarProps) {
  const { activeProjectId: projectId } = useProjectContext();
  const navigate = useNavigate();
  const toolbarPortalNode = useToolbarPortalRef();
  const { data: activities } = useActivities(projectId ?? undefined);
  const { data: dependencies } = useDependencies(projectId ?? undefined);
  const createActivity = useCreateActivity();
  const createDependency = useCreateDependency();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState("5");
  const [newStart, setNewStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newActivityType, setNewActivityType] = useState<"activity" | "folder">("activity");
  const [newParentId, setNewParentId] = useState("");
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [importExportMode, setImportExportMode] = useState<ImportExportMode>("export");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scheduleSource, setScheduleSource] = useState<ScheduleSource>(null);
  const [sourceDetail, setSourceDetail] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [creatingTemplates, setCreatingTemplates] = useState(false);

  const parentIds = useMemo(() => {
    if (!activities) return new Set<string>();
    return new Set(
      activities
        .filter((a) => !a.start_date && !a.end_date && activities.some((c) => c.parent_id === a.id))
        .map((a) => a.id)
    );
  }, [activities]);

  const folderOptions = useMemo(() => {
    if (!activities) return [];
    return activities.filter((a) => parentIds.has(a.id) || (!a.parent_id && !a.start_date));
  }, [activities, parentIds]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newName.trim()) return;
    const parentId = newParentId && newParentId !== "none" ? newParentId : null;
    try {
      if (newActivityType === "folder") {
        await createActivity.mutateAsync({
          project_id: projectId,
          name: newName.trim(),
          duration: 1,
          is_milestone: false,
          parent_id: parentId,
          sort_order: (activities?.length ?? 0) + 1,
        });
        toast.success("Folder added");
      } else {
        const start = newStart || format(new Date(), "yyyy-MM-dd");
        const dur = Math.max(1, parseInt(newDuration, 10) || 1);
        await createActivity.mutateAsync({
          project_id: projectId,
          name: newName.trim(),
          duration: dur,
          start_date: start,
          end_date: format(addDays(parseISO(start), dur), "yyyy-MM-dd"),
          parent_id: parentId,
          sort_order: (activities?.length ?? 0) + 1,
        });
        toast.success("Activity added");
      }
      setAddDialogOpen(false);
      setNewName("");
      setNewDuration("5");
      setNewStart(format(new Date(), "yyyy-MM-dd"));
      setNewParentId("");
      emitRefetch("activities");
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? "Failed to add");
    }
  };

  const handleToggleTemplate = (name: string) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCreateTemplates = async () => {
    if (!projectId || selectedTemplates.size === 0) return;
    setCreatingTemplates(true);
    try {
      let sortOrder = (activities?.length ?? 0) + 1;
      for (const templateName of Array.from(selectedTemplates)) {
        const template = SCHEDULE_TEMPLATES.find((t) => t.name === templateName);
        if (!template) continue;
        const parent = await createActivity.mutateAsync({
          project_id: projectId,
          name: template.name,
          duration: 1,
          is_milestone: false,
          sort_order: sortOrder++,
        });
        const createdIds: string[] = [];
        const startDate = format(new Date(), "yyyy-MM-dd");
        for (let si = 0; si < template.subtasks.length; si++) {
          const subtask = template.subtasks[si];
          const subtaskStart = format(addDays(parseISO(startDate), si * 5), "yyyy-MM-dd");
          const subtaskEnd = format(addDays(parseISO(subtaskStart), 5), "yyyy-MM-dd");
          const child = await createActivity.mutateAsync({
            project_id: projectId,
            name: subtask,
            duration: 5,
            start_date: subtaskStart,
            end_date: subtaskEnd,
            parent_id: parent.id,
            is_milestone: false,
            sort_order: sortOrder++,
          });
          createdIds.push(child.id);
        }
        for (let i = 0; i < createdIds.length - 1; i++) {
          await createDependency.mutateAsync({
            project_id: projectId,
            predecessor_id: createdIds[i],
            successor_id: createdIds[i + 1],
            type: "FS",
          });
        }
      }
      toast.success(`Created ${selectedTemplates.size} template(s) with dependencies`);
      setTemplateDialogOpen(false);
      setSelectedTemplates(new Set());
      emitRefetch("activities");
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? "Failed to create activities");
    } finally {
      setCreatingTemplates(false);
    }
  };

  const handleLinkTasks = () => {
    if (onLinkTasks) {
      onLinkTasks();
    } else if (onSwitchToGantt) {
      onSwitchToGantt();
    }
  };

  const toolbarButtons = (
    <>
      <Button
        onClick={() => {
          setNewStart(format(new Date(), "yyyy-MM-dd"));
          setNewActivityType("activity");
          setNewParentId("");
          setAddDialogOpen(true);
        }}
      >
        <Plus className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Add Activity</span>
      </Button>
      <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
        <Settings className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={() => { setImportExportMode("export"); setImportExportOpen(true); }}>
        <Download className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleLinkTasks}>
            <Link2 className="h-4 w-4 mr-2" />
            Link Tasks
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelectedTemplates(new Set()); setTemplateDialogOpen(true); }}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Add Template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/lookahead")}>
            <CalendarRange className="h-4 w-4 mr-2" />
            Lookahead
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  const toolbarActions = useMemo<ScheduleToolbarActions>(() => ({
    openSettings: () => setSettingsOpen(true),
    openAddActivity: () => { setNewStart(format(new Date(), "yyyy-MM-dd")); setNewActivityType("activity"); setNewParentId(""); setAddDialogOpen(true); },
    openAddTemplate: () => { setSelectedTemplates(new Set()); setTemplateDialogOpen(true); },
  }), []);

  if (!toolbarPortalNode || !projectId) return <ToolbarActionsContext.Provider value={null}>{children}</ToolbarActionsContext.Provider>;

  return (
    <ToolbarActionsContext.Provider value={toolbarActions}>
      {createPortal(toolbarButtons, toolbarPortalNode)}

      {/* Add Activity Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add {newActivityType === "folder" ? "Folder" : "Activity"}</DialogTitle>
            <DialogDescription>Create a new {newActivityType === "folder" ? "folder to group activities" : "activity in the schedule"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddActivity} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <ToggleGroup
                type="single"
                value={newActivityType}
                onValueChange={(v) => { if (v) setNewActivityType(v as "activity" | "folder"); }}
                className="justify-start"
              >
                <ToggleGroupItem value="activity" variant="outline" className="text-sm px-4">
                  Activity (scheduled work with dates)
                </ToggleGroupItem>
                <ToggleGroupItem value="folder" variant="outline" className="text-sm px-4">
                  <FolderOpen className="h-3.5 w-3.5 mr-1.5" />Folder (groups activities, no dates)
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">Folders organize your schedule into sections.</p>
            </div>
            <div className="space-y-2">
              <Label>{newActivityType === "folder" ? "Folder Name" : "Activity Name"}</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={newActivityType === "folder" ? "e.g. Foundations" : "e.g. Pour Concrete"} required />
            </div>
            {folderOptions.length > 0 && (
              <div className="space-y-2">
                <Label>Parent Folder (optional)</Label>
                <Select value={newParentId || "none"} onValueChange={setNewParentId}>
                  <SelectTrigger><SelectValue placeholder="None (top level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top level)</SelectItem>
                    {folderOptions.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        <span className="flex items-center gap-1.5">
                          <FolderOpen className="h-3 w-3 text-primary" />{f.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {newActivityType === "activity" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Duration (days)</Label>
                  <Input type="number" min={1} value={newDuration} onChange={(e) => setNewDuration(e.target.value)} required />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createActivity.isPending}>
                {createActivity.isPending ? "Adding..." : `Add ${newActivityType === "folder" ? "Folder" : "Activity"}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Picker Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Work Templates</DialogTitle>
            <DialogDescription>Select work categories to quickly populate your schedule with common activities.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            {SCHEDULE_TEMPLATES.map((template) => (
              <Collapsible key={template.name}>
                <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/30">
                  <Checkbox checked={selectedTemplates.has(template.name)} onCheckedChange={() => handleToggleTemplate(template.name)} />
                  <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{template.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto mr-2">{template.subtasks.length} tasks</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-90" />
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="pl-11 pb-2 space-y-1">
                    {template.subtasks.map((subtask) => (
                      <div key={subtask} className="text-xs text-muted-foreground py-0.5">• {subtask}</div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateTemplates}
              disabled={selectedTemplates.size === 0 || creatingTemplates}
            >
              {creatingTemplates ? "Creating..." : `Create ${selectedTemplates.size > 0 ? selectedTemplates.size : ""} Selected`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportExportDialog
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
        mode={importExportMode}
        activities={activities ?? []}
        dependencies={dependencies ?? []}
      />

      <ScheduleSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        activities={activities ?? []}
        dependencies={dependencies ?? []}
        scheduleSource={scheduleSource}
        sourceDetail={sourceDetail}
        onScheduleSourceChange={(source, detail) => { setScheduleSource(source); setSourceDetail(detail ?? null); }}
        onImportComplete={() => emitRefetch("activities")}
        onClearSchedule={() => emitRefetch("activities")}
      />

      {children}
    </ToolbarActionsContext.Provider>
  );
}
