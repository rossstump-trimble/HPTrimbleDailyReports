"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Building2,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/projectsight/myProjectsData";
import ViewOptionsPanel from "./ViewOptionsPanel";

export default function MyProjectsPage() {
  const router = useRouter();
  const [viewOptionsOpen, setViewOptionsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard?project=${encodeURIComponent(projectId)}`);
  };

  const filteredProjects = MOCK_PROJECTS.filter(
    (p) =>
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const projectCount = filteredProjects.length;
  const projectLabel = projectCount === 1 ? "project" : "projects";

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: count left, options right */}
      <div className="flex-none border-b border-border bg-background px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 gap-y-2">
          <span className="text-lg font-semibold text-foreground shrink-0">
            {projectCount} {projectLabel}
          </span>
          <div className="flex flex-wrap items-center gap-3 justify-end">
            <SelectPlaceholder label="Unsaved view" />
            <SelectPlaceholder label="Owned by anyone" />
            <div className="flex items-center w-56 border border-input rounded-md bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="pl-3 flex items-center shrink-0 text-muted-foreground" aria-hidden>
                <Search className="h-4 w-4" />
              </span>
              <input
                type="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 py-2 pl-2 pr-3 h-9 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-muted/30">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  viewMode === "grid" &&
                    "bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground"
                )}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  viewMode === "list" &&
                    "bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground"
                )}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant={viewOptionsOpen ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setViewOptionsOpen((o) => !o)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              View options
            </Button>
          </div>
        </div>
      </div>

      {/* Main content + optional right panel */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                : "flex flex-col gap-2"
            )}
          >
            {/* Add Project card */}
            <Card
              className={cn(
                "cursor-pointer border-dashed hover:border-primary/50 hover:bg-accent/30 transition-colors",
                viewMode === "grid"
                  ? "min-h-[180px] flex items-center justify-center"
                  : "flex-row items-center min-h-0"
              )}
              onClick={() => {}}
            >
              <CardContent
                className={cn(
                  "flex flex-col items-center justify-center text-muted-foreground hover:text-foreground",
                  viewMode === "grid" ? "p-6" : "flex-row gap-3 p-4"
                )}
              >
                <Plus className="h-10 w-10 shrink-0" />
                <span className="font-medium">Add Project</span>
              </CardContent>
            </Card>

            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className={cn(
                  "cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group",
                  viewMode === "grid"
                    ? "min-h-[180px]"
                    : "flex-row items-center min-h-0"
                )}
                onClick={() => handleProjectClick(project.id)}
              >
                <CardContent
                  className={cn(
                    "relative flex flex-col",
                    viewMode === "grid" ? "p-5 h-full" : "flex-row items-center gap-4 p-4 w-full"
                  )}
                >
                  {viewMode === "grid" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      aria-label="Project settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0",
                      viewMode === "grid"
                        ? "h-14 w-14 mb-3"
                        : "h-10 w-10"
                    )}
                  >
                    <Building2 className={viewMode === "grid" ? "h-7 w-7" : "h-5 w-5"} />
                  </div>
                  <div className={cn("min-w-0 flex-1", viewMode === "list" && "flex items-center gap-4")}>
                    <p className="font-medium text-foreground truncate">
                      {project.name}
                    </p>
                    {project.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">
                        {project.subtitle}
                      </p>
                    )}
                    {viewMode === "grid" && project.progress != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.progress}%
                      </p>
                    )}
                  </div>
                  {viewMode === "list" && project.progress != null && (
                    <span className="text-sm text-muted-foreground shrink-0">
                      {project.progress}%
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <ViewOptionsPanel
          open={viewOptionsOpen}
          onClose={() => setViewOptionsOpen(false)}
        />
      </div>
    </div>
  );
}

function SelectPlaceholder({ label }: { label: string }) {
  return (
    <select
      className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      defaultValue=""
      aria-label={label}
    >
      <option value="">{label}</option>
    </select>
  );
}
