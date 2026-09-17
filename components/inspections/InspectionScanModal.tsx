"use client";

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Loader2, AlertCircle, FileText } from 'lucide-react';
import type { InspectionExtractionResult } from '@/types/inspections';

interface InspectionScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onScanComplete: (result: InspectionExtractionResult, previewUrl: string) => void;
}

export function InspectionScanModal({
  isOpen,
  onClose,
  projectId,
  onScanComplete,
}: InspectionScanModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/inspections/${projectId}/extract`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to extract inspection sheet');
      }

      onScanComplete(json.data, json.previewUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process sheet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Scan Inspection Sheet
          </DialogTitle>
          <DialogDescription>
            Capture a photo or upload a completed paper inspection checklist to automatically transcribe checkboxes and notes.
          </DialogDescription>
        </DialogHeader>

        {/* Hidden inputs: upload vs camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 bg-muted/20">
          {isProcessing ? (
            <div className="flex flex-col items-center text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="font-semibold text-sm">Transcribing Inspection Sheet...</div>
              <p className="text-xs text-muted-foreground max-w-xs">
                Gemini Vision is matching checkboxes (Pass/Fail/N/A) and transcribing handwritten notes against project checklist definitions.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4 w-full">
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <Button
                  variant="outline"
                  className="min-h-[44px] flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" /> Upload Scan / Photo
                </Button>
                <Button
                  variant="secondary"
                  className="min-h-[44px] flex-1 gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" /> Open Camera
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, and camera photos.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 min-w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
