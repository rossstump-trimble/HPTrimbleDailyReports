import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Plus,
  Upload,
  Library,
  Link2,
  CheckCircle2,
  Trash2,
  Info,
  Loader2,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
  FileUp,
  FileText,
  X,
  Folder,
  FolderOpen,
  Search,
  CalendarRange,
} from "lucide-react";
import { toast } from "sonner";
import { parseP6XER } from "./ImportExportDialog";
import type { Activity, Dependency } from "@/hooks/useActivities";
import { WESTMINSTER_XER } from "@/data/mockScheduleData";

export type ScheduleSource = "manual" | "import" | "file-library" | "trimble-scheduling" | null;

type Step = "home" | "import" | "file-library" | "trimble-scheduling" | "confirm-clear";

interface ScheduleSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Activity[];
  dependencies: Dependency[];
  projectName?: string;
  scheduleSource: ScheduleSource;
  sourceDetail: string | null;
  onScheduleSourceChange: (source: ScheduleSource, detail?: string | null) => void;
  onImportComplete?: (
    activities: Partial<Activity>[],
    dependencies: Partial<Dependency>[]
  ) => Promise<void> | void;
  onClearSchedule?: () => Promise<void> | void;
}

// ── Source options for home screen ──

interface SourceOption {
  id: ScheduleSource;
  step?: Step;
  label: string;
  description: string;
  icon: React.ReactNode;
  linked?: boolean;
}

const SOURCE_OPTIONS: SourceOption[] = [
  { id: "manual", label: "Manually Create Activities", description: "Build your schedule by adding activities one at a time.", icon: <Plus className="h-5 w-5" /> },
  { id: "import", step: "import", label: "Import Schedule File", description: "Upload a file from your computer (.xer, .mpp, .xml, .xlsx).", icon: <Upload className="h-5 w-5" /> },
  { id: "file-library", step: "file-library", label: "Link to File Library", description: "Select a schedule from the project's File Library.", icon: <Library className="h-5 w-5" />, linked: true },
  { id: "trimble-scheduling", step: "trimble-scheduling", label: "Link to Trimble Scheduling", description: "Connect to a Trimble Scheduling project.", icon: <Link2 className="h-5 w-5" />, linked: true },
];

// ── File Library data ──

interface LibraryFile { name: string; size: string; modified: string; type: string; content?: string }
interface LibraryFolder { name: string; files: LibraryFile[] }

const LIBRARY_FOLDERS: LibraryFolder[] = [
  { name: "Schedules", files: [{ name: "Westminster_Office_Campus_2026-03-01.xer", size: "4.2 KB", modified: "Mar 1, 2026", type: "xer", content: WESTMINSTER_XER }] },
  { name: "Drawings", files: [{ name: "A-101_Floor_Plan_Level_1.pdf", size: "2.4 MB", modified: "Feb 15, 2026", type: "pdf" }, { name: "A-201_Exterior_Elevations.pdf", size: "1.8 MB", modified: "Feb 15, 2026", type: "pdf" }, { name: "S-100_Foundation_Plan.pdf", size: "3.1 MB", modified: "Feb 10, 2026", type: "pdf" }] },
  { name: "Submittals", files: [{ name: "Structural_Steel_Shop_Drawings.pdf", size: "12.5 MB", modified: "Feb 20, 2026", type: "pdf" }, { name: "Curtain_Wall_Samples.pdf", size: "8.3 MB", modified: "Feb 18, 2026", type: "pdf" }] },
  { name: "RFIs", files: [{ name: "RFI-001_Foundation_Depth.pdf", size: "340 KB", modified: "Jan 22, 2026", type: "pdf" }, { name: "RFI-002_Steel_Connection_Detail.pdf", size: "520 KB", modified: "Feb 5, 2026", type: "pdf" }] },
  { name: "Specifications", files: [{ name: "Division_03_Concrete.pdf", size: "1.1 MB", modified: "Jan 10, 2026", type: "pdf" }, { name: "Division_05_Metals.pdf", size: "890 KB", modified: "Jan 10, 2026", type: "pdf" }] },
  { name: "Reports", files: [{ name: "Monthly_Progress_Report_Feb_2026.xlsx", size: "2.1 MB", modified: "Feb 28, 2026", type: "xlsx" }, { name: "Safety_Inspection_Log.xlsx", size: "450 KB", modified: "Feb 25, 2026", type: "xlsx" }] },
];

