import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Download,
  FileUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  TriangleAlert,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Activity, Dependency } from "@/hooks/useActivities";

export type ImportExportFormat = "p6" | "msp" | "xml" | "xlsx";
export type ImportExportMode = "import" | "export";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ImportExportMode;
  activities: Activity[];
  dependencies: Dependency[];
  projectName?: string;
  onImportComplete?: (activities: Partial<Activity>[], dependencies: Partial<Dependency>[], sourceDetail?: string) => Promise<void> | void;
}

const FORMAT_OPTIONS: { value: ImportExportFormat; label: string; importExtensions: string[]; exportExtension: string }[] = [
  { value: "p6", label: "Primavera P6", importExtensions: [".xer", ".xml"], exportExtension: ".xer" },
  { value: "msp", label: "Microsoft Project", importExtensions: [".mpp", ".xml"], exportExtension: ".xml" },
  { value: "xml", label: "XML", importExtensions: [".xml"], exportExtension: ".xml" },
  { value: "xlsx", label: "Excel (.xlsx)", importExtensions: [".xlsx"], exportExtension: ".xlsx" },
];

function getFormatOption(fmt: ImportExportFormat) {
  return FORMAT_OPTIONS.find((f) => f.value === fmt)!;
}

function getAllImportExtensions(): string {
  const exts = new Set<string>();
  FORMAT_OPTIONS.forEach((f) => f.importExtensions.forEach((e) => exts.add(e)));
  return Array.from(exts).join(",");
}

