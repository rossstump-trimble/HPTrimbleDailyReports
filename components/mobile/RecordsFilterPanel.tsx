"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import type { RecordTypeConfig } from "@/lib/mobile/recordTypes";

interface FilterState {
  assignedToMe: boolean;
  assignedToMyCompany: boolean;
  pastDue: boolean;
  statuses: Set<string>;
}

interface RecordsFilterPanelProps {
  config: RecordTypeConfig;
  initialFilters: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

export type { FilterState };

export default function RecordsFilterPanel({
  config,
  initialFilters,
  onApply,
  onClose,
}: RecordsFilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    assignedToMe: initialFilters.assignedToMe,
    assignedToMyCompany: initialFilters.assignedToMyCompany,
    pastDue: initialFilters.pastDue,
    statuses: new Set(initialFilters.statuses),
  });

  const toggleStatus = (status: string) => {
    setFilters((prev) => {
      const next = new Set(prev.statuses);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { ...prev, statuses: next };
    });
  };

  const clearAll = () => {
    setFilters({
      assignedToMe: false,
      assignedToMyCompany: false,
      pastDue: false,
      statuses: new Set(),
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const activeCount =
    (filters.assignedToMe ? 1 : 0) +
    (filters.assignedToMyCompany ? 1 : 0) +
    (filters.pastDue ? 1 : 0) +
    filters.statuses.size;

  const buttonLabel =
    activeCount === 0
      ? "All records"
      : `Apply ${activeCount} filter${activeCount > 1 ? "s" : ""}`;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-none"
        style={{ backgroundColor: "#1b3a5c" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-white opacity-90 hover:opacity-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <span className="text-white font-semibold text-base">Filters</span>
        </div>
        <button
          onClick={clearAll}
          className="text-white opacity-80 hover:opacity-100 text-sm"
        >
          Clear
        </button>
      </div>

      {/* Filter options */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <FilterRow
          label="Assigned to me"
          checked={filters.assignedToMe}
          onChange={() => setFilters((p) => ({ ...p, assignedToMe: !p.assignedToMe }))}
        />
        <FilterRow
          label="Assigned to my company"
          checked={filters.assignedToMyCompany}
          onChange={() =>
            setFilters((p) => ({ ...p, assignedToMyCompany: !p.assignedToMyCompany }))
          }
        />
        <FilterRow
          label="Past due"
          checked={filters.pastDue}
          onChange={() => setFilters((p) => ({ ...p, pastDue: !p.pastDue }))}
        />

        {/* Status section header */}
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Status
          </span>
        </div>

        {config.statuses.map((status) => (
          <FilterRow
            key={status}
            label={status}
            checked={filters.statuses.has(status)}
            onChange={() => toggleStatus(status)}
          />
        ))}

        {/* Spacer so sticky button doesn't cover last row */}
        <div className="h-24" />
      </div>

      {/* Sticky apply button */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-3 bg-white dark:bg-gray-900">
        <button
          onClick={handleApply}
          className="w-full py-3.5 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: "#1b3a5c" }}
        >
          {activeCount > 0 && <Check size={16} />}
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

function FilterRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <span className="text-sm text-gray-800 dark:text-gray-100">{label}</span>
      {checked && <Check size={18} className="text-blue-500 dark:text-blue-400 flex-none" />}
    </button>
  );
}
