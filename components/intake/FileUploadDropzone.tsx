"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, FileSpreadsheet, Image as ImageIcon, Loader2, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

const ACCEPTED_EXTENSIONS = ".xlsx,.xls,.jpg,.jpeg,.png,.webp,.heic,.pdf";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploadDropzoneProps {
  onFilesSelected?: (files: File[]) => void;
  onFileSelected?: (file: File) => void;
  isLoading?: boolean;
  className?: string;
}

export default function FileUploadDropzone({
  onFilesSelected,
  onFileSelected,
  isLoading = false,
  className,
}: FileUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Generate and cleanup object URLs for image thumbnails
  const previewUrls = useMemo(() => {
    return stagedFiles.map((file) => {
      if (file.type.startsWith("image/")) {
        return URL.createObjectURL(file);
      }
      return null;
    });
  }, [stagedFiles]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    setError(null);
    const filesArray = Array.from(incoming);
    const validFiles: File[] = [];
    const invalidNames: string[] = [];

    for (const f of filesArray) {
      const valid =
        ACCEPTED_TYPES.includes(f.type) ||
        /\.(xlsx|xls|jpg|jpeg|png|webp|heic|pdf)$/i.test(f.name);
      if (valid) {
        validFiles.push(f);
      } else {
        invalidNames.push(f.name);
      }
    }

    if (invalidNames.length > 0) {
      setError(`Unsupported file: ${invalidNames.join(", ")}. Please use images, PDFs, or Excel files.`);
    }

    if (validFiles.length > 0) {
      setStagedFiles((prev) => [...prev, ...validFiles]);
    }
  }, []);

  const removeFile = useCallback((indexToRemove: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  }, []);

  const clearAll = useCallback(() => {
    setStagedFiles([]);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleProcess = useCallback(() => {
    if (stagedFiles.length === 0) return;
    if (onFilesSelected) {
      onFilesSelected(stagedFiles);
    } else if (onFileSelected) {
      onFileSelected(stagedFiles[0]);
    }
  }, [onFilesSelected, onFileSelected, stagedFiles]);

  return (
    <div className={cn("w-full", className)}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700 px-6 py-12 text-center">
          <Loader2 size={40} className="animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Analyzing {stagedFiles.length > 1 ? `${stagedFiles.length} pages / photos` : "report"} with Gemini 3.7 Flash…
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400">
            Multimodal OCR scanning text, tables, crew, and notes. This usually takes 5–15 seconds.
          </p>
        </div>
      )}

      {/* Drop zone & staged files (hidden when loading) */}
      {!isLoading && (
        <>
          {stagedFiles.length === 0 ? (
            /* Empty State: Dropzone */
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload daily report files"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer",
                dragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800",
              )}
            >
              <div className="flex-none rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-4">
                <Upload size={32} className="text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
                  Drop your daily report photos or files here
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  or tap to take photos or browse
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Select multiple photos, scans, PDFs, or Excel sheets
                </p>
              </div>
            </div>
          ) : (
            /* Staged Files Preview List */
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-xs font-bold text-[#0063a3] dark:text-blue-400">
                    {stagedFiles.length}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {stagedFiles.length === 1 ? "1 photo/file ready" : `${stagedFiles.length} photos/files ready`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={13} /> Clear all
                </button>
              </div>

              {/* Grid of staged items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {stagedFiles.map((file, idx) => {
                  const preview = previewUrls[idx];
                  const isImage = file.type.startsWith("image/");
                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-950 relative group"
                    >
                      <div className="h-14 w-14 rounded-lg overflow-hidden flex-none bg-gray-200 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt={file.name} className="h-full w-full object-cover" />
                        ) : isImage ? (
                          <ImageIcon size={22} className="text-blue-500" />
                        ) : file.name.endsWith(".xlsx") || file.name.endsWith(".xls") ? (
                          <FileSpreadsheet size={22} className="text-emerald-500" />
                        ) : (
                          <Upload size={22} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="inline-block text-[10px] font-bold text-[#0063a3] dark:text-blue-400 uppercase tracking-wider">
                          Page / Photo {idx + 1}
                        </span>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove file ${file.name}`}
                        onClick={() => removeFile(idx)}
                        className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Main Process Button */}
              <button
                type="button"
                onClick={handleProcess}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: "#0063a3" }}
              >
                <Sparkles size={16} />
                Process OCR ({stagedFiles.length} {stagedFiles.length === 1 ? "File" : "Files"})
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <X size={12} /> {error}
            </p>
          )}

          {/* Action buttons row */}
          <div className="mt-3 flex gap-2">
            {/* Camera / take photo */}
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Camera size={16} className="text-[#0063a3] dark:text-blue-400" />
              {stagedFiles.length > 0 ? "Take another photo" : "Take photo"}
            </button>

            {/* File browser */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              {stagedFiles.length > 0 ? <Plus size={16} /> : <Upload size={16} />}
              {stagedFiles.length > 0 ? "Add more files" : "Browse files"}
            </button>
          </div>

          {/* Hidden file inputs: multiple enabled */}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            className="sr-only"
            onChange={handleInputChange}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleInputChange}
          />
        </>
      )}
    </div>
  );
}
