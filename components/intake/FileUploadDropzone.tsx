"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, FileSpreadsheet, Image, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const ACCEPTED_EXTENSIONS = ".xlsx,.xls,.jpg,.jpeg,.png,.pdf";

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return Image;
  if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) return FileSpreadsheet;
  return Upload;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploadDropzoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  className?: string;
}

export default function FileUploadDropzone({
  onFileSelected,
  isLoading = false,
  className,
}: FileUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);
      const valid =
        ACCEPTED_TYPES.includes(file.type) ||
        /\.(xlsx|xls|jpg|jpeg|png|pdf)$/i.test(file.name);
      if (!valid) {
        setError("Unsupported file type. Please upload .xlsx, .xls, .jpg, .jpeg, .png, or .pdf.");
        return;
      }
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
    e.target.value = "";
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile) : Upload;

  return (
    <div className={cn("w-full", className)}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700 px-6 py-12 text-center">
          <Loader2 size={40} className="animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Analyzing report with Gemini 3.7 Flash…
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400">This usually takes 5–15 seconds</p>
        </div>
      )}

      {/* Drop zone (hidden when loading) */}
      {!isLoading && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload daily report file"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !selectedFile && inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer",
              dragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            {selectedFile ? (
              /* Preview of selected file */
              <div className="flex w-full items-center gap-3 text-left">
                <div className="flex-none rounded-xl bg-blue-100 dark:bg-blue-900/40 p-3">
                  <FileIcon size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="flex-none p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              /* Empty state */
              <>
                <div className="flex-none rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-4">
                  <Upload size={32} className="text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    Drop your daily report here
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    or tap to browse files
                  </p>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    Supports .xlsx, .xls, .jpg, .png, .pdf
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <X size={12} /> {error}
            </p>
          )}

          {/* Action buttons row */}
          <div className="mt-3 flex gap-2">
            {/* File browser */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Upload size={16} />
              Browse files
            </button>

            {/* Camera / take photo */}
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Camera size={16} />
              Take photo
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={inputRef}
            type="file"
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
