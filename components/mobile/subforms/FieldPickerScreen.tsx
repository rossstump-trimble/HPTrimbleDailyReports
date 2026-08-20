"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";

export interface PickerOption {
  label: string;
  value: string;
  /** Optional status-dot color */
  color?: string;
}

interface FieldPickerScreenProps {
  title: string;
  options: PickerOption[];
  value: string;
  onSelect: (value: string) => void;
  onBack: () => void;
}

export default function FieldPickerScreen({
  title,
  options,
  value,
  onSelect,
  onBack,
}: FieldPickerScreenProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const handleSelect = (option: PickerOption) => {
    onSelect(option.value);
    onBack();
  };

  const isSelected = (opt: PickerOption) =>
    opt.value.toUpperCase() === value.toUpperCase();

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header
        className="flex items-center px-3 py-3 flex-none gap-2"
        style={{ backgroundColor: "#1b3a5c" }}
      >
        <button
          onClick={onBack}
          className="text-white opacity-90 hover:opacity-100 p-1"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-white font-semibold text-base">{title}</span>
        <button
          onClick={onBack}
          className="text-white opacity-70 hover:opacity-100 text-sm font-medium"
        >
          Select
        </button>
      </header>

      {/* Search bar */}
      <div className="px-3 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.map((opt) => {
          const selected = isSelected(opt);
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt)}
              className={`w-full flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800 text-left transition-colors ${
                selected ? "bg-blue-50 dark:bg-blue-950/30" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {/* Optional status color dot */}
              {opt.color && (
                <span
                  className="w-5 h-5 rounded-full flex-none mr-3"
                  style={{ backgroundColor: opt.color }}
                />
              )}

              <span
                className={`flex-1 text-sm ${
                  selected ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-800 dark:text-gray-200"
                }`}
              >
                {opt.label}
              </span>

              {/* Radio indicator */}
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-none ml-3 ${
                  selected ? "border-blue-500 dark:border-blue-400" : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {selected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
