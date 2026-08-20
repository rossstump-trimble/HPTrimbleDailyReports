"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Project {
  id: string;
  number: string;
  name: string;
}

export const mockProjects: Project[] = [
  { id: "p1", number: "9", name: "421 N. Franklin Avenue" },
  { id: "p2", number: "19292344", name: "AI Search" },
  { id: "p3", number: "1354", name: "Connect & Go" },
  { id: "p4", number: "998", name: "Downtown Medical Center" },
  { id: "p5", number: "101", name: "Fanno Creek Trail" },
  { id: "p6", number: "001", name: "Madison Lake House" },
  { id: "p7", number: "2025", name: "Matt's Coffee Shop" },
  { id: "p8", number: "123405", name: "Meat Science Lab" },
  { id: "p9", number: "111", name: "Westminster Office Campus" },
];

interface ProjectMultiSelectProps {
  selectedIds: string[];
  onToggle: (projectId: string) => void;
  onReset: () => void;
  showAllOption?: boolean;
  isAllSelected?: boolean;
  onToggleAll?: () => void;
}

export default function ProjectMultiSelect({
  selectedIds,
  onToggle,
  onReset,
  showAllOption,
  isAllSelected,
  onToggleAll,
}: ProjectMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = mockProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  let displayText: string;
  if (isAllSelected) {
    displayText = "All Projects";
  } else if (selectedIds.length > 0) {
    displayText = `${selectedIds.length} selected`;
  } else {
    displayText = showAllOption ? "None" : "";
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center justify-between w-full min-w-[140px] h-7 px-2 text-xs border rounded bg-background text-foreground",
          open ? "border-primary ring-1 ring-primary" : "border-border"
        )}
      >
        <span className={cn(
          "truncate",
          isAllSelected ? "text-foreground" : "text-muted-foreground"
        )}>
          {displayText}
        </span>
        <ChevronDown className="h-3 w-3 ml-1 flex-none text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-56 border border-border rounded-md bg-background shadow-lg">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border text-xs text-muted-foreground">
            <span>
              {isAllSelected
                ? "All Projects"
                : `${selectedIds.length} selected`}
            </span>
            <button
              type="button"
              onClick={onReset}
              className="text-primary hover:underline"
            >
              Reset
            </button>
          </div>

          <ScrollArea className="max-h-48">
            <div className="py-1">
              {showAllOption && (
                <label className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent/50 cursor-pointer font-medium border-b border-border/40 mb-0.5">
                  <Checkbox
                    checked={!!isAllSelected}
                    onCheckedChange={() => onToggleAll?.()}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-foreground">All Projects</span>
                </label>
              )}
              {filtered.map((project) => (
                <label
                  key={project.id}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedIds.includes(project.id)}
                    onCheckedChange={() => onToggle(project.id)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-foreground">{project.name}</span>
                </label>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No projects found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
