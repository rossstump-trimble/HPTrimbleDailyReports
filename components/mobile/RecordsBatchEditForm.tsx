"use client";

import { ChevronRight, X } from "lucide-react";
import { useState } from "react";
import type { RecordTypeConfig } from "@/lib/mobile/recordTypes";

interface RecordsBatchEditFormProps {
  config: RecordTypeConfig;
  selectedCount: number;
  onClose: () => void;
}

export default function RecordsBatchEditForm({
  config,
  selectedCount,
  onClose,
}: RecordsBatchEditFormProps) {
  const [comment, setComment] = useState("");
  const [markDone, setMarkDone] = useState(false);

  // Separate the toggle field from the rest
  const detailFields = config.batchEditFields.filter((f) => f.type !== "toggle");
  const hasMarkDone = config.batchEditFields.some((f) => f.type === "toggle");

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-100 dark:bg-gray-950">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-none"
        style={{ backgroundColor: "#1b3a5c" }}
      >
        <button onClick={onClose} className="text-white opacity-90 hover:opacity-100" aria-label="Close">
          <X size={20} />
        </button>
        <span className="text-white font-semibold text-base">Batch Edit</span>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* DETAILS section */}
        {detailFields.length > 0 && (
          <div className="mt-3 mb-2">
            <p className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800">
              Details
            </p>
            <div className="bg-white dark:bg-gray-900">
              {detailFields.map((field, idx) => (
                <div key={field.key}>
                  <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                    <span className="text-sm text-gray-800 dark:text-gray-100">{field.label}</span>
                    <div className="flex items-center gap-2 flex-none">
                      {field.defaultValue && (
                        <span className="text-sm text-gray-400 dark:text-gray-500">{field.defaultValue}</span>
                      )}
                      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  </button>
                  {idx < detailFields.length - 1 && (
                    <div className="ml-4 border-b border-gray-100 dark:border-gray-800" />
                  )}
                </div>
              ))}

              {/* Mark my assignments done toggle */}
              {hasMarkDone && (
                <>
                  <div className="ml-4 border-b border-gray-100 dark:border-gray-800" />
                  <div className="flex items-center justify-between px-4 py-4">
                    <span className="text-sm text-gray-800 dark:text-gray-100">Mark my assignments done</span>
                    <button
                      onClick={() => setMarkDone((v) => !v)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        markDone ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700"
                      }`}
                      aria-checked={markDone}
                      role="switch"
                      aria-label="Mark my assignments done"
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                          markDone ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* COMMENTS section */}
        <div className="mb-3">
          <p className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800">
            Comments
          </p>
          <div className="bg-white dark:bg-gray-900 px-4 py-3">
            <textarea
              className="w-full text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent resize-none focus:outline-none min-h-[80px]"
              placeholder="Say something..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="flex-none bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 py-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Editing {selectedCount} {selectedCount === 1 ? config.singularLabel : config.label}
        </span>
        <button
          className="px-6 py-2 rounded text-sm font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800"
          disabled
        >
          SAVE
        </button>
      </div>
    </div>
  );
}
