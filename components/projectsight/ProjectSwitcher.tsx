"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronDown, Search, Star } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DEFAULT_DESTINATION,
  DESTINATION_COOKIE,
  destinationFromCookieWithFallback,
  serializeDestination,
  type ProjectSightDestination,
} from "@/lib/projectsight/destination";
import {
  ACTIVE_PROJECT_EVENT,
  extractProjectIdFromPath,
  getDefaultProjectId,
  getLastSelectedProjectId,
  resolveActiveProjectId,
  setDefaultProjectId,
  setLastSelectedProjectId,
} from "@/lib/active-project";
import type { Project } from "@/types/hpproto";

function readCookieDestination(): ProjectSightDestination {
  if (typeof document === "undefined") return DEFAULT_DESTINATION;
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${DESTINATION_COOKIE}=`));
  return destinationFromCookieWithFallback(raw ? raw.slice(DESTINATION_COOKIE.length + 1) : null);
}

function writeCookieDestination(dest: ProjectSightDestination) {
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${DESTINATION_COOKIE}=${encodeURIComponent(serializeDestination(dest))}; path=/; max-age=${maxAge}; samesite=lax`;
}

export default function ProjectSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appProjects, setAppProjects] = useState<Project[]>([]);
  const [lastProjectId, setLastProjectIdState] = useState<string | null>(null);
  const [defaultProjectId, setDefaultProjectIdState] = useState<string | null>(null);
  const [destination, setDestination] = useState<ProjectSightDestination | null>(null);

  const queryPortfolio = searchParams.get("psPortfolio");
  const queryProject = searchParams.get("psProject");

  const loadAppProjects = useCallback(() => {
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { projects?: Project[] } | null) => {
        if (data?.projects && Array.isArray(data.projects)) {
          setAppProjects(data.projects);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAppProjects();
  }, [loadAppProjects, pathname]);

  useEffect(() => {
    setLastProjectIdState(getLastSelectedProjectId());
    setDefaultProjectIdState(getDefaultProjectId());

    const handleSync = () => {
      setLastProjectIdState(getLastSelectedProjectId());
      setDefaultProjectIdState(getDefaultProjectId());
    };

    window.addEventListener(ACTIVE_PROJECT_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(ACTIVE_PROJECT_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const activeProjectId = resolveActiveProjectId({
    pathname,
    lastProjectId,
    defaultProjectId,
    fallback: appProjects[0]?.id || "1025",
  });

  const activeAppProject = useMemo(
    () =>
      appProjects.find((p) => p.id.toLowerCase() === activeProjectId.toLowerCase()) ||
      null,
    [appProjects, activeProjectId],
  );

  // Sync cookie destination whenever activeAppProject changes
  useEffect(() => {
    const cookie = readCookieDestination();
    if (queryPortfolio && queryProject) {
      setDestination({
        portfolioId: queryPortfolio,
        projectId: queryProject,
        portfolioName: cookie?.portfolioName || "",
        projectName: activeAppProject?.name || cookie?.projectName || "",
      });
      return;
    }
    if (activeAppProject) {
      const nextDest: ProjectSightDestination = {
        portfolioId: activeAppProject.psPortfolioId || cookie?.portfolioId || DEFAULT_DESTINATION.portfolioId,
        projectId: activeAppProject.psProjectId || cookie?.projectId || DEFAULT_DESTINATION.projectId,
        portfolioName: cookie?.portfolioName || "Hensel Phelps",
        projectName: activeAppProject.name,
      };
      setDestination(nextDest);
      writeCookieDestination(nextDest);
    } else if (cookie) {
      setDestination(cookie);
    }
  }, [activeAppProject, queryPortfolio, queryProject]);

  const handleSelectAppProject = (project: Project) => {
    setLastSelectedProjectId(project.id);
    setLastProjectIdState(project.id);

    const nextDest: ProjectSightDestination = {
      portfolioId: project.psPortfolioId || DEFAULT_DESTINATION.portfolioId,
      projectId: project.psProjectId || DEFAULT_DESTINATION.projectId,
      portfolioName: "Hensel Phelps",
      projectName: project.name,
    };
    setDestination(nextDest);
    writeCookieDestination(nextDest);

    const currentFromPath = extractProjectIdFromPath(pathname);
    if (currentFromPath && pathname.startsWith("/projects/")) {
      const rest = pathname.replace(/^\/projects\/[^/]+/, "") || "/dashboard";
      router.push(`/projects/${project.id}${rest}`);
    } else {
      router.push(`/projects/${project.id}/dashboard`);
    }
    setOpen(false);
  };

  const handleToggleDefault = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const isCurrentlyDefault =
      defaultProjectId?.toLowerCase() === project.id.toLowerCase();
    const nextDefault = isCurrentlyDefault ? null : project.id;
    setDefaultProjectId(nextDefault);
    setDefaultProjectIdState(nextDefault);
    if (nextDefault) {
      setLastProjectIdState(nextDefault);
    }
  };

  const filteredAppProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? appProjects
      : appProjects.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.code || "").toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q),
        );
    return [...list].sort((a, b) => {
      const aDef = defaultProjectId?.toLowerCase() === a.id.toLowerCase() ? 1 : 0;
      const bDef = defaultProjectId?.toLowerCase() === b.id.toLowerCase() ? 1 : 0;
      return bDef - aDef;
    });
  }, [appProjects, search, defaultProjectId]);

  const label = activeAppProject
    ? activeAppProject.name
    : destination?.projectName || "Select Project";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 min-w-0 max-w-[340px] justify-between font-medium text-foreground hover:bg-accent/50"
          aria-label="Switch active project"
        >
          {activeAppProject?.code && (
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 shrink-0">
              {activeAppProject.code}
            </Badge>
          )}
          <span className="truncate">{label}</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="center" sideOffset={8}>
        <div className="p-2.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-foreground">
              Switch Active Project
            </p>
            <span className="text-[10px] text-muted-foreground">
              Click ★ to set default
            </span>
          </div>
          <div className="flex items-center border border-input rounded-md bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
            <span className="pl-3 flex items-center shrink-0 text-muted-foreground" aria-hidden>
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="search"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 py-1.5 pl-2 pr-3 h-8 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-xs"
            />
          </div>
        </div>
        <ScrollArea className="max-h-[320px]">
          <div className="p-1.5 space-y-1">
            {filteredAppProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No matching projects found.
              </p>
            ) : (
              filteredAppProjects.map((project) => {
                const isSelected =
                  project.id.toLowerCase() === activeProjectId.toLowerCase();
                const isDefault =
                  defaultProjectId?.toLowerCase() === project.id.toLowerCase();

                return (
                  <div
                    key={project.id}
                    onClick={() => handleSelectAppProject(project)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left cursor-pointer transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-accent text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate">
                            {project.name}
                          </span>
                          {isDefault && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0">
                              Default
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono block truncate">
                          {project.code || project.id.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleToggleDefault(e, project)}
                      title={isDefault ? "Clear default project" : `Set ${project.name} as default project`}
                      className={cn(
                        "p-1.5 rounded-md transition-colors shrink-0",
                        isDefault
                          ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          : "text-muted-foreground/40 hover:text-amber-500 hover:bg-muted",
                      )}
                    >
                      <Star className={cn("h-3.5 w-3.5", isDefault && "fill-amber-400")} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