const FILE_TYPE_LABELS: Record<string, string> = { xer: "Primavera P6", mpp: "MS Project", xml: "XML", xlsx: "Excel", pdf: "PDF" };

// ── Trimble Scheduling data ──

interface TrimbleProject { id: string; name: string; owner: string; activities: number; lastUpdated: string; status: "active" | "complete" | "on-hold" }

const MOCK_PROJECTS: TrimbleProject[] = [
  { id: "ts-001", name: "Westminster Office Campus", owner: "Meridian Builders", activities: 60, lastUpdated: "Mar 1, 2026", status: "active" },
  { id: "ts-002", name: "Harbor View Residential Tower", owner: "Coastal Development Group", activities: 124, lastUpdated: "Feb 27, 2026", status: "active" },
  { id: "ts-003", name: "Eastgate Distribution Center", owner: "Summit Logistics Partners", activities: 87, lastUpdated: "Feb 25, 2026", status: "active" },
  { id: "ts-004", name: "Riverfront Mixed-Use Development", owner: "Urban Core Ventures", activities: 210, lastUpdated: "Feb 20, 2026", status: "on-hold" },
  { id: "ts-005", name: "Northpark Medical Pavilion", owner: "HealthBridge Construction", activities: 95, lastUpdated: "Feb 18, 2026", status: "active" },
  { id: "ts-006", name: "Oakwood Elementary Renovation", owner: "CivicBuild Inc.", activities: 42, lastUpdated: "Jan 30, 2026", status: "complete" },
  { id: "ts-007", name: "Central Avenue Bridge Replacement", owner: "Atlas Infrastructure", activities: 68, lastUpdated: "Feb 12, 2026", status: "active" },
  { id: "ts-008", name: "Greenfield Solar Farm Phase 2", owner: "Apex Energy Solutions", activities: 53, lastUpdated: "Feb 8, 2026", status: "active" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  complete: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "on-hold": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

// ── Format detection for import ──

type ImportFormat = "p6" | "msp" | "xml" | "xlsx";

function detectFormat(filename: string): ImportFormat | null {
  const ext = "." + filename.split(".").pop()?.toLowerCase();
  if (ext === ".xer") return "p6";
  if (ext === ".mpp") return "msp";
  if (ext === ".xlsx") return "xlsx";
  if (ext === ".xml") return "xml";
  return null;
}

const FORMAT_LABELS: Record<ImportFormat, string> = { p6: "Primavera P6", msp: "Microsoft Project", xml: "XML", xlsx: "Excel" };

function getAllImportExtensions() { return ".xer,.mpp,.xml,.xlsx"; }

// ── Result type ──

interface ActionResult {
  success: boolean;
  message: string;
  details?: string[];
}

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function ScheduleSettingsDialog({
  open,
  onOpenChange,
  activities,
  dependencies,
  projectName,
  scheduleSource,
  sourceDetail,
  onScheduleSourceChange,
  onImportComplete,
  onClearSchedule,
}: ScheduleSettingsDialogProps) {
  const [step, setStep] = useState<Step>("home");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  // Import step state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<ImportFormat>("p6");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Library step state
  const [libFolder, setLibFolder] = useState<LibraryFolder | null>(null);
  const [libFile, setLibFile] = useState<LibraryFile | null>(null);

  // Trimble Scheduling step state
  const [tsSearch, setTsSearch] = useState("");
  const [tsStatusFilter, setTsStatusFilter] = useState("all");
  const [tsSelected, setTsSelected] = useState<TrimbleProject | null>(null);

  // Clear state
  const [clearing, setClearing] = useState(false);

  const hasData = activities.length > 0 || dependencies.length > 0;

  useEffect(() => {
    if (open) {
      setStep("home");
      setProcessing(false);
      setResult(null);
      setImportFile(null);
      setLibFolder(null);
      setLibFile(null);
      setTsSearch("");
      setTsStatusFilter("all");
      setTsSelected(MOCK_PROJECTS.find((p) => p.id === "ts-001") ?? null);
      setClearing(false);
    }
  }, [open]);

  const filteredProjects = useMemo(() => {
    let results = MOCK_PROJECTS;
    if (tsStatusFilter !== "all") results = results.filter((p) => p.status === tsStatusFilter);
    if (tsSearch.trim()) {
      const q = tsSearch.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q));
    }
    return results;
  }, [tsSearch, tsStatusFilter]);

  const goHome = () => {
    setStep("home");
    setProcessing(false);
    setImportFile(null);
    setLibFolder(null);
    setLibFile(null);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setResult(null);
    }
    onOpenChange(newOpen);
  };

  // ── Actions ──

  const handleImport = async () => {
    if (!importFile) return;
    setProcessing(true);
    try {
      const text = await importFile.text();
      let parsed: { activities: Partial<Activity>[]; dependencies: Partial<Dependency>[] };
      if (importFormat === "p6") parsed = parseP6XER(text);
      else throw new Error("Only P6 XER files are supported for import in this demo.");

      if (parsed.activities.length === 0) throw new Error("No activities found in the file.");
      await onImportComplete?.(parsed.activities, parsed.dependencies);
      onScheduleSourceChange("import", importFile.name);
      setResult({ success: true, message: `Imported ${importFile.name}`, details: [`Format: ${FORMAT_LABELS[importFormat]}`, `Activities: ${parsed.activities.length}`, `Dependencies: ${parsed.dependencies.length}`] });
      setStep("home");
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Import failed" });
      setStep("home");
    } finally {
      setProcessing(false);
    }
  };

  const handleFileLibrary = async () => {
    if (!libFile?.content) return;
    setProcessing(true);
    try {
      const parsed = parseP6XER(libFile.content);
      if (parsed.activities.length === 0) throw new Error("No activities found.");
      await onImportComplete?.(parsed.activities, parsed.dependencies);
      onScheduleSourceChange("file-library", libFile.name);
      setResult({ success: true, message: `Linked to ${libFile.name}`, details: [`Activities: ${parsed.activities.length}`, `Dependencies: ${parsed.dependencies.length}`] });
      setStep("home");
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Failed to load schedule" });
      setStep("home");
    } finally {
      setProcessing(false);
    }
  };

  const handleTrimbleLink = async () => {
    if (!tsSelected) return;
    setProcessing(true);
    try {
      const parsed = parseP6XER(WESTMINSTER_XER);
      if (parsed.activities.length === 0) throw new Error("No activities found.");
      await onImportComplete?.(parsed.activities, parsed.dependencies);
      onScheduleSourceChange("trimble-scheduling", tsSelected.name);
      setResult({ success: true, message: `Linked to ${tsSelected.name}`, details: [`Activities: ${parsed.activities.length}`, `Dependencies: ${parsed.dependencies.length}`] });
      setStep("home");
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Failed to link project" });
      setStep("home");
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await onClearSchedule?.();
      onScheduleSourceChange(null, null);
      setResult({ success: true, message: "Schedule cleared" });
      setStep("home");
    } catch (err: any) {
      toast.error(err.message || "Failed to clear schedule");
    } finally {
      setClearing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const fmt = detectFormat(selected.name);
    if (!fmt) { toast.error("Unsupported file type. Supported: .xer, .mpp, .xml, .xlsx"); return; }
    setImportFormat(fmt);
    setImportFile(selected);
  };

  // ── Render helpers ──

  const backButton = (
    <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={goHome}>
      <ChevronLeft className="h-4 w-4" />
      Back
    </button>
  );

  const replaceWarning = hasData && (
    <Alert variant="destructive">
      <TriangleAlert className="h-4 w-4" />
      <AlertDescription>
        This will replace the current schedule ({activities.length} activities, {dependencies.length} dependencies). This action cannot be undone.
      </AlertDescription>
    </Alert>
  );

  const linkNote = (
    <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2">
      <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground">
        Linked schedules automatically receive updates when the source changes.
      </p>
    </div>
  );

  // ════════════════════════════════════════
  // Steps
  // ════════════════════════════════════════

  const renderHome = () => (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Schedule Settings
        </DialogTitle>
        <DialogDescription>
          Choose how this schedule is populated and managed.
        </DialogDescription>
      </DialogHeader>

      {result && (
        <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${result.success ? "bg-green-50 dark:bg-green-900/20" : "bg-destructive/10"}`}>
          <CheckCircle2 className={`h-4 w-4 shrink-0 ${result.success ? "text-green-600 dark:text-green-400" : "text-destructive"}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${result.success ? "text-green-700 dark:text-green-300" : "text-destructive"}`}>{result.message}</p>
            {result.details && (
              <p className="text-xs text-muted-foreground mt-0.5">{result.details.join(" · ")}</p>
            )}
          </div>
          <button className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => setResult(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Schedule Source</p>
          <div className="grid gap-1.5">
            {SOURCE_OPTIONS.map((option) => {
              const isCurrent = scheduleSource === option.id;
              return (
                <button
                  key={option.id}
                  className={`flex items-start gap-3 w-full rounded-md px-3 py-3 text-left transition-colors ${isCurrent ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-accent"}`}
                  onClick={() => {
                    if (option.step) { setResult(null); setStep(option.step); }
                    else { onScheduleSourceChange("manual", null); toast.success("Schedule source set to manual"); }
                  }}
                >
                  <div className={`shrink-0 mt-0.5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{option.label}</p>
                      {isCurrent && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    {isCurrent && sourceDetail && (
                      <p className="text-xs text-primary mt-1 truncate">
                        {(option.id === "trimble-scheduling" ? "Project: " : "File: ") + sourceDetail}
                      </p>
                    )}
                    {option.linked && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                        <p className="text-[11px] text-muted-foreground">Linked schedules automatically receive updates when the source changes.</p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      <DialogFooter className="sm:justify-between">
        {hasData ? (
          <Button variant="destructiveOutline" onClick={() => setStep("confirm-clear")}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Schedule
          </Button>
        ) : <div />}
        <Button variant="outline" onClick={() => handleClose(false)}>Close</Button>
      </DialogFooter>
    </>
  );

  const renderImport = () => (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Import Schedule File
        </DialogTitle>
        <DialogDescription>
          Upload a schedule file from your computer.
        </DialogDescription>
      </DialogHeader>

      {processing ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Parsing file...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <input ref={fileInputRef} type="file" accept={getAllImportExtensions()} onChange={handleFileSelect} className="hidden" />
          {!importFile ? (
            <Card className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
              <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
                <FileUp className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to select a file</p>
                  <p className="text-xs text-muted-foreground mt-1">Primavera P6 (.xer), Microsoft Project (.mpp, .xml), Excel (.xlsx)</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{importFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB &middot; {FORMAT_LABELS[importFormat]}</p>
                </div>
                <Button variant="ghost2" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
          {importFile && replaceWarning}
        </div>
      )}

      <DialogFooter className="sm:justify-between">
        <Button variant="outline" onClick={goHome}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
        {importFile && !processing && (
          <Button className={hasData ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0" : ""} onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />{hasData ? "Replace Schedule" : "Import"}
          </Button>
        )}
      </DialogFooter>
    </>
  );

  const renderFileLibrary = () => (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading flex items-center gap-2">
          <Library className="h-5 w-5 text-primary" />
          File Library
        </DialogTitle>
        <DialogDescription>
          Browse project files to select a schedule.
        </DialogDescription>
      </DialogHeader>

      {linkNote}

      {processing ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading schedule...</p>
        </div>
      ) : !libFolder ? (
        <div className="grid gap-1 max-h-[300px] overflow-y-auto -mx-1 px-1">
          {LIBRARY_FOLDERS.map((folder) => (
            <button key={folder.name} className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-left hover:bg-accent transition-colors" onClick={() => { setLibFolder(folder); setLibFile(null); }}>
              <Folder className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{folder.name}</p>
                <p className="text-xs text-muted-foreground">{folder.files.length} {folder.files.length === 1 ? "file" : "files"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => { setLibFolder(null); setLibFile(null); }}>
            <ChevronLeft className="h-4 w-4" />Back to folders
          </button>
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium">{libFolder.name}</p>
          </div>
          <div className="grid gap-1 max-h-[220px] overflow-y-auto -mx-1 px-1">
            {libFolder.files.map((file) => {
              const isSelected = libFile?.name === file.name;
              const isImportable = file.type === "xer" && !!file.content;
              return (
                <button key={file.name} className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-left transition-colors ${isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-accent"} ${!isImportable ? "opacity-50" : ""}`} onClick={() => isImportable && setLibFile(file)} disabled={!isImportable} title={!isImportable ? "Only schedule files (.xer) can be imported" : undefined}>
                  <FileText className={`h-5 w-5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size} &middot; {FILE_TYPE_LABELS[file.type] || file.type.toUpperCase()} &middot; {file.modified}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {libFile && replaceWarning}
        </div>
      )}

      <DialogFooter className="sm:justify-between">
        <Button variant="outline" onClick={goHome}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
        {libFile?.content && !processing && (
          <Button className={hasData ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0" : ""} onClick={handleFileLibrary}>
            {hasData ? "Replace Schedule" : "Load Schedule"}
          </Button>
        )}
      </DialogFooter>
    </>
  );

  const renderTrimbleScheduling = () => (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Trimble Scheduling
        </DialogTitle>
        <DialogDescription>
          Select a project to link and import its schedule.
        </DialogDescription>
      </DialogHeader>

      {linkNote}

      {processing ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Linking project and loading schedule...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0 rounded-md border border-input bg-background px-3 h-10 focus-within:outline-none">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input type="search" placeholder="Search projects..." value={tsSearch} onChange={(e) => setTsSearch(e.target.value)} className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <Select value={tsStatusFilter} onValueChange={setTsStatusFilter}>
              <SelectTrigger className="w-[120px] shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1 max-h-[240px] overflow-y-auto -mx-1 px-1">
            {filteredProjects.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">No projects match your search.</p>
              </div>
            ) : filteredProjects.map((project) => {
              const isSelected = tsSelected?.id === project.id;
              return (
                <button key={project.id} className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-left transition-colors ${isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-accent"}`} onClick={() => setTsSelected(project)}>
                  <CalendarRange className={`h-5 w-5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{project.owner} &middot; {project.activities} activities &middot; Updated {project.lastUpdated}</p>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] shrink-0 ${STATUS_STYLES[project.status] || ""}`}>
                    {project.status === "on-hold" ? "On Hold" : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                </button>
              );
            })}
          </div>

          {tsSelected && replaceWarning}
        </div>
      )}

      <DialogFooter className="sm:justify-between">
        <Button variant="outline" onClick={goHome}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
        {tsSelected && !processing && (
          <Button className={hasData ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0" : ""} onClick={handleTrimbleLink}>
            {hasData ? "Replace & Link" : "Link Project"}
          </Button>
        )}
      </DialogFooter>
    </>
  );

  const renderConfirmClear = () => (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading flex items-center gap-2">
          <TriangleAlert className="h-5 w-5 text-destructive" />
          Clear Schedule
        </DialogTitle>
        <DialogDescription>
          This will permanently delete all {activities.length} activities and {dependencies.length} dependencies. This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      {clearing ? (
        <div className="flex items-center justify-center py-4 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Clearing schedule...</p>
        </div>
      ) : (
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={goHome}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
          <Button variant="destructiveOutline" onClick={handleClear}><Trash2 className="h-4 w-4 mr-2" />Clear All</Button>
        </DialogFooter>
      )}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {step === "home" && renderHome()}
        {step === "import" && renderImport()}
        {step === "file-library" && renderFileLibrary()}
        {step === "trimble-scheduling" && renderTrimbleScheduling()}
        {step === "confirm-clear" && renderConfirmClear()}
      </DialogContent>
    </Dialog>
  );
}
