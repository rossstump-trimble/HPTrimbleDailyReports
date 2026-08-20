"use client";

import { Check } from "lucide-react";
import type { SortOption } from "@/lib/mobile/recordTypes";

interface RecordsSortModalProps {
  options: SortOption[];
  activeSort: string;
  onSelect: (sortId: string) => void;
  onClose: () => void;
}

export default function RecordsSortModal({
  options,
  activeSort,
  onSelect,
  onClose,
}: RecordsSortModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card — centered */}
      <div className="absolute inset-0 z-50 flex items-center justify-center px-8 pointer-events-none">
        <div className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-xl pointer-events-auto overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Sort by
            </p>
          </div>

          {/* Options */}
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onSelect(option.id);
                onClose();
              }}
              className="w-full flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
            >
              <span className="text-sm text-gray-800 dark:text-gray-100">{option.label}</span>
              {activeSort === option.id && (
                <Check size={18} className="text-blue-500 dark:text-blue-400 flex-none" />
              )}
            </button>
          ))}

          <div className="h-2" />
        </div>
      </div>
    </>
  );
}
