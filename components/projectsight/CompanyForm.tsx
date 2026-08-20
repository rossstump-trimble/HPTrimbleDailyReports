"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Save,
  X,
  MoreHorizontal,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProjectMultiSelect from "./ProjectMultiSelect";

interface Crew {
  id: string;
  name: string;
  isDefault: boolean;
  projectIds: string[];
  startTime: string;
  finishTime: string;
  breakHour: number;
  workers: number;
  defaultUOM: string;
  defaultHours: number;
}

interface CompanyData {
  id: string;
  name: string;
  typeOfCompany: string;
  division: string;
}

const mockCrewsByCompany: Record<string, Crew[]> = {
  "1": [
    { id: "c1", name: "Day Shift", isDefault: true, projectIds: ["p1"], startTime: "07:00", finishTime: "15:00", breakHour: 1.0, workers: 5, defaultUOM: "Hours", defaultHours: 8.0 },
  ],
  "2": [
    { id: "c1", name: "Field Crew", isDefault: true, projectIds: ["p4", "p5"], startTime: "08:00", finishTime: "17:00", breakHour: 1.0, workers: 3, defaultUOM: "Hours", defaultHours: 8.0 },
    { id: "c2", name: "Office", isDefault: false, projectIds: [], startTime: "09:00", finishTime: "17:00", breakHour: 0.5, workers: 2, defaultUOM: "Hours", defaultHours: 8.0 },
  ],
  "3": [
    { id: "c1", name: "Crew A", isDefault: true, projectIds: [], startTime: "", finishTime: "", breakHour: 0.0, workers: 0, defaultUOM: "Hours", defaultHours: 8.0 },
  ],
  "4": [
    { id: "c1", name: "Day Shift", isDefault: false, projectIds: [], startTime: "8:00 AM", finishTime: "5:00 PM", breakHour: 1.0, workers: 4, defaultUOM: "Hours", defaultHours: 8.0 },
    { id: "c2", name: "Night Shift", isDefault: false, projectIds: [], startTime: "10:00 PM", finishTime: "1:00 AM", breakHour: 0.0, workers: 4, defaultUOM: "Hours", defaultHours: 8.0 },
    { id: "c3", name: "Weekend, Morning", isDefault: false, projectIds: [], startTime: "8:00 AM", finishTime: "12:00 PM", breakHour: 1.0, workers: 4, defaultUOM: "Hours", defaultHours: 8.0 },
    { id: "c4", name: "Weekend, Afternoon", isDefault: false, projectIds: [], startTime: "1:00 PM", finishTime: "5:00 PM", breakHour: 1.0, workers: 4, defaultUOM: "Hours", defaultHours: 8.0 },
  ],
  "5": [
    { id: "c1", name: "Concrete Crew", isDefault: true, projectIds: ["p1", "p9"], startTime: "06:00", finishTime: "14:30", breakHour: 0.5, workers: 8, defaultUOM: "Hours", defaultHours: 8.0 },
    { id: "c2", name: "Finishing", isDefault: false, projectIds: ["p9"], startTime: "07:00", finishTime: "15:00", breakHour: 0.5, workers: 4, defaultUOM: "Hours", defaultHours: 8.0 },
  ],
};

const TABS = [
  "CONTACTS",
  "ADDRESSES",
  "CREWS",
  "INSURANCE",
  "DIVISIONS",
  "WORK TYPES",
  "REGIONS",
  "CERTIFICATES",
  "LEGAL/FINANCIAL",
  "WORK HISTORY",
  "CONTRACT HISTORY",
  "HISTORY",
] as const;

interface CompanyFormProps {
  company: CompanyData;
  companyIndex: number;
  totalCompanies: number;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
}

