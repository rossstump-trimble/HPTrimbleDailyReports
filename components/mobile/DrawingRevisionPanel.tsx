"use client";

import { ArrowLeft, CheckCircle2 } from "lucide-react";

export interface DrawingRevision {
  id: string;
  label: string;
  revDate: string;
  imageSrc?: string;
}

const MOCK_REVISIONS: DrawingRevision[] = [
  { id: "rev01", label: "Revision 01", revDate: "10/23/16", imageSrc: "/images/drawings/drawing-a.png" },
  { id: "rev00", label: "Revision 00", revDate: "08/15/16", imageSrc: "/images/drawings/drawing-b.png" },
];

interface DrawingRevisionPanelProps {
  currentRevisionId: string;
  onSelect: (rev: DrawingRevision) => void;
  onClose: () => void;
}

export default function DrawingRevisionPanel({
  currentRevisionId,
  onSelect,
  onClose,
}: DrawingRevisionPanelProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gray-100 dark:bg-gray-950">
      {/* Header */}
      <div
        className="flex-none flex items-center px-3 h-12 gap-2"
        style={{ background: "#1b3a5c" }}
      >
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="flex-1 text-base font-semibold text-white">
          Revisions
        </span>
        <span className="text-sm text-white/60 font-medium pr-1">
          {MOCK_REVISIONS.length}
        </span>
      </div>

      {/* Revision list */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-3">
        {MOCK_REVISIONS.map((rev) => {
          const isCurrent = rev.id === currentRevisionId;
          return (
            <button
              key={rev.id}
              onClick={() => onSelect(rev)}
              className="w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm flex items-stretch text-left hover:border-green-400 transition-colors"
              style={isCurrent ? { borderColor: "#16a34a" } : undefined}
            >
              {/* Text side */}
              <div className="flex-1 px-4 py-4 flex flex-col justify-between">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {rev.label}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-2">
                  REV. DATE: {rev.revDate}
                </span>
                {isCurrent && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Current
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail */}
              <div className="w-32 flex-none bg-gray-50 dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700 relative">
                {rev.imageSrc ? (
                  <img
                    src={rev.imageSrc}
                    alt={rev.label}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
