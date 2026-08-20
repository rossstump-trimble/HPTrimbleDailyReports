"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ViewOptionsPanelProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

const FILTER_CATEGORIES = [
  "Building type",
  "Construction type",
  "Province/state",
  "Territory",
] as const;

export default function ViewOptionsPanel({
  open,
  onClose,
  className,
}: ViewOptionsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [sort, setSort] = useState("last-activity");
  const [group, setGroup] = useState("no-grouping");

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (!open) return null;

  return (
    <aside
      className={cn(
        "w-72 border-l border-border bg-background flex flex-col shrink-0",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">View options</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs">
            Reset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            aria-label="Close view options"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Sort
          </label>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-activity">Last activity</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created">Created</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Group
          </label>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-grouping">No grouping</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="portfolio">Portfolio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Start date
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Input placeholder="From" className="h-9 pr-8" />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <Input placeholder="To" className="h-9 pr-8" />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            End date
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Input placeholder="From" className="h-9 pr-8" />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <Input placeholder="To" className="h-9 pr-8" />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {FILTER_CATEGORIES.map((name) => (
            <div key={name} className="border rounded-md">
              <button
                type="button"
                onClick={() => toggleCategory(name)}
                className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent/50 rounded-md"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 mr-2 transition-transform shrink-0",
                    expandedCategories.has(name) && "rotate-90"
                  )}
                />
                {name}
              </button>
              {expandedCategories.has(name) && (
                <div className="px-3 pb-2 pt-0 text-sm text-muted-foreground">
                  No options
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