export default function CompanyForm({
  company,
  companyIndex,
  totalCompanies,
  onClose,
  onNavigate,
}: CompanyFormProps) {
  const [activeTab, setActiveTab] = useState<string>("CREWS");
  const [companyName, setCompanyName] = useState(company.name);
  const [typeOfCompany, setTypeOfCompany] = useState(company.typeOfCompany || "none");
  const [specSection, setSpecSection] = useState("none");
  const [division, setDivision] = useState(company.division || "none");
  const [trade, setTrade] = useState("");
  const [notes, setNotes] = useState("");
  const [infoSuppliedBy, setInfoSuppliedBy] = useState("");
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("none");
  const [aliasId, setAliasId] = useState("");
  const [aliasSystem, setAliasSystem] = useState("");

  const crews = mockCrewsByCompany[company.id] || [];
  const [selectedCrewIds, setSelectedCrewIds] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    setCompanyName(company.name);
    setTypeOfCompany(company.typeOfCompany || "none");
    setDivision(company.division || "none");
    setSelectedCrewIds(new Set());
  }, [company]);

  const toggleCrewSelection = (crewId: string) => {
    setSelectedCrewIds((prev) => {
      const next = new Set(prev);
      if (next.has(crewId)) next.delete(crewId);
      else next.add(crewId);
      return next;
    });
  };

  const allCrewsSelected = crews.length > 0 && crews.every((c) => selectedCrewIds.has(c.id));
  const toggleAllCrews = () => {
    if (allCrewsSelected) setSelectedCrewIds(new Set());
    else setSelectedCrewIds(new Set(crews.map((c) => c.id)));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Form header bar */}
      <div className="flex items-center h-11 px-3 border-b border-border bg-background flex-none">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1 text-sm h-8" onClick={onClose}>
            <ChevronLeft className="h-4 w-4" />
            Done
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Save className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 text-center">
          <div className="text-sm font-semibold">{company.name}</div>
          <div className="text-xs text-muted-foreground -mt-0.5">Company</div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={companyIndex <= 0}
            onClick={() => onNavigate("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={companyIndex >= totalCompanies - 1}
            onClick={() => onNavigate("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground mx-1">
            {companyIndex + 1} of {totalCompanies}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body: left content + right sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Company name input */}
          <div className="px-4 py-2 border-b border-border flex-none">
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="text-sm h-9"
            />
          </div>

          {/* Tab bar */}
          <div className="border-b border-border flex-none overflow-x-auto">
            <div className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                    activeTab === tab
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {activeTab === "CREWS" && (
              <CrewsTab
                crews={crews}
                selectedCrewIds={selectedCrewIds}
                allSelected={allCrewsSelected}
                onToggleAll={toggleAllCrews}
                onToggleOne={toggleCrewSelection}
              />
            )}
            {activeTab !== "CREWS" && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {activeTab} content
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-56 border-l border-border bg-background flex-none">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              <div>
                <Label className="text-xs text-primary">Type of company</Label>
                <Select value={typeOfCompany} onValueChange={setTypeOfCompany}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">&nbsp;</SelectItem>
                    <SelectItem value="Consultant">Consultant</SelectItem>
                    <SelectItem value="Contractor">Contractor</SelectItem>
                    <SelectItem value="Supplier">Supplier</SelectItem>
                    <SelectItem value="Owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-primary">Spec section</Label>
                <Select value={specSection} onValueChange={setSpecSection}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">&nbsp;</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-primary">Division</Label>
                <Select value={division} onValueChange={setDivision}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">&nbsp;</SelectItem>
                    <SelectItem value="Concrete">Concrete</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-primary">Trade</Label>
                <Input
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-primary">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs mt-1 min-h-[60px]"
                />
              </div>

              <div>
                <Label className="text-xs text-primary">Information supplied by</Label>
                <Input
                  value={infoSuppliedBy}
                  onChange={(e) => setInfoSuppliedBy(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-primary">Date</Label>
                <div className="relative mt-1">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-8 text-xs pr-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-primary">Title</Label>
                <Select value={title} onValueChange={setTitle}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">&nbsp;</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-primary">Alias ID</Label>
                <Input
                  value={aliasId}
                  onChange={(e) => setAliasId(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-primary">Alias system</Label>
                <Input
                  value={aliasSystem}
                  onChange={(e) => setAliasSystem(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function CrewsTab({
  crews,
  selectedCrewIds,
  allSelected,
  onToggleAll,
  onToggleOne,
}: {
  crews: Crew[];
  selectedCrewIds: Set<string>;
  allSelected: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
}) {
  const [crewProjects, setCrewProjects] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    crews.forEach((c) => { initial[c.id] = c.projectIds; });
    return initial;
  });

  const handleToggleProject = (crewId: string, projectId: string) => {
    setCrewProjects((prev) => {
      const current = prev[crewId] || [];
      const next = current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId];
      return { ...prev, [crewId]: next };
    });
  };

  const handleResetProjects = (crewId: string) => {
    setCrewProjects((prev) => ({ ...prev, [crewId]: [] }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-sm font-medium">Crews</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
            <Plus className="h-3.5 w-3.5" />
            ADD
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
            <Trash2 className="h-3.5 w-3.5" />
            REMOVE
          </Button>
        </div>
      </div>

      {/* Crew grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background border-b border-border">
            <tr>
              <th className="w-8 px-2 py-2">
                <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
              </th>
              <th className="text-left px-3 py-2 font-medium">Name *</th>
              <th className="text-left px-3 py-2 font-medium w-10">&nbsp;</th>
              <th className="text-center px-3 py-2 font-medium">Default</th>
              <th className="text-left px-3 py-2 font-medium">Projects</th>
              <th className="text-left px-3 py-2 font-medium">Start time</th>
              <th className="text-left px-3 py-2 font-medium">Finish time</th>
              <th className="text-right px-3 py-2 font-medium">Break hour</th>
              <th className="text-right px-3 py-2 font-medium">Workers</th>
            </tr>
          </thead>
          <tbody>
            {crews.map((crew) => (
              <tr
                key={crew.id}
                className="border-b border-border hover:bg-accent/50 transition-colors"
              >
                <td className="px-2 py-1.5">
                  <Checkbox
                    checked={selectedCrewIds.has(crew.id)}
                    onCheckedChange={() => onToggleOne(crew.id)}
                  />
                </td>
                <td className="px-3 py-1.5 text-foreground">{crew.name}</td>
                <td className="px-3 py-1.5">&nbsp;</td>
                <td className="px-3 py-1.5 text-center">
                  <Checkbox checked={crew.isDefault} disabled />
                </td>
                <td className="px-3 py-1.5">
                  <ProjectMultiSelect
                    selectedIds={crewProjects[crew.id] || []}
                    onToggle={(projectId) => handleToggleProject(crew.id, projectId)}
                    onReset={() => handleResetProjects(crew.id)}
                  />
                </td>
                <td className="px-3 py-1.5 text-foreground">{crew.startTime}</td>
                <td className="px-3 py-1.5 text-foreground">{crew.finishTime}</td>
                <td className="px-3 py-1.5 text-right text-foreground">
                  {crew.breakHour.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right text-foreground">{crew.workers}</td>
              </tr>
            ))}
            {crews.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No crews defined
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

