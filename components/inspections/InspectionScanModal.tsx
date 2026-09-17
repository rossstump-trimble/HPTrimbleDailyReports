"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, Loader2, AlertCircle, FileText, Plus, X, Layers } from 'lucide-react';
import type { InspectionExtractionResult, InspectionRecord } from '@/types/inspections';

interface InspectionScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  inspections: InspectionRecord[];
  initialChecklistId?: string;
  onScanComplete: (
    result: InspectionExtractionResult,
    previewUrls: string[],
    targetChecklistId?: string,
  ) => void;
}

interface StagedFile {
  file: File;
  previewUrl: string;
}

export function InspectionScanModal({
  isOpen,
  onClose,
  projectId,
  inspections,
  initialChecklistId,
  onScanComplete,
}: InspectionScanModalProps) {
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialChecklistId) {
      setSelectedChecklistId(initialChecklistId);
    } else if (inspections.length > 0 && !selectedChecklistId) {
      setSelectedChecklistId(inspections[0].id);
    }
  }, [initialChecklistId, inspections, selectedChecklistId]);

  // Clean up object URLs on unmount or reset
  const cleanupPreviews = (files: StagedFile[]) => {
    files.forEach((f) => {
      try {
        URL.revokeObjectURL(f.previewUrl);
      } catch {
        // ignore
      }
    });
  };

  const handleClose = () => {
    if (isProcessing) return;
    cleanupPreviews(stagedFiles);
    setStagedFiles([]);
    setError(null);
    onClose();
  };

  const handleFilesAdded = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setError(null);

    const newStaged: StagedFile[] = Array.from(incomingFiles).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setStagedFiles((prev) => [...prev, ...newStaged]);
  };

  const handleRemovePage = (index: number) => {
    setStagedFiles((prev) => {
      const target = prev[index];
      if (target) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // ignore
        }
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleProcessAllPages = async () => {
    if (!selectedChecklistId) {
      setError('Please select a target ProjectSight checklist first.');
      return;
    }
    if (stagedFiles.length === 0) {
      setError('Please add at least one page image to transcribe.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('targetChecklistId', selectedChecklistId);
      stagedFiles.forEach((sf) => {
        formData.append('files', sf.file);
      });

      const res = await fetch(`/api/inspections/${projectId}/extract`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to extract inspection sheet');
      }

      const previewUrls: string[] = Array.isArray(json.previewUrls) && json.previewUrls.length > 0
        ? json.previewUrls
        : (json.previewUrl ? [json.previewUrl] : stagedFiles.map((s) => s.previewUrl));

      onScanComplete(json.data, previewUrls, selectedChecklistId);
      cleanupPreviews(stagedFiles);
      setStagedFiles([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process sheet');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedChecklist = inspections.find(
    (ins) => ins.id === selectedChecklistId || ins.psRecordId === selectedChecklistId,
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="h-5 w-5 text-primary" />
            Scan Inspection Sheet(s)
          </DialogTitle>
          <DialogDescription>
            Select the target checklist, then capture or upload 1 or more sequential physical pages to automatically transcribe all line items.
          </DialogDescription>
        </DialogHeader>

        {/* Hidden inputs: upload vs camera */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/*"
          className="hidden"
          onChange={(e) => {
            handleFilesAdded(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleFilesAdded(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Pre-Association Selector */}
          <div className="space-y-1.5 p-3 rounded-lg border bg-muted/40">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Target ProjectSight Checklist (Required)</span>
              {selectedChecklist && (
                <Badge variant="outline" className="text-[11px] font-mono">
                  {selectedChecklist.number}
                </Badge>
              )}
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedChecklistId}
              disabled={isProcessing}
              onChange={(e) => {
                setSelectedChecklistId(e.target.value);
                setError(null);
              }}
            >
              <option value="" disabled>-- Select Target Checklist --</option>
              {inspections.map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.number} — {ins.title} {ins.location ? `(${ins.location})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Staged Pages Thumbnail Tray */}
          {stagedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Staged Pages ({stagedFiles.length})
                </span>
                <span className="text-[11px]">Pages will be transcribed in sequence</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-muted/20 border rounded-xl">
                {stagedFiles.map((sf, idx) => (
                  <div
                    key={idx}
                    className="relative group border rounded-lg overflow-hidden bg-card shadow-sm flex flex-col"
                  >
                    <div className="relative aspect-[3/4] w-full bg-black/5 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sf.previewUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Badge
                        variant="secondary"
                        className="absolute top-1.5 left-1.5 text-[10px] font-bold shadow-sm bg-background/90 backdrop-blur-sm"
                      >
                        Page {idx + 1}
                      </Badge>
                      {!isProcessing && (
                        <button
                          type="button"
                          onClick={() => handleRemovePage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/90 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-sm transition-colors"
                          title="Remove page"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="p-1.5 text-[11px] truncate text-muted-foreground text-center">
                      {sf.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload / Capture Actions Box */}
          <div className="border-2 border-dashed rounded-xl p-5 bg-muted/10 flex flex-col items-center justify-center text-center space-y-3">
            {isProcessing ? (
              <div className="py-4 flex flex-col items-center space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="font-semibold text-sm">
                  Transcribing {stagedFiles.length} Page{stagedFiles.length > 1 ? 's' : ''}...
                </div>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Gemini Vision is correlating checkboxes and handwritten remarks across all pages in sequence against {selectedChecklist?.title || 'the checklist definition'}.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[42px] flex-1 gap-2"
                    disabled={!selectedChecklistId}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {stagedFiles.length > 0 ? (
                      <>
                        <Plus className="h-4 w-4" /> Add Page(s)
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" /> Choose Page Images
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-[42px] flex-1 gap-2"
                    disabled={!selectedChecklistId}
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" /> Take Photo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {!selectedChecklistId
                    ? 'Please select a target ProjectSight checklist above first.'
                    : stagedFiles.length === 0
                    ? 'Select all sheets for this checklist. You can upload multiple pages at once.'
                    : 'Add more pages or click Transcribe below when ready.'}
                </p>
              </>
            )}

            {error && (
              <div className="w-full mt-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t shrink-0 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isProcessing}
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            className="min-w-[140px] gap-2"
            disabled={isProcessing || stagedFiles.length === 0 || !selectedChecklistId}
            onClick={handleProcessAllPages}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Transcribing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Transcribe {stagedFiles.length > 0 ? `${stagedFiles.length} Page${stagedFiles.length > 1 ? 's' : ''}` : 'Pages'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
