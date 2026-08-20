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
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronLeft,
  Library,
  Loader2,
  TriangleAlert,
  Info,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { parseP6XER } from "./ImportExportDialog";
import type { Activity, Dependency } from "@/hooks/useActivities";
import { WESTMINSTER_XER } from "@/data/mockScheduleData";

interface FileLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Activity[];
  dependencies: Dependency[];
  onImportComplete?: (
    activities: Partial<Activity>[],
    dependencies: Partial<Dependency>[],
    sourceDetail?: string
  ) => Promise<void> | void;
}

interface LibraryFile {
  name: string;
  size: string;
  modified: string;
  type: "xer" | "mpp" | "xml" | "xlsx" | "pdf";
  content?: string;
}

interface LibraryFolder {
  name: string;
  icon: string;
  files: LibraryFile[];
}

const LIBRARY_FOLDERS: LibraryFolder[] = [
  {
    name: "Schedules",
    icon: "calendar",
    files: [
      {
        name: "Westminster_Office_Campus_2026-03-01.xer",
        size: "4.2 KB",
        modified: "Mar 1, 2026",
        type: "xer",
        content: WESTMINSTER_XER,
      },
    ],
  },
  {
    name: "Drawings",
    icon: "layers",
    files: [
      { name: "A-101_Floor_Plan_Level_1.pdf", size: "2.4 MB", modified: "Feb 15, 2026", type: "pdf" },
      { name: "A-201_Exterior_Elevations.pdf", size: "1.8 MB", modified: "Feb 15, 2026", type: "pdf" },
      { name: "S-100_Foundation_Plan.pdf", size: "3.1 MB", modified: "Feb 10, 2026", type: "pdf" },
    ],
  },
  {
    name: "Submittals",
    icon: "clipboard",
    files: [
      { name: "Structural_Steel_Shop_Drawings.pdf", size: "12.5 MB", modified: "Feb 20, 2026", type: "pdf" },
      { name: "Curtain_Wall_Samples.pdf", size: "8.3 MB", modified: "Feb 18, 2026", type: "pdf" },
    ],
  },
  {
    name: "RFIs",
    icon: "help-circle",
    files: [
      { name: "RFI-001_Foundation_Depth.pdf", size: "340 KB", modified: "Jan 22, 2026", type: "pdf" },
      { name: "RFI-002_Steel_Connection_Detail.pdf", size: "520 KB", modified: "Feb 5, 2026", type: "pdf" },
    ],
  },
  {
    name: "Specifications",
    icon: "book",
    files: [
      { name: "Division_03_Concrete.pdf", size: "1.1 MB", modified: "Jan 10, 2026", type: "pdf" },
      { name: "Division_05_Metals.pdf", size: "890 KB", modified: "Jan 10, 2026", type: "pdf" },
    ],
  },
  {
    name: "Reports",
    icon: "bar-chart",
    files: [
      { name: "Monthly_Progress_Report_Feb_2026.xlsx", size: "2.1 MB", modified: "Feb 28, 2026", type: "xlsx" },
      { name: "Safety_Inspection_Log.xlsx", size: "450 KB", modified: "Feb 25, 2026", type: "xlsx" },
    ],
  },
];

const FILE_TYPE_LABELS: Record<string, string> = {
  xer: "Primavera P6",
  mpp: "MS Project",
  xml: "XML",
  xlsx: "Excel",
  pdf: "PDF",
};

export function FileLibraryDialog({
  open,
  onOpenChange,
  activities,
  dependencies,
  onImportComplete,
}: FileLibraryDialogProps) {
  const [currentFolder, setCurrentFolder] = useState<LibraryFolder | null>(null);
  const [selectedFile, setSelectedFile] = useState<LibraryFile | null>(null);
  const [importing, setImporting] = useState(false);

  const hasExistingData = activities.length > 0 || dependencies.length > 0;

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setCurrentFolder(null);
      setSelectedFile(null);
      setImporting(false);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = async () => {
    if (!selectedFile?.content) return;
    setImporting(true);

    try {
      const parsed = parseP6XER(selectedFile.content);
      if (parsed.activities.length === 0) {
        throw new Error("No activities found in the selected file.");
      }
      await onImportComplete?.(parsed.activities, parsed.dependencies, selectedFile.name);
      toast.success(
        `Loaded ${parsed.activities.length} activities from ${selectedFile.name}`
      );
      handleClose(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to load schedule");
      setImporting(false);
    }
  };

  const canImportSelected =
    selectedFile?.type === "xer" && !!selectedFile.content;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            File Library
          </DialogTitle>
          <DialogDescription>
            Browse project files to import a schedule.
          </DialogDescription>
        </DialogHeader>

        {importing ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading schedule...</p>
          </div>
        ) : !currentFolder ? (
          <div className="grid gap-1 max-h-[360px] overflow-y-auto -mx-1 px-1">
            {LIBRARY_FOLDERS.map((folder) => (
              <button
                key={folder.name}
                className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-left hover:bg-accent transition-colors"
                onClick={() => {
                  setCurrentFolder(folder);
                  setSelectedFile(null);
                }}
              >
                <Folder className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{folder.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {folder.files.length}{" "}
                    {folder.files.length === 1 ? "file" : "files"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-1"
              onClick={() => {
                setCurrentFolder(null);
                setSelectedFile(null);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to folders
            </button>

            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">{currentFolder.name}</p>
            </div>

            <div className="grid gap-1 max-h-[280px] overflow-y-auto -mx-1 px-1">
              {currentFolder.files.map((file) => {
                const isSelected = selectedFile?.name === file.name;
                const isImportable = file.type === "xer" && !!file.content;
                return (
                  <button
                    key={file.name}
                    className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-accent"
                    } ${!isImportable ? "opacity-50" : ""}`}
                    onClick={() => isImportable && setSelectedFile(file)}
                    disabled={!isImportable}
                    title={
                      !isImportable
                        ? "Only schedule files (.xer) can be imported"
                        : undefined
                    }
                  >
                    <FileText
                      className={`h-5 w-5 shrink-0 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.size} &middot; {FILE_TYPE_LABELS[file.type] || file.type.toUpperCase()} &middot; {file.modified}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedFile && hasExistingData && (
              <Alert variant="destructive" className="mt-3">
                <TriangleAlert className="h-4 w-4" />
                <AlertDescription>
                  This will replace the current schedule ({activities.length}{" "}
                  activities, {dependencies.length} dependencies). This action
                  cannot be undone.
                </AlertDescription>
              </Alert>
            )}

            {selectedFile && (
              <div className="flex items-start gap-2 mt-3 px-1 py-2 rounded-md bg-muted/50">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  This project will be linked to the File Library and automatically receive schedule updates when the source file changes.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          {currentFolder && canImportSelected && !importing && (
            <Button
              className={
                hasExistingData
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0"
                  : ""
              }
              onClick={handleConfirm}
            >
              {hasExistingData ? "Replace Schedule" : "Load Schedule"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
