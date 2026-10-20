"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, LayoutDashboard, TableProperties, Plus, AlertCircle, Building2, ClipboardCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import QrCodeView from "@/components/common/QrCodeView";
import NewProjectModal from "@/components/projects/NewProjectModal";
import type { Project } from "@/types/hpproto";

function getIntakeUrl(projectId: string): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return `${origin}/intake/${projectId}`;
    }
  }
  return `https://hp-trimble-lab.com/intake/${projectId}`;
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
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);

  const loadProjects = () => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data: { projects?: Project[]; capacity?: { total: number; max: number; isLocked: boolean } }) => {
        if (data.projects) setProjects(data.projects);
        if (data.capacity) setCapacity(data.capacity);
      })
      .catch((err) => console.error("[load projects failed]", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProjectCreated = (newProj: Project) => {
    setProjects((prev) => [newProj, ...prev]);
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select a project to view its master bowling sheet or share the QR intake link with trade partners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => setNewProjectModalOpen(true)}
            className="gap-1.5 font-semibold"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Project Cards Grid - Wider 2-column grid for spacious buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => {
          const intakeUrl = getIntakeUrl(project.id);
          const hpIntakeUrl = `${getIntakeUrl(project.id)}/hp`;
          return (
            <Card key={project.id} className="flex flex-col shadow-sm border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="font-mono text-xs font-semibold">
                        {project.code || project.id.toUpperCase()}
                      </Badge>
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

                    {/* 2. HP Employee QR */}
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 flex flex-col items-center">
                      <div className="flex items-center justify-between w-full mb-2 px-0.5">
                        <Badge className="bg-[#0063a3] text-white hover:bg-[#0063a3] text-[10px] font-bold uppercase tracking-wider">
                          HP Staff Only
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
                  onClick={() => router.push(`/projects/${project.id}/dashboard`)}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span>Dashboard</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-2 py-2.5 h-10"
                  size="sm"
                  onClick={() => router.push(`/projects/${project.id}/bowling`)}
                >
                  <TableProperties className="h-4 w-4 shrink-0" />
                  <span>Bowling Sheet</span>
                </Button>
                <Button
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold px-2 py-2.5 h-10 shadow-sm"
                  size="sm"
                  onClick={() => router.push(`/projects/${project.id}/review`)}
                >
                  <ClipboardCheck className="h-4 w-4 shrink-0" />
                  <span>Review Queue</span>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <NewProjectModal
        open={newProjectModalOpen}
        onOpenChange={setNewProjectModalOpen}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
