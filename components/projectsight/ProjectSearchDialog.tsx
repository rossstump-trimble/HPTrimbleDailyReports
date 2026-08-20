"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { mockProjects } from "./ProjectMultiSelect";

export type ProjectMode = "all" | "specific" | "none";

interface ProjectSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ProjectMode;
  selectedIds: string[];
  onConfirm: (mode: ProjectMode, selectedIds: string[]) => void;
}

export default function ProjectSearchDialog({
  open,
  onOpenChange,
  mode: initialMode,
  selectedIds: initialSelectedIds,
  onConfirm,
}: ProjectSearchDialogProps) {
  const [mode, setMode] = useState<ProjectMode>(initialMode);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds));
  const [numberFilter, setNumberFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");

  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setSelected(new Set(initialSelectedIds));
      setNumberFilter("");
      setNameFilter("");
    }
  }, [open, initialMode, initialSelectedIds]);

  const filtered = useMemo(() => {
    return mockProjects.filter((p) => {
      const matchNumber = !numberFilter || p.number.toLowerCase().includes(numberFilter.toLowerCase());
      const matchName = !nameFilter || p.name.toLowerCase().includes(nameFilter.toLowerCase());
      return matchNumber && matchName;
    });
  }, [numberFilter, nameFilter]);

  const isSpecific = mode === "specific";

  const toggleProject = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const handleSelect = () => {
    onConfirm(mode, Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4">
          <DialogTitle className="text-xl font-semibold text-primary">
            Project search
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select which projects this custom field applies to
          </DialogDescription>
        </DialogHeader>

        {/* Radio selection */}
        <div className="px-6 pb-4 border-b border-border">
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as ProjectMode)}
            className="flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="all" id="ps-all" />
              <Label htmlFor="ps-all" className="text-sm font-normal cursor-pointer">
                All Projects
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="specific" id="ps-specific" />
              <Label htmlFor="ps-specific" className="text-sm font-normal cursor-pointer">
                Specific Projects
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="none" id="ps-none" />
              <Label htmlFor="ps-none" className="text-sm font-normal cursor-pointer">
                None
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Project grid */}
        <div className={cn("flex flex-col", !isSpecific && "opacity-40 pointer-events-none")}>
          {/* Column headers */}
          <div className="grid grid-cols-[40px_140px_1fr] border-b border-border bg-background">
            <div className="px-2 py-2 flex items-center">
              <Checkbox
                checked={isSpecific && allFilteredSelected}
                onCheckedChange={() => isSpecific && toggleAllFiltered()}
                disabled={!isSpecific}
                className="h-4 w-4"
              />
            </div>
            <div className="px-3 py-2 text-sm font-semibold text-primary">Number</div>
            <div className="px-3 py-2 text-sm font-semibold text-primary">Project name</div>
          </div>

          {/* Column filters */}
          <div className="grid grid-cols-[40px_140px_1fr] border-b border-border">
            <div />
            <div className="px-2 py-1.5">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Contains..."
                  value={numberFilter}
                  onChange={(e) => setNumberFilter(e.target.value)}
                  disabled={!isSpecific}
                  className="w-full pl-6 pr-2 py-1 text-xs border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>
            <div className="px-2 py-1.5">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Contains..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  disabled={!isSpecific}
                  className="w-full pl-6 pr-2 py-1 text-xs border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Rows */}
          <ScrollArea className="h-[320px]">
            {filtered.map((project, idx) => {
              const isChecked = selected.has(project.id);
              return (
                <div
                  key={project.id}
                  className={cn(
                    "grid grid-cols-[40px_140px_1fr] border-b border-border/40 transition-colors",
                    idx % 2 === 1 && "bg-muted/30",
                    isChecked && isSpecific && "bg-primary/10",
                    isSpecific && "hover:bg-accent/50 cursor-pointer"
                  )}
                  onClick={() => isSpecific && toggleProject(project.id)}
                >
                  <div className="px-2 py-2.5 flex items-center">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => isSpecific && toggleProject(project.id)}
                      disabled={!isSpecific}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="px-3 py-2.5 text-sm text-foreground">{project.number}</div>
                  <div className="px-3 py-2.5 text-sm text-foreground">{project.name}</div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No projects found
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <Button onClick={handleSelect} size="sm">
            Select
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
