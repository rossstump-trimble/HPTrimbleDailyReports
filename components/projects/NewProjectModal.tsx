"use client";

import React, { useState } from "react";
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
import { DEFAULT_DESTINATION } from "@/lib/projectsight/destination";
import { Building2, Plus, Calendar, ShieldCheck } from "lucide-react";
import type { Project } from "@/types/hpproto";

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: Project) => void;
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

export default function NewProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
}: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [psPortfolioId, setPsPortfolioId] = useState(DEFAULT_DESTINATION.portfolioId);
  const [psProjectId, setPsProjectId] = useState(DEFAULT_DESTINATION.projectId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleDay = (dayValue: number) => {
    setWorkingDays((prev) =>
      prev.includes(dayValue) ? prev.filter((d) => d !== dayValue) : [...prev, dayValue].sort(),
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
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
      if (!res.ok) {
        throw new Error(json.error || "Failed to create project");
      }

      onProjectCreated(json.project);
      setName("");
      setCode("");
      setWorkingDays([1, 2, 3, 4, 5]);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Create New Project</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set up a new project with its own QR intake code and bowling sheet.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 py-2">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="projectName" className="text-xs font-semibold">
              Project Name *
            </Label>
            <Input
              id="projectName"
              placeholder="e.g. Hensel Phelps - Apex Stadium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectCode" className="text-xs font-semibold">
              Project Code (Optional)
            </Label>
            <Input
              id="projectCode"
              placeholder="e.g. APEX-01"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Required Working Days
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Dailies will only be marked required/missing on selected days.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DAYS.map((day) => {
                const active = workingDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
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

          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <Label className="text-xs font-semibold">ProjectSight Destination Binding</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="psOrg" className="text-[10px] text-muted-foreground">
                  Portfolio ID (orgid)
                </Label>
                <Input
                  id="psOrg"
                  value={psPortfolioId}
                  onChange={(e) => setPsPortfolioId(e.target.value)}
                  className="text-xs font-mono h-8"
                />
              </div>
              <div>
                <Label htmlFor="psProj" className="text-[10px] text-muted-foreground">
                  Project ID (projid)
                </Label>
                <Input
                  id="psProj"
                  value={psProjectId}
                  onChange={(e) => setPsProjectId(e.target.value)}
                  className="text-xs font-mono h-8"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !name.trim()}
              className="gap-1.5 font-semibold"
            >
              <Plus className="h-4 w-4" />
              {submitting ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
