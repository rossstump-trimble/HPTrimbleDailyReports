"use client";

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  Loader2,
  Send,
  Eye,
} from 'lucide-react';
import type {
  ExtractedInspectionItem,
  InspectionExtractionResult,
  InspectionItemResult,
  InspectionRecord,
} from '@/types/inspections';

interface InspectionVerifyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  extraction: InspectionExtractionResult | null;
  previewUrl?: string | null;
  previewUrls?: string[] | null;
  targetInspectionId?: string;
  inspections: InspectionRecord[];
  onCommitSuccess: (committed: InspectionRecord) => void;
}

export function InspectionVerifyDrawer({
  isOpen,
  onClose,
  projectId,
  extraction,
  previewUrl,
  previewUrls,
  targetInspectionId,
  inspections,
  onCommitSuccess,
}: InspectionVerifyDrawerProps) {
  const [items, setItems] = useState<ExtractedInspectionItem[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>('');
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const urls = (previewUrls && previewUrls.length > 0)
    ? previewUrls
    : (previewUrl ? [previewUrl] : []);

  // Sync state when extraction changes
  React.useEffect(() => {
    setActivePageIndex(0);
    if (extraction) {
      setItems(extraction.items || []);

      if (targetInspectionId) {
        setSelectedInspectionId(targetInspectionId);
        return;
      }

      // Attempt to match with existing inspection
      let matched = inspections.find(
        (ins) =>
          ins.id === extraction.checklistGuid ||
          ins.psRecordId === extraction.checklistGuid ||
          (extraction.checklistNumber &&
            ins.number.toLowerCase() === extraction.checklistNumber.toLowerCase()),
      );
      if (!matched && inspections.length > 0) {
        matched = inspections[0];
      }
      if (matched) {
        setSelectedInspectionId(matched.id);
      }
    }
  }, [extraction, inspections, targetInspectionId]);

  if (!extraction) return null;

  const updateItemResult = (index: number, result: InspectionItemResult) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], result, needsReview: false };
      return next;
    });
  };

  const updateItemComment = (index: number, comment: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], comment };
      return next;
    });
  };

  const handleCommit = async () => {
    if (!selectedInspectionId) {
      setCommitError('Please select a target inspection record');
      return;
    }

    setIsCommitting(true);
    setCommitError(null);

    try {
      const target = inspections.find((ins) => ins.id === selectedInspectionId);
      const payload = {
        status: 'approved',
        items: items.map((it, idx) => ({
          id: target?.items[idx]?.id || `item-${it.itemNumber}`,
          itemNumber: it.itemNumber,
          prompt: it.prompt,
          result: it.result,
          comment: it.comment,
        })),
        sheetImageBase64: urls[0] || previewUrl || undefined,
        imageFileName: `${extraction.checklistNumber || 'inspection'}_scan.jpg`,
      };

      const res = await fetch(
        `/api/inspections/${projectId}/${selectedInspectionId}/commit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to commit inspection');
      }

      onCommitSuccess(json.inspection);
      onClose();
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : 'Failed to commit inspection');
    } finally {
      setIsCommitting(false);
    }
  };

  const reviewNeededCount = items.filter((it) => it.needsReview).length;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && !isCommitting && onClose()}>
      <SheetContent className="sm:max-w-4xl w-full flex flex-col h-full overflow-hidden p-0">
        <SheetHeader className="p-6 border-b shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                {extraction.checklistNumber || 'CK-SCAN'}
              </span>
              <span className="text-xs text-muted-foreground">
                Confidence: {Math.round(extraction.overallConfidence * 100)}%
              </span>
            </div>
            {reviewNeededCount > 0 ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {reviewNeededCount} needs review
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                All verified
              </Badge>
            )}
          </div>
          <SheetTitle className="text-xl font-bold">
            Verify Inspection: {extraction.title || 'Checklist Scan'}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Review the extracted results side-by-side with your physical sheet image, adjust marks if needed, and confirm.
          </SheetDescription>
        </SheetHeader>

        {/* Split container */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
          {/* Left: Scanned Sheet Image Preview */}
          <div className="h-full overflow-y-auto p-4 bg-muted/20 flex flex-col items-center justify-start">
            {urls.length > 0 ? (
              <div className="w-full flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> Scanned Physical Form {urls.length > 1 ? `(${urls.length} Pages)` : ''}
                  </div>
                  {urls.length > 1 && (
                    <div className="flex items-center gap-1">
                      {urls.map((_, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
                            activePageIndex === pIdx
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          }`}
                          onClick={() => setActivePageIndex(pIdx)}
                        >
                          Page {pIdx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urls[activePageIndex] || urls[0]}
                  alt={`Scanned Inspection Sheet Page ${activePageIndex + 1}`}
                  className="rounded-lg shadow-md border max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground my-auto">
                No preview image available
              </div>
            )}
          </div>

          {/* Right: Editable Extracted Checklist */}
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Target ProjectSight Checklist Record</span>
                {targetInspectionId && (
                  <Badge variant="outline" className="text-[10px]">Pre-associated</Badge>
                )}
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedInspectionId}
                disabled={Boolean(targetInspectionId)}
                onChange={(e) => setSelectedInspectionId(e.target.value)}
              >
                {inspections.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.number} — {ins.title} ({ins.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Checklist Items ({items.length})
              </div>

              {items.map((item, idx) => (
                <div
                  key={item.itemNumber || idx}
                  className={`p-3 rounded-lg border text-sm space-y-2 transition-colors ${
                    item.needsReview
                      ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-muted-foreground">
                      #{item.itemNumber}
                    </span>
                    {item.needsReview && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                        <AlertTriangle className="h-3 w-3" /> Needs Review
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-xs sm:text-sm">{item.prompt}</p>

                  {/* Toggle buttons - compliant mobile touch targets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={item.result === 'Pass' ? 'default' : 'outline'}
                      className={`min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-8 flex-1 gap-1 text-xs ${
                        item.result === 'Pass'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : ''
                      }`}
                      onClick={() => updateItemResult(idx, 'Pass')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={item.result === 'Fail' ? 'default' : 'outline'}
                      className={`min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-8 flex-1 gap-1 text-xs ${
                        item.result === 'Fail'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : ''
                      }`}
                      onClick={() => updateItemResult(idx, 'Fail')}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Fail
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={item.result === 'N/A' ? 'default' : 'outline'}
                      className={`min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-8 flex-1 gap-1 text-xs ${
                        item.result === 'N/A'
                          ? 'bg-slate-700 hover:bg-slate-800 text-white'
                          : ''
                      }`}
                      onClick={() => updateItemResult(idx, 'N/A')}
                    >
                      <MinusCircle className="h-3.5 w-3.5" /> N/A
                    </Button>
                  </div>

                  {/* Comment field */}
                  <Input
                    placeholder="Handwritten observation or note..."
                    value={item.comment || ''}
                    onChange={(e) => updateItemComment(idx, e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="p-4 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          {commitError && (
            <div className="text-xs text-rose-600 font-medium">{commitError}</div>
          )}
          <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCommitting}
              className="min-h-[44px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommit}
              disabled={isCommitting || !selectedInspectionId}
              className="min-h-[44px] sm:min-h-0 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Pushing to ProjectSight...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Confirm & Push to ProjectSight
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
