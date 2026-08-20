"use client";

import React, { useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Building2, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_PROJECTS } from "@/lib/projectsight/myProjectsData";

const DEFAULT_PROJECT_ID = MOCK_PROJECTS[0]?.id ?? "1";

export default function ProjectSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const projectId = searchParams.get("project") ?? DEFAULT_PROJECT_ID;
  const currentProject =
    MOCK_PROJECTS.find((p) => p.id === projectId) ?? MOCK_PROJECTS[0];

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return MOCK_PROJECTS;
    const q = search.toLowerCase();
    return MOCK_PROJECTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.subtitle?.toLowerCase().includes(q) ?? false)
    );
  }, [search]);

  const handleSelectProject = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("project", id);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 min-w-0 max-w-[280px] justify-between font-medium text-foreground hover:bg-accent/50"
          aria-label="Switch project"
        >
          <span className="truncate">
            {currentProject?.name ?? "Select project"}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-0 align-center"
        align="center"
        sideOffset={8}
      >
        <div className="p-2 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">
            Projects
          </p>
          <div className="flex items-center border border-input rounded-md bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <span className="pl-3 flex items-center shrink-0 text-muted-foreground" aria-hidden>
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 py-2 pl-2 pr-3 h-9 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="max-h-[320px]">
          <div className="p-1">
            {filteredProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No projects found
              </p>
            ) : (
              filteredProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleSelectProject(project.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                    project.id === projectId
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    {project.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {project.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
