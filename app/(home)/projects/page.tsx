"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  TableProperties,
  Plus,
  AlertCircle,
  ClipboardCheck,
  Trash2,
  Star,
  CheckCircle2,
  LayoutGrid,
  List,
  Search,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  Link2,
  QrCode,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import QrCodeView from "@/components/common/QrCodeView";
import NewProjectModal from "@/components/projects/NewProjectModal";
import EditProjectModal from "@/components/projects/EditProjectModal";
import ShowMeTour from "@/components/common/ShowMeTour";
import {
  ACTIVE_PROJECT_EVENT,
  clearRememberedProjectIfMatches,
  getDefaultProjectId,
  getLastSelectedProjectId,
  resolveActiveProjectId,
  setDefaultProjectId,
  setLastSelectedProjectId,
} from "@/lib/active-project";
import type { Project } from "@/types/hpproto";

function getIntakeUrl(projectId: string, intakeToken?: string): string {
  const suffix = intakeToken ? `?k=${encodeURIComponent(intakeToken)}` : "";
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return `${origin}/intake/${projectId}${suffix}`;
    }
  }
  return `https://hp-trimble-lab.com/intake/${projectId}${suffix}`;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [capacity, setCapacity] = useState<{ total: number; max: number; isLocked: boolean }>({
    total: 0,
    max: 2000,
    isLocked: false,
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // View mode: 'tile' (default) or 'list'
  const [viewMode, setViewMode] = useState<"tile" | "list">("tile");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [lastProjectId, setLastProjectIdState] = useState<string | null>(null);
  const [defaultProjectId, setDefaultProjectIdState] = useState<string | null>(null);

  const loadProjects = (includeAll = showAll) => {
    fetch(includeAll ? "/api/projects?scope=all" : "/api/projects")
      .then((res) => res.json())
      .then((data: {
        projects?: Project[];
        capacity?: { total: number; max: number; isLocked: boolean };
        isAdmin?: boolean;
        hiddenCount?: number;
      }) => {
        if (data.projects) setProjects(data.projects);
        if (data.capacity) setCapacity(data.capacity);
        setIsAdmin(Boolean(data.isAdmin));
        setHiddenCount(data.hiddenCount ?? 0);
      })
      .catch((err) => console.error("[load projects failed]", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
    setLastProjectIdState(getLastSelectedProjectId());
    setDefaultProjectIdState(getDefaultProjectId());

    try {
      const savedMode = window.localStorage.getItem("hp_projects_view_mode");
      if (savedMode === "list" || savedMode === "tile") {
        setViewMode(savedMode);
      }
    } catch {
      // ignore localStorage error
    }

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

  const handleSetViewMode = (mode: "tile" | "list") => {
    setViewMode(mode);
    try {
      window.localStorage.setItem("hp_projects_view_mode", mode);
    } catch {
      // ignore localStorage error
    }
  };

  const toggleExpandProject = (projectId: string) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const activeMenuProjectId = resolveActiveProjectId({
    pathname: "/projects",
    lastProjectId,
    defaultProjectId,
    fallback: projects[0]?.id || "1025",
  });

  const filteredProjects = useMemo(() => {
    let list = [...projects];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.psProjectId?.toLowerCase().includes(q),
      );
    }

    return list.sort((a, b) => {
      const aDefault = defaultProjectId?.toLowerCase() === a.id.toLowerCase() ? 1 : 0;
      const bDefault = defaultProjectId?.toLowerCase() === b.id.toLowerCase() ? 1 : 0;
      if (aDefault !== bDefault) return bDefault - aDefault;

      const aActive = activeMenuProjectId.toLowerCase() === a.id.toLowerCase() ? 1 : 0;
      const bActive = activeMenuProjectId.toLowerCase() === b.id.toLowerCase() ? 1 : 0;
      return bActive - aActive;
    });
  }, [projects, searchQuery, defaultProjectId, activeMenuProjectId]);

  const handleProjectCreated = (newProj: Project) => {
    setProjects((prev) => [newProj, ...prev]);
    setLastSelectedProjectId(newProj.id);
    setLastProjectIdState(newProj.id);
  };

  const handleProjectUpdated = (updatedProj: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
  };

  const handleNavigateToProject = (projectId: string, subRoute: string) => {
    setLastSelectedProjectId(projectId);
    setLastProjectIdState(projectId);
    router.push(`/projects/${projectId}/${subRoute}`);
  };

  const handleToggleDefaultProject = (projectId: string) => {
    const isCurrentlyDefault =
      defaultProjectId?.toLowerCase() === projectId.toLowerCase();
    const nextDefault = isCurrentlyDefault ? null : projectId;
    setDefaultProjectId(nextDefault);
    setDefaultProjectIdState(nextDefault);
    if (nextDefault) {
      setLastProjectIdState(nextDefault);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete project "${projectName}"? This will remove its QR code and any associated queued reports.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to delete project");
      }
      clearRememberedProjectIfMatches(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Loading projects…
      </div>
    );
  }

  const pagedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Capacity Warning Banner if locked */}
      {capacity.isLocked && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Daily Report Submissions Temporarily Locked
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-xs">
              To prevent abuse, new daily report submissions are temporarily locked. Existing reports remain reviewable and syncable.
            </p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Projects</h1>
            <Badge variant="secondary" className="text-xs font-semibold">
              {projects.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select a project to view its master bowling sheet, set your default project (★), or share QR intake links with trade partners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects by name or code…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-9 text-xs"
            />
          </div>

          {/* View Mode Toggle Button Group */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/30">
            <Button
              type="button"
              variant={viewMode === "tile" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleSetViewMode("tile")}
              className={`h-8 px-2.5 text-xs gap-1.5 ${
                viewMode === "tile" ? "bg-background shadow-xs font-bold text-foreground" : "text-muted-foreground"
              }`}
              title="Tile / Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tiles</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleSetViewMode("list")}
              className={`h-8 px-2.5 text-xs gap-1.5 ${
                viewMode === "list" ? "bg-background shadow-xs font-bold text-foreground" : "text-muted-foreground"
              }`}
              title="Collapsed List View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>

          {isAdmin && (
            <Button
              type="button"
              variant={showAll ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setShowAll(!showAll);
                setPage(1);
                loadProjects(!showAll);
              }}
              className="h-9 text-xs"
              title="Administrators see only their ProjectSight projects by default"
            >
              {showAll ? "Showing all projects" : `Show all projects${hiddenCount > 0 ? ` (+${hiddenCount} hidden)` : ""}`}
            </Button>
          )}

          <ShowMeTour tourId="projects" />

          <Button
            size="sm"
            onClick={() => setNewProjectModalOpen(true)}
            className="gap-1.5 font-semibold h-9 bg-[#0063a3] hover:bg-[#004f83] text-white shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
          <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No projects found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No project matches "${searchQuery}". Clear your search or create a new project.`
                : hiddenCount > 0
                  ? "None of the projects here are in your ProjectSight account. Ask an administrator if you need access to one."
                  : "Get started by adding your first project."}
            </p>
          </div>
          {searchQuery && (
            <Button size="sm" variant="outline" onClick={() => setSearchQuery("")} className="text-xs">
              Clear Search
            </Button>
          )}
        </div>
      )}

      {/* ── View Mode: Collapsed List View (with expandable QR drawer) ── */}
      {viewMode === "list" && filteredProjects.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-3">Project Name &amp; Code</th>
                  <th className="py-3 px-3">ProjectSight Link</th>
                  <th className="py-3 px-3">Work Schedule</th>
                  <th className="py-3 px-3">Trade Partners</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedProjects.map((project) => {
                  const intakeUrl = getIntakeUrl(project.id, project.intakeToken);
                  const hpIntakeUrl = `${getIntakeUrl(project.id)}/hp`;
                  const isDefault = defaultProjectId?.toLowerCase() === project.id.toLowerCase();
                  const isActiveInMenu = activeMenuProjectId.toLowerCase() === project.id.toLowerCase();
                  const isExpanded = expandedProjectIds.has(project.id);

                  return (
                    <React.Fragment key={project.id}>
                      <tr className={`hover:bg-muted/20 transition-colors ${isActiveInMenu ? "bg-[#0063a3]/5" : ""}`}>
                        {/* Expand/Collapse Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpandProject(project.id)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                            title={isExpanded ? "Collapse QR codes" : "Expand QR codes & links"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-[#0063a3]" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        {/* Project Name and Badge */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-foreground hover:underline cursor-pointer" onClick={() => handleNavigateToProject(project.id, "dashboard")}>
                                {project.name}
                              </span>
                              <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold py-0 h-4">
                                {project.code || project.id.toUpperCase()}
                              </Badge>
                              {isDefault && (
                                <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/40 text-[9px] font-semibold gap-0.5 px-1.5 py-0 h-4">
                                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" />
                                  Default
                                </Badge>
                              )}
                              {isActiveInMenu && (
                                <Badge variant="secondary" className="text-[9px] font-semibold gap-0.5 px-1.5 py-0 h-4 bg-blue-50 text-[#0063a3] dark:bg-blue-950/50 dark:text-blue-300">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  Active Menu
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              ID: {project.id}
                            </p>
                          </div>
                        </td>

                        {/* ProjectSight Integration Info */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5 font-mono text-[11px]">
                            {project.psProjectId ? (
                              <span className="inline-flex items-center gap-1 text-[#0063a3] font-semibold">
                                <Link2 className="h-3 w-3" />
                                Project #{project.psProjectId}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Not linked</span>
                            )}
                            {project.psPortfolioId && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[140px]" title={project.psPortfolioId}>
                                Port: {project.psPortfolioId.slice(0, 8)}…
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Work Schedule */}
                        <td className="py-3 px-3">
                          <span className="text-[11px] text-foreground font-medium">
                            {project.workingDays
                              ? `${project.workingDays.length}d/wk (${
                                  project.workingDays.length === 5 && !project.workingDays.includes(0) && !project.workingDays.includes(6)
                                    ? "Mon–Fri"
                                    : project.workingDays.length === 6 && !project.workingDays.includes(0)
                                    ? "Mon–Sat"
                                    : project.workingDays.length === 7
                                    ? "7 Days"
                                    : `${project.workingDays.length} days`
                                })`
                              : "5d/wk"}
                          </span>
                        </td>

                        {/* Trade Partners */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-semibold text-foreground">
                              {project.tradePartners?.length ?? 0}
                            </span>
                            <span className="text-muted-foreground text-[11px]">enrolled</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigateToProject(project.id, "dashboard")}
                              className="h-7 px-2 text-[11px] gap-1"
                              title="Project Dashboard"
                            >
                              <LayoutDashboard className="h-3 w-3" />
                              <span className="hidden sm:inline">Dashboard</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigateToProject(project.id, "bowling")}
                              className="h-7 px-2 text-[11px] gap-1"
                              title="Bowling Sheet Matrix"
                            >
                              <TableProperties className="h-3 w-3" />
                              <span className="hidden sm:inline">Bowling</span>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleNavigateToProject(project.id, "review")}
                              className="h-7 px-2 text-[11px] gap-1 bg-[#0063a3] hover:bg-[#004f83] text-white"
                              title="Daily Review Queue"
                            >
                              <ClipboardCheck className="h-3 w-3" />
                              <span className="hidden sm:inline">Review</span>
                            </Button>

                            {/* Edit Project Settings Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProject(project)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Edit Project & ProjectSight IDs"
                              aria-label={`Configure ${project.name}`}
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>

                            {/* Set Default Star Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 p-0 ${
                                isDefault ? "text-amber-500 fill-amber-400" : "text-muted-foreground hover:text-amber-500"
                              }`}
                              onClick={() => handleToggleDefaultProject(project.id)}
                              title={isDefault ? "Unset default project" : "Set as default project"}
                            >
                              <Star className={`h-3.5 w-3.5 ${isDefault ? "fill-amber-400" : ""}`} />
                            </Button>

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteProject(project.id, project.name)}
                              title={`Delete ${project.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Drawer: QR Codes & Direct Links */}
                      {isExpanded && (
                        <tr className="bg-muted/15 border-b border-border">
                          <td colSpan={6} className="p-4 pl-12">
                            <div className="bg-background rounded-xl border border-border p-4 shadow-xs space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <QrCode className="h-4 w-4 text-[#0063a3]" />
                                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                    Jobsite Intake QR Codes &amp; Field URLs
                                  </h4>
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                  Download or display on site trailers and checkpoints
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                {/* Trade Partner QR */}
                                <div className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col items-center">
                                  <div className="flex items-center justify-between w-full mb-2 px-1">
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-border">
                                      Trade Subcontractors
                                    </Badge>
                                    <button
                                      type="button"
                                      onClick={() => window.open(intakeUrl, "_blank")}
                                      className="flex items-center gap-1 text-[11px] text-[#0063a3] font-semibold hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" /> Open Link
                                    </button>
                                  </div>
                                  <QrCodeView url={intakeUrl} size={110} showUrl={true} showActions={true} />
                                </div>

                                {/* Hensel Phelps Staff QR */}
                                <div className="p-3 rounded-xl border border-blue-200/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900/60 flex flex-col items-center">
                                  <div className="flex items-center justify-between w-full mb-2 px-1">
                                    <Badge className="bg-[#0063a3] text-white hover:bg-[#0063a3] text-[10px] font-bold uppercase tracking-wider">
                                      Hensel Phelps Staff Only
                                    </Badge>
                                    <button
                                      type="button"
                                      onClick={() => window.open(hpIntakeUrl, "_blank")}
                                      className="flex items-center gap-1 text-[11px] text-[#0063a3] dark:text-blue-400 font-semibold hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" /> Open Link
                                    </button>
                                  </div>
                                  <QrCodeView url={hpIntakeUrl} size={110} showUrl={true} showActions={true} />
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── View Mode: Default Expanded Tile View ── */}
      {viewMode === "tile" && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pagedProjects.map((project) => {
            const intakeUrl = getIntakeUrl(project.id, project.intakeToken);
            const hpIntakeUrl = `${getIntakeUrl(project.id)}/hp`;
            const isDefault = defaultProjectId?.toLowerCase() === project.id.toLowerCase();
            const isActiveInMenu = activeMenuProjectId.toLowerCase() === project.id.toLowerCase();

            return (
              <Card
                key={project.id}
                className={`flex flex-col shadow-sm transition-colors ${
                  isActiveInMenu ? "border-[#0063a3] ring-1 ring-[#0063a3]/20" : "border-border"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs font-semibold">
                          {project.code || project.id.toUpperCase()}
                        </Badge>
                        {isDefault && (
                          <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/40 hover:bg-amber-500/20 text-[10px] font-semibold gap-1 px-2 py-0">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                            Default Project
                          </Badge>
                        )}
                        {isActiveInMenu && (
                          <Badge variant="secondary" className="text-[10px] font-semibold gap-1 px-2 py-0 bg-blue-50 text-[#0063a3] dark:bg-blue-950/50 dark:text-blue-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Active in Menu
                          </Badge>
                        )}
                        {project.psProjectId && (
                          <Badge variant="outline" className="text-[10px] font-mono py-0 text-[#0063a3] border-blue-200">
                            PS #{project.psProjectId}
                          </Badge>
                        )}
                        {project.workingDays && (
                          <span className="text-xs text-muted-foreground">
                            {project.workingDays.length} working days / week
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-foreground leading-tight">
                        {project.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Edit Project Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => setEditingProject(project)}
                        title="Edit Project & ProjectSight IDs"
                        aria-label={`Configure ${project.name}`}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>

                      {/* Set Default Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2 text-xs gap-1 ${
                          isDefault
                            ? "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            : "text-muted-foreground hover:text-amber-600"
                        }`}
                        onClick={() => handleToggleDefaultProject(project.id)}
                        title={isDefault ? "Remove as default project" : "Set as your default project"}
                        aria-label={isDefault ? `Unset ${project.name} as default` : `Set ${project.name} as default`}
                      >
                        <Star className={`h-4 w-4 ${isDefault ? "fill-amber-400 text-amber-500" : ""}`} />
                        <span className="hidden sm:inline">{isDefault ? "Default" : "Set Default"}</span>
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        aria-label={`Delete project ${project.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Trade partner count */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{project.tradePartners?.length ?? 0}</span>
                    <span>trade partners enrolled</span>
                  </div>

                  {/* Trade partner chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {(project.tradePartners || []).slice(0, 6).map((tp) => (
                      <Badge key={tp.id} variant="secondary" className="text-xs px-2 py-0.5">
                        {tp.name}
                      </Badge>
                    ))}
                    {(project.tradePartners?.length || 0) > 6 && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        +{(project.tradePartners?.length || 0) - 6} more
                      </Badge>
                    )}
                  </div>

                  {/* QR code section - Trade Partner & HP Employee side-by-side */}
                  <div className="border-t border-border pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* 1. Trade Partner QR */}
                      <div className="bg-muted/30 p-3 rounded-2xl border border-border flex flex-col items-center">
                        <div className="flex items-center justify-between w-full mb-2 px-0.5">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-border">
                            Trade Partner
                          </Badge>
                          <button
                            onClick={() => window.open(intakeUrl, "_blank")}
                            className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </button>
                        </div>
                        <QrCodeView url={intakeUrl} size={105} showUrl={true} showActions={true} />
                      </div>

                      {/* 2. Hensel Phelps Employee QR */}
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 flex flex-col items-center">
                        <div className="flex items-center justify-between w-full mb-2 px-0.5">
                          <Badge className="bg-[#0063a3] text-white hover:bg-[#0063a3] text-[10px] font-bold uppercase tracking-wider">
                            Hensel Phelps Staff Only
                          </Badge>
                          <button
                            onClick={() => window.open(hpIntakeUrl, "_blank")}
                            className="flex items-center gap-1 text-[11px] text-[#0063a3] dark:text-blue-400 font-semibold hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </button>
                        </div>
                        <QrCodeView url={hpIntakeUrl} size={105} showUrl={true} showActions={true} />
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-border grid grid-cols-3 gap-2.5">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-2 py-2.5 h-10"
                    size="sm"
                    onClick={() => handleNavigateToProject(project.id, "dashboard")}
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span>Dashboard</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-2 py-2.5 h-10"
                    size="sm"
                    onClick={() => handleNavigateToProject(project.id, "bowling")}
                  >
                    <TableProperties className="h-4 w-4 shrink-0" />
                    <span>Bowling Sheet</span>
                  </Button>
                  <Button
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold px-2 py-2.5 h-10 shadow-sm bg-[#0063a3] hover:bg-[#004f83] text-white"
                    size="sm"
                    onClick={() => handleNavigateToProject(project.id, "review")}
                  >
                    <ClipboardCheck className="h-4 w-4 shrink-0" />
                    <span>Review Queue</span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {filteredProjects.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-border">
          <span>
            Page <strong className="text-foreground">{page}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong> ({filteredProjects.length} projects)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <NewProjectModal
        open={newProjectModalOpen}
        onOpenChange={setNewProjectModalOpen}
        onProjectCreated={handleProjectCreated}
      />

      <EditProjectModal
        project={editingProject}
        open={Boolean(editingProject)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingProject(null);
        }}
        onProjectUpdated={handleProjectUpdated}
        canEditAccess={isAdmin}
      />
    </div>
  );
}