export function ImportExportDialog({
  open,
  onOpenChange,
  mode,
  activities,
  dependencies,
  projectName,
  onImportComplete,
}: ImportExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ImportExportFormat>("p6");
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImport = mode === "import";
  const fmt = getFormatOption(selectedFormat);
  const hasExistingData = activities.length > 0 || dependencies.length > 0;

  const detectFormat = (filename: string): ImportExportFormat | null => {
    const ext = "." + filename.split(".").pop()?.toLowerCase();
    if (ext === ".xer") return "p6";
    if (ext === ".mpp") return "msp";
    if (ext === ".xlsx") return "xlsx";
    if (ext === ".xml") return "xml";
    return null;
  };

  const detectedFormatLabel = file ? getFormatOption(detectFormat(file.name) || "xml").label : null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const detected = detectFormat(selected.name);
    if (!detected) {
      toast.error("Unsupported file type. Supported formats: .xer, .mpp, .xml, .xlsx");
      return;
    }

    setSelectedFormat(detected);
    setFile(selected);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setProcessing(true);
    setResult(null);

    try {
      const text = await file.text();
      let parsed: { activities: Partial<Activity>[]; dependencies: Partial<Dependency>[] };

      if (selectedFormat === "p6") {
        parsed = parseP6XER(text);
      } else if (selectedFormat === "msp" || selectedFormat === "xml") {
        parsed = parseMSPXML(text);
      } else if (selectedFormat === "xlsx") {
        parsed = parseCSV(text);
      } else {
        throw new Error("Unsupported format");
      }

      if (parsed.activities.length === 0) {
        throw new Error("No activities found in the file. Please check the file format.");
      }

      await onImportComplete?.(parsed.activities, parsed.dependencies, file.name);

      setResult({
        success: true,
        message: `Successfully imported ${file.name}`,
        details: [
          `Format: ${fmt.label}`,
          `Activities: ${parsed.activities.length}`,
          `Dependencies: ${parsed.dependencies.length}`,
        ],
      });
      toast.success(`Imported ${parsed.activities.length} activities from ${fmt.label}`);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Import failed",
      });
      toast.error(err.message || "Import failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async () => {
    setProcessing(true);
    setResult(null);

    try {
      await new Promise((r) => setTimeout(r, 1200));

      const timestamp = format(new Date(), "yyyy-MM-dd");
      const safeName = (projectName || "schedule").replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${safeName}_${timestamp}${fmt.exportExtension}`;

      let blob: Blob;
      if (selectedFormat === "p6") {
        const content = generateP6XER(activities, dependencies, projectName);
        blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
      } else if (selectedFormat === "xlsx") {
        const content = generateXLSXCSV(activities, dependencies);
        blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      } else {
        const content = generateMSPXML(activities, dependencies, projectName, selectedFormat === "xml");
        blob = new Blob([content], { type: "text/xml;charset=utf-8;" });
      }
      const link = document.createElement("a");
      link.setAttribute("href", URL.createObjectURL(blob));
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setResult({
        success: true,
        message: `Exported to ${filename}`,
        details: [
          `Format: ${fmt.label}`,
          `Activities: ${activities.filter((a) => a.start_date).length}`,
          `Summary tasks: ${activities.filter((a) => !a.start_date).length}`,
          `Dependencies: ${dependencies.length}`,
        ],
      });
      toast.success(`Schedule exported as ${fmt.label}`);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Export failed",
      });
      toast.error("Export failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setFile(null);
      setResult(null);
      setProcessing(false);
      setSelectedFormat("p6");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            {isImport ? <Upload className="h-5 w-5 text-primary" /> : <Download className="h-5 w-5 text-primary" />}
            {isImport ? "Import Schedule" : "Export Schedule"}
          </DialogTitle>
          <DialogDescription>
            {isImport
              ? "Upload a schedule file to import activities and dependencies."
              : "Export the current schedule to your preferred format."}
          </DialogDescription>
        </DialogHeader>

        {!processing && !result && isImport && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={getAllImportExtensions()}
              onChange={handleFileSelect}
              className="hidden"
            />

            {!file ? (
              <Card
                className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
                  <FileUp className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to select a file</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Primavera P6 (.xer), Microsoft Project (.mpp, .xml), Excel (.xlsx)
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="flex items-center gap-3 py-4">
                    <FileText className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB &middot; Detected as {detectedFormatLabel}
                      </p>
                    </div>
                    <Button
                      variant="ghost2"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                {hasExistingData && (
                  <Alert variant="destructive">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertDescription>
                      This will replace the current schedule ({activities.length} activities, {dependencies.length} dependencies). This action cannot be undone.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        )}

        {!processing && !result && !isImport && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Format</label>
            <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as ImportExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {projectName || "Schedule"} &middot; {format(new Date(), "MMM d, yyyy")}
            </p>
          </div>
        )}

        {processing && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isImport ? "Parsing file..." : "Generating export..."}
            </p>
          </div>
        )}

        {result && (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            {result.success ? (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            )}
            <p className={`text-sm font-medium ${result.success ? "text-green-600" : "text-destructive"}`}>
              {result.message}
            </p>
            {result.details && (
              <div className="space-y-1 text-center">
                {result.details.map((d, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{d}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && !processing && (
            <Button
              className={isImport && hasExistingData && file ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0" : ""}
              onClick={isImport ? handleImport : handleExport}
              disabled={isImport && !file}
            >
              {isImport ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {hasExistingData ? "Replace Schedule" : "Import"}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function generateP6XER(activities: Activity[], dependencies: Dependency[], projectName?: string): string {
  const lines: string[] = [];
  const idToUid = new Map<string, number>();
  activities.forEach((a, idx) => { idToUid.set(a.id, idx + 1); });

  lines.push("ERMHDR\t3.0\t" + format(new Date(), "yyyy-MM-dd"));
  lines.push("");
  lines.push("%T\tPROJECT");
  lines.push("%F\tproj_id\tproj_short_name");
  lines.push(`%R\t1\t${projectName || "Schedule"}`);
  lines.push("");

  // WBS for folder activities
  const folders = activities.filter((a) => !a.start_date);
  if (folders.length > 0) {
    lines.push("%T\tPROJWBS");
    lines.push("%F\twbs_id\tproj_id\tobs_id\tseq_num\twbs_short_name\twbs_name\tparent_wbs_id");
    lines.push(`%R\t0\t1\t\t0\tROOT\t${projectName || "Schedule"}\t`);
    folders.forEach((a) => {
      const uid = idToUid.get(a.id)!;
      const parentWbs = a.parent_id ? idToUid.get(a.parent_id) || 0 : 0;
      lines.push(`%R\t${uid}\t1\t\t${uid}\t${a.id.substring(0, 8)}\t${a.name}\t${parentWbs}`);
    });
    lines.push("");
  }

  lines.push("%T\tTASK");
  lines.push("%F\ttask_id\twbs_id\ttask_code\ttask_name\ttarget_start_date\ttarget_end_date\ttarget_drtn_hr_cnt\tphys_complete_pct\ttask_type");

  activities.forEach((a) => {
    const uid = idToUid.get(a.id)!;
    const isFolder = !a.start_date;
    const wbsId = isFolder ? uid : (a.parent_id ? idToUid.get(a.parent_id) || 0 : 0);
    lines.push(
      `%R\t${uid}\t${wbsId}\t${a.id.substring(0, 8)}\t${a.name}\t${a.start_date || ""}\t${a.end_date || ""}\t${(a.duration || 0) * 8}\t${a.progress || 0}\t${isFolder ? "TT_WBS" : "TT_Task"}`
    );
  });

  lines.push("");
  lines.push("%T\tTASKPRED");
  lines.push("%F\ttask_pred_id\ttask_id\tpred_task_id\tpred_type\tlag_hr_cnt");

  dependencies.forEach((d, idx) => {
    const succUid = idToUid.get(d.successor_id);
    const predUid = idToUid.get(d.predecessor_id);
    if (succUid && predUid) {
      lines.push(`%R\t${idx + 1}\t${succUid}\t${predUid}\tPR_${d.type || "FS"}\t${(d.lag || 0) * 8}`);
    }
  });

  lines.push("");
  lines.push("%E");
  return lines.join("\n");
}

function generateMSPXML(activities: Activity[], dependencies: Dependency[], projectName?: string, genericXml = false): string {
  const indent = (n: number) => "  ".repeat(n);
  const lines: string[] = [];
  const namespace = genericXml ? "http://schemas.projectsight.trimble.com/schedule" : "http://schemas.microsoft.com/project";

  const activityMap = new Map<string, number>();
  activities.forEach((a, idx) => { activityMap.set(a.id, idx + 1); });

  // Compute outline levels
  const depthOf = (a: Activity): number => {
    if (!a.parent_id) return 1;
    const parent = activities.find((p) => p.id === a.parent_id);
    return parent ? depthOf(parent) + 1 : 1;
  };

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<Project xmlns="${namespace}">`);
  lines.push(`${indent(1)}<Name>${escapeXml(projectName || "Schedule")}</Name>`);
  lines.push(`${indent(1)}<CreationDate>${new Date().toISOString()}</CreationDate>`);
  lines.push(`${indent(1)}<Tasks>`);

  activities.forEach((a, idx) => {
    const uid = idx + 1;
    const isFolder = !a.start_date;
    const outlineLevel = depthOf(a);
    lines.push(`${indent(2)}<Task>`);
    lines.push(`${indent(3)}<UID>${uid}</UID>`);
    lines.push(`${indent(3)}<Name>${escapeXml(a.name)}</Name>`);
    lines.push(`${indent(3)}<OutlineLevel>${outlineLevel}</OutlineLevel>`);
    if (a.parent_id) {
      const parentUid = activityMap.get(a.parent_id);
      if (parentUid) lines.push(`${indent(3)}<ParentUID>${parentUid}</ParentUID>`);
    }
    if (isFolder) {
      lines.push(`${indent(3)}<Summary>1</Summary>`);
    } else {
      lines.push(`${indent(3)}<Start>${a.start_date}T08:00:00</Start>`);
      if (a.end_date) lines.push(`${indent(3)}<Finish>${a.end_date}T17:00:00</Finish>`);
      lines.push(`${indent(3)}<Duration>PT${(a.duration || 0) * 8}H0M0S</Duration>`);
      lines.push(`${indent(3)}<PercentComplete>${a.progress || 0}</PercentComplete>`);
    }
    lines.push(`${indent(2)}</Task>`);
  });

  lines.push(`${indent(1)}</Tasks>`);

  const depTypes: Record<string, number> = { FS: 1, FF: 0, SS: 2, SF: 3 };

  if (dependencies.length > 0) {
    lines.push(`${indent(1)}<Links>`);
    dependencies.forEach((d) => {
      const predUid = activityMap.get(d.predecessor_id);
      const succUid = activityMap.get(d.successor_id);
      if (predUid && succUid) {
        lines.push(`${indent(2)}<Link>`);
        lines.push(`${indent(3)}<PredecessorUID>${predUid}</PredecessorUID>`);
        lines.push(`${indent(3)}<SuccessorUID>${succUid}</SuccessorUID>`);
        lines.push(`${indent(3)}<Type>${depTypes[d.type || "FS"] ?? 1}</Type>`);
        if (d.lag) lines.push(`${indent(3)}<LinkLag>${d.lag * 4800}</LinkLag>`);
        lines.push(`${indent(2)}</Link>`);
      }
    });
    lines.push(`${indent(1)}</Links>`);
  }

  lines.push("</Project>");
  return lines.join("\n");
}

