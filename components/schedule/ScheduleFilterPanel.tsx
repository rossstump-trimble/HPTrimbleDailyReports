"use client";

import { useState, createContext, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectContext } from "@/contexts/ProjectContext";
import { useActivities } from "@/hooks/useActivities";
import { useSidebarPortalRef } from "@/components/schedule/ScheduleNewModule";

export const ScheduleFilterContext = createContext<{
  filterFolder: string;
  filterLocation: string;
  filterOwner: string;
  filterPackage: string;
  filterSubcontractor: string;
  setFilterFolder: (v: string) => void;
  setFilterLocation: (v: string) => void;
  setFilterOwner: (v: string) => void;
  setFilterPackage: (v: string) => void;
  setFilterSubcontractor: (v: string) => void;
} | null>(null);

export function useScheduleFilters() {
  return useContext(ScheduleFilterContext);
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value || "__all__"} onValueChange={(v) => onChange(v === "__all__" ? "" : v)}>
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue placeholder={`All ${label}s`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All {label}s</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ScheduleFilterPanelInner() {
  const { activeProjectId: projectId } = useProjectContext();
  const sidebarPortalNode = useSidebarPortalRef();
  const { data: activities } = useActivities(projectId ?? undefined);
  const [showFilters, setShowFilters] = useState(false);
  const filterCtx = useScheduleFilters();

  const filterOptions = useMemo(() => {
    if (!activities)
      return { folders: [] as string[], locations: [] as string[], owners: [] as string[], packages: [] as string[], subcontractors: [] as string[] };
    const parentIds = new Set(activities.filter((a) => activities.some((c) => c.parent_id === a.id)).map((a) => a.id));
    const folders = activities.filter((a) => parentIds.has(a.id)).map((a) => a.name);
    const locations = Array.from(new Set(activities.map((a) => a.location).filter(Boolean))) as string[];
    const owners = Array.from(new Set(activities.map((a) => a.owner).filter(Boolean))) as string[];
    const packages = Array.from(new Set(activities.map((a) => a.package).filter(Boolean))) as string[];
    const subcontractors = Array.from(new Set(activities.map((a) => a.subcontractor).filter(Boolean))) as string[];
    return { folders, locations, owners, packages, subcontractors };
  }, [activities]);

  if (!sidebarPortalNode || !filterCtx || !projectId) return null;

  const { filterFolder, filterLocation, filterOwner, filterPackage, filterSubcontractor, setFilterFolder, setFilterLocation, setFilterOwner, setFilterPackage, setFilterSubcontractor } = filterCtx;
  const activeFilterCount = [filterFolder, filterLocation, filterOwner, filterPackage, filterSubcontractor].filter(Boolean).length;
  const clearAllFilters = () => {
    setFilterFolder("");
    setFilterLocation("");
    setFilterOwner("");
    setFilterPackage("");
    setFilterSubcontractor("");
  };

  const sidebarContent = showFilters ? (
    <div className="flex w-72 animate-in slide-in-from-right duration-200">
      <div className="flex-1 min-w-0 bg-muted/30 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">View options</span>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="text-xs text-primary hover:underline">
              Reset
            </button>
          )}
          <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <FilterSelect label="Folder" value={filterFolder} onChange={setFilterFolder} options={filterOptions.folders} />
        <FilterSelect label="Location" value={filterLocation} onChange={setFilterLocation} options={filterOptions.locations} />
        <FilterSelect label="Owner" value={filterOwner} onChange={setFilterOwner} options={filterOptions.owners} />
        <FilterSelect label="Package" value={filterPackage} onChange={setFilterPackage} options={filterOptions.packages} />
        <FilterSelect label="Subcontractor" value={filterSubcontractor} onChange={setFilterSubcontractor} options={filterOptions.subcontractors} />
      </div>
      </div>
    </div>
  ) : (
    <div className="flex">
      <button
        onClick={() => setShowFilters(true)}
        className="w-10 bg-primary/5 hover:bg-primary/10 flex flex-col items-center gap-2 transition-colors pt-[1.65rem] flex-shrink-0 border-l border-primary/20"
        title="View options"
      >
      <Filter className="h-4 w-4 text-primary" />
      {activeFilterCount > 0 && (
        <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">{activeFilterCount}</Badge>
      )}
    </button>
    </div>
  );

  return createPortal(sidebarContent, sidebarPortalNode);
}

export function ScheduleFilterPanelProvider({ children }: { children: React.ReactNode }) {
  const [filterFolder, setFilterFolder] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterPackage, setFilterPackage] = useState("");
  const [filterSubcontractor, setFilterSubcontractor] = useState("");

  const value = useMemo(
    () => ({
      filterFolder,
      filterLocation,
      filterOwner,
      filterPackage,
      filterSubcontractor,
      setFilterFolder,
      setFilterLocation,
      setFilterOwner,
      setFilterPackage,
      setFilterSubcontractor,
    }),
    [filterFolder, filterLocation, filterOwner, filterPackage, filterSubcontractor]
  );

  return <ScheduleFilterContext.Provider value={value}>{children}</ScheduleFilterContext.Provider>;
}
