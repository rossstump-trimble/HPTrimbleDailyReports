"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Save, Calendar, Link2 } from "lucide-react";
import type { Project } from "@/types/hpproto";

interface EditProjectModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated: (project: Project) => void;
}

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

export default function EditProjectModal({
  project,
  open,
  onOpenChange,
  onProjectUpdated,
}: EditProjectModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [psPortfolioId, setPsPortfolioId] = useState("");
  const [psProjectId, setPsProjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setCode(project.code || "");
      setWorkingDays(project.workingDays || [1, 2, 3, 4, 5]);
      setPsPortfolioId(project.psPortfolioId || "");
      setPsProjectId(project.psProjectId || "");
      setError("");
    }
  }, [project, open]);

  const toggleDay = (dayValue: number) => {
    setWorkingDays((prev) =>
      prev.includes(dayValue) ? prev.filter((d) => d !== dayValue) : [...prev, dayValue].sort(),
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          workingDays,
          psPortfolioId: psPortfolioId.trim() || undefined,
          psProjectId: psProjectId.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to update project settings");
      }

      if (json.project) {
        onProjectUpdated(json.project);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#0063a3]/10 text-[#0063a3]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Project Configuration</DialogTitle>
              <DialogDescription className="text-xs">
                View and adjust linked ProjectSight IDs, project codes, and work schedule.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-project-name" className="text-xs font-semibold">
              Project Name *
            </Label>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Phoenix Campus Building 82"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-project-code" className="text-xs font-semibold">
                Project Code / Number
              </Label>
              <Input
                id="edit-project-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. PHX82"
                className="text-xs uppercase font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Internal App ID
              </Label>
              <Input
                value={project.id}
                disabled
                className="text-xs font-mono bg-muted/40 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Linked ProjectSight Integration Configuration */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900/60 p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0063a3] dark:text-blue-400">
              <Link2 className="h-4 w-4" />
              <span>Linked ProjectSight Project</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              These identifiers link this project directly to Trimble ProjectSight for daily report syncing, labor cards, and company syncing.
            </p>

            <div className="space-y-2 pt-1">
              <div className="space-y-1">
                <Label htmlFor="edit-ps-portfolio" className="text-[11px] font-semibold">
                  ProjectSight Portfolio ID (UUID)
                </Label>
                <Input
                  id="edit-ps-portfolio"
                  value={psPortfolioId}
                  onChange={(e) => setPsPortfolioId(e.target.value)}
                  placeholder="e.g. 8fddbe9f-933a-43b9-8b5e-17ff16f14598"
                  className="text-xs font-mono bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-ps-project" className="text-[11px] font-semibold">
                  ProjectSight Project ID / Number
                </Label>
                <Input
                  id="edit-ps-project"
                  value={psProjectId}
                  onChange={(e) => setPsProjectId(e.target.value)}
                  placeholder="e.g. 1025 or 28"
                  className="text-xs font-mono bg-background"
                />
              </div>
            </div>
          </div>

          {/* Working Days */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Required Working Days
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => {
                const active = workingDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      active
                        ? "bg-[#0063a3] text-white border-[#0063a3]"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="text-xs font-semibold gap-1.5 bg-[#0063a3] hover:bg-[#004f83] text-white"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
