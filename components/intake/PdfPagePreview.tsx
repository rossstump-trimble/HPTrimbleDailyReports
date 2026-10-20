"use client";

import { Document, Page, pdfjs } from "react-pdf";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

interface PdfPagePreviewProps {
  fileUrl: string;
  page: number;
  width: number;
  onPageCount: (count: number) => void;
}

export default function PdfPagePreview({
  fileUrl,
  page,
  width,
  onPageCount,
}: PdfPagePreviewProps) {
  return (
    <Document
      file={fileUrl}
      onLoadSuccess={({ numPages }) => onPageCount(numPages)}
      loading={
        <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading PDF…</p>
      }
      error={
        <p className="p-6 text-center text-sm text-red-600 dark:text-red-400">
          Could not preview this PDF. The OCR text is still on the right.
        </p>
      }
    >
      <Page
        pageNumber={page}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
      />
    </Document>
  );
}
