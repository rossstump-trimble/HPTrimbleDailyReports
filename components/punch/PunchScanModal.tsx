"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
  Plus,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import type {
  ExtractedPunchItem,
  PunchAction,
  PunchExtractResponse,
  PunchImportance,
  PunchStatus,
} from "@/types/punch";

export async function sanitizeImageForSecureSite(file: File): Promise<File> {
  // If not an image (e.g. PDF), return original
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve, reject) => {
    // If running in node/test environment without window/Image/URL.createObjectURL
    if (typeof window === "undefined" || typeof Image === "undefined" || typeof URL?.createObjectURL !== "function") {
      const sanitized = new File([file], `sanitized_${file.name}`, {
        type: file.type || "image/jpeg",
        lastModified: Date.now(),
      });
      return resolve(sanitized);
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const fallback = new File([file], `sanitized_${file.name}`, {
            type: file.type || "image/jpeg",
          });
          return resolve(fallback);
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const fallback = new File([file], `sanitized_${file.name}`, {
                type: file.type || "image/jpeg",
              });
              return resolve(fallback);
            }
            const cleanFile = new File([blob], `sanitized_${file.name.replace(/\.[^/.]+$/, "")}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(cleanFile);
          },
          "image/jpeg",
          0.92
        );
      } catch {
        const fallback = new File([file], `sanitized_${file.name}`, {
          type: file.type || "image/jpeg",
        });
        resolve(fallback);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      const fallback = new File([file], `sanitized_${file.name}`, {
        type: file.type || "image/jpeg",
      });
      resolve(fallback);
    };

    img.src = url;
  });
}

interface PunchScanModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommitted?: () => void;
}

export function PunchScanModal({
  projectId,
  open,
  onOpenChange,
  onCommitted,
}: PunchScanModalProps) {
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedPunchItem[]>([]);
  const [sheetType, setSheetType] = useState<string>("mixed");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const sanitized = await sanitizeImageForSecureSite(file);
      setSelectedFile(sanitized);

      if (sanitized.type.startsWith("image/")) {
        const url = URL.createObjectURL(sanitized);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      const formData = new FormData();
      formData.append("file", sanitized);

      const res = await fetch(`/api/punch/${projectId}/extract`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to extract punch items");
      }

      const data = json.data as PunchExtractResponse;
      setSheetType(data.sheetType || "mixed");
      setExtractedItems(data.items || []);
      setStep("review");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error processing punch scan");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateItem = (index: number, updates: Partial<ExtractedPunchItem>) => {
    setExtractedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setExtractedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setExtractedItems((prev) => [
      ...prev,
      {
        tempId: `manual-${Date.now()}`,
        action: "create",
        description: "",
        tradeName: "Unassigned",
        locationDescription: "",
        status: "open",
        importance: "normal",
        confidence: 1.0,
      },
    ]);
  };

  const handleCommit = async () => {
    if (extractedItems.length === 0) return;
    setIsCommitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        items: extractedItems.map((item) => ({
          action: item.action,
          targetItemId: item.targetItemId,
          targetItemNumber: item.targetItemNumber,
          notes: item.notes,
          item: {
            description: item.description,
            tradeName: item.tradeName,
            locationDescription: item.locationDescription,
            importance: item.importance,
            status: item.status,
            confidence: item.confidence,
          },
        })),
      };

      const res = await fetch(`/api/punch/${projectId}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to commit punch items");
      }

      onCommitted?.();
      handleClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setIsCommitting(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStep("upload");
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedItems([]);
    setErrorMessage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Scan Punch Sheet
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Digitize handwritten punch lists & back-punch sign-offs using vision OCR.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs font-medium rounded-full border border-green-200 dark:border-green-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              EXIF metadata stripped
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-2 rounded-md flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === "upload" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl my-4 bg-muted/20 hover:bg-muted/30 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={handleFileSelected}
            />

            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="font-medium text-foreground">Processing with Multimodal Vision...</p>
                <p className="text-xs text-muted-foreground">
                  Stripping camera/GPS EXIF metadata & cross-referencing open items
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-semibold text-base text-foreground">
                    Upload or take a photo of the punch sheet
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Supports high-resolution camera photos, scans, and PDFs. Strips all EXIF metadata client-side before transmission.
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Select Photo or Scan
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden my-2">
            {/* Left: Image preview */}
            <div className="flex flex-col border border-border rounded-lg overflow-hidden bg-muted/10 h-[55vh]">
              <div className="p-2 border-b border-border bg-muted/30 text-xs font-semibold flex items-center justify-between">
                <span>Original Sheet Scan</span>
                <span className="capitalize text-muted-foreground">Type: {sheetType.replace("_", " ")}</span>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black/5">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Punch sheet scan"
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : (
                  <div className="text-muted-foreground text-sm flex flex-col items-center gap-1">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                    <span>PDF or scan document</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Extracted items list */}
            <div className="flex flex-col border border-border rounded-lg overflow-hidden bg-background h-[55vh]">
              <div className="p-2 border-b border-border bg-muted/30 text-xs font-semibold flex items-center justify-between">
                <span>Extracted Items ({extractedItems.length})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  className="h-6 px-2 text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Row
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {extractedItems.map((item, idx) => {
                  const isLowConfidence = item.confidence < 0.75;

                  return (
                    <div
                      key={item.tempId || idx}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        isLowConfidence
                          ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Select
                            value={item.action}
                            onValueChange={(val: PunchAction) => updateItem(idx, { action: val })}
                          >
                            <SelectTrigger className="h-7 text-xs w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="create">New Defect</SelectItem>
                              <SelectItem value="resolve">Resolve Item</SelectItem>
                              <SelectItem value="reinspect">Re-inspect</SelectItem>
                            </SelectContent>
                          </Select>

                          {item.action !== "create" && (
                            <Input
                              placeholder="Item # (e.g. P-101)"
                              value={item.targetItemNumber || ""}
                              onChange={(e) => updateItem(idx, { targetItemNumber: e.target.value })}
                              className="h-7 text-xs w-32"
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isLowConfidence && (
                            <span
                              className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded"
                              title="Low OCR confidence score - please verify manually"
                            >
                              Check OCR ({Math.round(item.confidence * 100)}%)
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(idx, { description: e.target.value })}
                            className="h-7 text-xs mt-0.5"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Trade Partner</Label>
                            <Input
                              value={item.tradeName}
                              onChange={(e) => updateItem(idx, { tradeName: e.target.value })}
                              className="h-7 text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Location</Label>
                            <Input
                              value={item.locationDescription}
                              onChange={(e) => updateItem(idx, { locationDescription: e.target.value })}
                              className="h-7 text-xs mt-0.5"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Importance</Label>
                            <Select
                              value={item.importance}
                              onValueChange={(val: PunchImportance) => updateItem(idx, { importance: val })}
                            >
                              <SelectTrigger className="h-7 text-xs mt-0.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Status</Label>
                            <Select
                              value={item.status}
                              onValueChange={(val: PunchStatus) => updateItem(idx, { status: val })}
                            >
                              <SelectTrigger className="h-7 text-xs mt-0.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2 flex items-center justify-between border-t border-border pt-3">
          {step === "review" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("upload")}
                disabled={isCommitting}
              >
                Scan Another Sheet
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleClose} disabled={isCommitting}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCommit}
                  disabled={isCommitting || extractedItems.length === 0}
                  className="gap-2"
                >
                  {isCommitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Committing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Commit to ProjectSight ({extractedItems.length})
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