function generateXLSXCSV(activities: Activity[], dependencies: Dependency[]): string {
  const headers = ["Row", "Name", "Type", "Start Date", "End Date", "Duration (days)", "Progress (%)", "Parent Row", "Predecessors"];
  const idToRow = new Map<string, number>();
  activities.forEach((a, idx) => { idToRow.set(a.id, idx + 1); });

  const depMap = new Map<string, string[]>();
  dependencies.forEach((d) => {
    const predRow = idToRow.get(d.predecessor_id);
    if (!predRow) return;
    const list = depMap.get(d.successor_id) || [];
    list.push(`${predRow}${d.type ? " " + d.type : ""}${d.lag ? " +" + d.lag + "d" : ""}`);
    depMap.set(d.successor_id, list);
  });

  const rows = activities.map((a, idx) => {
    const isFolder = !a.start_date;
    const parentRow = a.parent_id ? idToRow.get(a.parent_id) || "" : "";
    return [
      idx + 1,
      `"${a.name.replace(/"/g, '""')}"`,
      isFolder ? "Folder" : "Activity",
      a.start_date || "",
      a.end_date || "",
      a.duration?.toString() || "",
      a.progress?.toString() || "0",
      parentRow,
      `"${(depMap.get(a.id) || []).join("; ")}"`,
    ];
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function stripTime(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  return dateStr.split(" ")[0] || null;
}

export function parseP6XER(text: string): { activities: Partial<Activity>[]; dependencies: Partial<Dependency>[] } {
  const lines = text.split("\n").map((l) => l.trimEnd());

  let currentTable = "";
  let fields: string[] = [];

  // First pass: collect WBS entries and tasks
  const wbsEntries: { wbsId: string; name: string; parentWbsId: string }[] = [];
  const taskRows: { taskId: string; wbsId: string; name: string; startDate: string | null; endDate: string | null; durationHrs: number; progress: number }[] = [];
  const rawDeps: { predTaskId: string; succTaskId: string; type: string; lag: number }[] = [];

  for (const line of lines) {
    if (line.startsWith("%T")) {
      currentTable = line.split("\t")[1]?.trim() || "";
      fields = [];
    } else if (line.startsWith("%F")) {
      fields = line.split("\t").slice(1).map((f) => f.trim());
    } else if (line.startsWith("%R")) {
      const values = line.split("\t").slice(1);
      const row: Record<string, string> = {};
      fields.forEach((f, i) => { row[f] = values[i]?.trim() || ""; });

      if (currentTable === "PROJWBS") {
        const name = row.wbs_name || row.wbs_short_name;
        if (name && row.proj_node_flag !== "Y") {
          wbsEntries.push({
            wbsId: row.wbs_id || "",
            name,
            parentWbsId: row.parent_wbs_id || "",
          });
        }
      } else if (currentTable === "TASK") {
        const name = row.task_name;
        if (!name) continue;
        taskRows.push({
          taskId: row.task_id || "",
          wbsId: row.wbs_id || "",
          name,
          startDate: stripTime(row.target_start_date || row.early_start_date || row.act_start_date),
          endDate: stripTime(row.target_end_date || row.early_end_date || row.act_end_date),
          durationHrs: parseInt(row.target_drtn_hr_cnt || row.remain_drtn_hr_cnt || "0") || 0,
          progress: parseInt(row.phys_complete_pct || "0") || 0,
        });
      } else if (currentTable === "TASKPRED") {
        const rawType = (row.pred_type || "PR_FS").replace(/^PR_/, "");
        rawDeps.push({
          predTaskId: row.pred_task_id || "",
          succTaskId: row.task_id || "",
          type: rawType,
          lag: Math.round((parseInt(row.lag_hr_cnt || "0") || 0) / 8),
        });
      }
    }
  }

  // Flatten WBS: only create folders for leaf WBS nodes that directly contain tasks
  const wbsMap = new Map(wbsEntries.map((w) => [w.wbsId, w]));
  const leafWbsIds = new Set<string>();
  taskRows.forEach((t) => leafWbsIds.add(t.wbsId));

  // Build a full path name for each leaf WBS for context (e.g. "ENGINEERING > Structural")
  const wbsPathName = (wbsId: string): string => {
    const parts: string[] = [];
    let current = wbsId;
    while (current && wbsMap.has(current)) {
      parts.unshift(wbsMap.get(current)!.name);
      current = wbsMap.get(current)!.parentWbsId;
    }
    // Use just the leaf name if it's descriptive enough, or last 2 levels for context
    return parts.length <= 2 ? parts.join(" > ") : parts.slice(-2).join(" > ");
  };

  // Build final activity list: leaf WBS folders (top-level) then tasks nested under them
  const activities: Partial<Activity>[] = [];
  const wbsIdToIndex = new Map<string, number>();

  for (const wbsId of Array.from(leafWbsIds)) {
    wbsIdToIndex.set(wbsId, activities.length);
    activities.push({
      name: wbsPathName(wbsId),
      start_date: null,
      end_date: null,
      duration: 1,
      progress: 0,
      is_milestone: false,
    });
  }

  // Add task activities under their leaf WBS folder
  const taskIdToIndex = new Map<string, number>();
  for (const t of taskRows) {
    const parentIdx = wbsIdToIndex.get(t.wbsId);
    taskIdToIndex.set(t.taskId, activities.length);
    activities.push({
      name: t.name,
      start_date: t.startDate,
      end_date: t.endDate,
      duration: Math.max(Math.round(t.durationHrs / 8), 1),
      progress: t.progress,
      is_milestone: t.durationHrs === 0 && !!t.startDate,
      parent_id: parentIdx !== undefined ? String(parentIdx) : undefined,
    });
  }

  const dependencies: Partial<Dependency>[] = rawDeps
    .filter((d) => taskIdToIndex.has(d.predTaskId) && taskIdToIndex.has(d.succTaskId))
    .map((d) => ({
      predecessor_id: String(taskIdToIndex.get(d.predTaskId)),
      successor_id: String(taskIdToIndex.get(d.succTaskId)),
      type: d.type,
      lag: d.lag,
    }));

  return { activities, dependencies };
}

function parseMSPXML(text: string): { activities: Partial<Activity>[]; dependencies: Partial<Dependency>[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");
  const activities: Partial<Activity>[] = [];
  const dependencies: Partial<Dependency>[] = [];

  const tasks = doc.querySelectorAll("Task");
  const uidToIndex = new Map<string, number>();

  tasks.forEach((task) => {
    const uid = task.querySelector("UID")?.textContent || "";
    const name = task.querySelector("Name")?.textContent || "";
    if (!name) return;

    uidToIndex.set(uid, activities.length);
    const start = task.querySelector("Start")?.textContent?.split("T")[0] || null;
    const finish = task.querySelector("Finish")?.textContent?.split("T")[0] || null;
    const isSummary = task.querySelector("Summary")?.textContent === "1";
    const durationStr = task.querySelector("Duration")?.textContent || "";
    const pctStr = task.querySelector("PercentComplete")?.textContent || "0";

    let duration = 1;
    const ptMatch = durationStr.match(/PT(\d+)H/);
    if (ptMatch) duration = Math.max(Math.round(parseInt(ptMatch[1]) / 8), 1);

    const parentUid = task.querySelector("ParentUID")?.textContent || "";
    const parentIdx = parentUid ? uidToIndex.get(parentUid) : undefined;

    activities.push({
      name,
      start_date: isSummary ? null : start,
      end_date: isSummary ? null : finish,
      duration,
      progress: parseInt(pctStr) || 0,
      is_milestone: duration === 0 && !!start,
      parent_id: parentIdx !== undefined ? String(parentIdx) : undefined,
    });
  });

  const links = doc.querySelectorAll("Link");
  const depTypeMap: Record<string, string> = { "0": "FF", "1": "FS", "2": "SS", "3": "SF" };
  links.forEach((link) => {
    const predUid = link.querySelector("PredecessorUID")?.textContent || "";
    const succUid = link.querySelector("SuccessorUID")?.textContent || "";
    const typeCode = link.querySelector("Type")?.textContent || "1";
    const lagTenths = parseInt(link.querySelector("LinkLag")?.textContent || "0") || 0;

    const predIdx = uidToIndex.get(predUid);
    const succIdx = uidToIndex.get(succUid);
    if (predIdx !== undefined && succIdx !== undefined) {
      dependencies.push({
        predecessor_id: String(predIdx),
        successor_id: String(succIdx),
        type: depTypeMap[typeCode] || "FS",
        lag: Math.round(lagTenths / 4800),
      });
    }
  });

  return { activities, dependencies };
}

function parseCSV(text: string): { activities: Partial<Activity>[]; dependencies: Partial<Dependency>[] } {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) throw new Error("File appears to be empty or has no data rows.");

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const activities: Partial<Activity>[] = [];

  const col = (row: string[], name: string) => {
    const idx = headers.findIndex((h) => h.includes(name));
    return idx >= 0 ? row[idx]?.replace(/^["']|["']$/g, "").trim() : "";
  };

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const name = col(values, "name") || col(values, "task");
    if (!name) continue;

    const startDate = col(values, "start") || null;
    const endDate = col(values, "end") || col(values, "finish") || null;
    const duration = parseInt(col(values, "duration")) || 5;
    const progress = parseInt(col(values, "progress") || col(values, "percent") || col(values, "complete")) || 0;
    const type = col(values, "type").toLowerCase();
    const parentRow = col(values, "parent row") || col(values, "parent");
    const isFolder = type === "folder" || (!startDate && !endDate);

    const parentIdx = parentRow ? parseInt(parentRow) - 1 : undefined;

    activities.push({
      name,
      start_date: isFolder ? null : startDate,
      end_date: isFolder ? null : endDate,
      duration,
      progress,
      is_milestone: false,
      parent_id: parentIdx !== undefined && parentIdx >= 0 ? String(parentIdx) : undefined,
    });
  }

  return { activities, dependencies: [] };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
