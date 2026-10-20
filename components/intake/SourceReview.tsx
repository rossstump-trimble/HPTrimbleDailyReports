"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SourcePageText } from "@/lib/extract-response";
import { sourcePageTextFor, sourcePreviewKind } from "@/lib/source-preview";

const PdfPagePreview = dynamic(() => import("@/components/intake/PdfPagePreview"), {
  ssr: false,
  loading: () => (
    <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading PDF…</p>
  ),
});

interface SourceReviewProps {
  file: File | null;
  files?: File[];
  pages: SourcePageText[];
}

export default function SourceReview({ file, files, pages }: SourceReviewProps) {
  const activeFiles = useMemo(() => {
    if (files && files.length > 0) return files;
    if (file) return [file];
    return [];
  }, [file, files]);

  const [page, setPage] = useState(1);
  const [pdfPageCount, setPdfPageCount] = useState(1);
  const [previewWidth, setPreviewWidth] = useState(360);
  const previewRef = useRef<HTMLDivElement>(null);

  const fileUrls = useMemo(() => {
    return activeFiles.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      kind: sourcePreviewKind(f),
    }));
  }, [activeFiles]);

  useEffect(() => {
    return () => {
      fileUrls.forEach((entry) => URL.revokeObjectURL(entry.url));
    };
  }, [fileUrls]);

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    const update = () => setPreviewWidth(Math.max(240, Math.floor(node.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const activeEntry = fileUrls[page - 1] || fileUrls[0] || null;
  const kind = activeEntry?.kind ?? "none";
  const fileUrl = activeEntry?.url ?? null;
  const currentFileName = activeEntry?.file.name ?? "";

  const pageCount = Math.max(
    activeFiles.length,
    kind === "pdf" ? pdfPageCount : 1,
    pages.reduce((max, entry) => Math.max(max, entry.page), 1),
  );
  const ocrText = sourcePageTextFor(pages, page);
  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div className="space-y-3">
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!canPrev}
            className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Prev page
          </button>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Page {page} of {pageCount} {currentFileName ? `(${currentFileName})` : ""}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={!canNext}
            className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          >
            Next page
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div
          ref={previewRef}
          className="overflow-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950"
        >
          {(() => {
            switch (kind) {
              case "image":
                return fileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- blob preview of the uploaded page
                  <img
                    src={fileUrl}
                    alt={currentFileName || "Uploaded daily report"}
                    className="mx-auto max-h-[70vh] w-full object-contain"
                  />
                ) : null;
              case "pdf":
                return fileUrl ? (
                  <div className="flex justify-center p-2">
                    <PdfPagePreview
                      fileUrl={fileUrl}
                      page={page}
                      width={previewWidth - 16}
                      onPageCount={setPdfPageCount}
                    />
                  </div>
                ) : null;
              case "text":
                return (
                  <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    Spreadsheets do not have a page image. The extracted cell text is on the right.
                  </p>
                );
              case "none":
                return (
                  <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    Original file is not available to preview.
                  </p>
                );
              default: {
                const _exhaustive: never = kind;
                return _exhaustive;
              }
            }
          })()}
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[240px]">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400">
              Extracted OCR text
              {pageCount > 1 ? ` · page ${page}` : ""}
            </h3>
          </div>
          <pre className="flex-1 overflow-auto px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-sans">
            {ocrText.trim() || "No OCR text for this page."}
          </pre>
        </div>
      </div>
    </div>
  );
}
