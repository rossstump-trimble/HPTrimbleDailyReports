"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const RECORD_TYPES = [
  "Action item",
  "Checklist",
  "Daily report",
  "Drawing (Current)",
  "Field work directive",
  "Issue",
  "Meeting",
  "Notice to comply",
  "Punch item",
  "RFI",
];

const STATUSES = ["Open", "In Review", "Closed", "Void"];

const CONTACTS = [
  "Alex Johnson",
  "Maria Garcia",
  "James Lee",
  "Sarah Chen",
  "Tom Williams",
];

const COMPANIES = [
  "Trimble Inc.",
  "General Contractor LLC",
  "MEP Engineering Co.",
  "Structural Solutions",
  "Landscape & Site Works",
];

const ANNOTATION_TYPES = ["Arrow", "Cloud", "Dimension", "Freehand", "Shape", "Text"];

const ANNOTATION_COLORS = ["Red", "Blue", "Green", "Yellow", "Orange", "Purple"];

const CREATORS = [
  "Alex Johnson",
  "Maria Garcia",
  "James Lee",
  "Sarah Chen",
];

// ─── Filter state shape ────────────────────────────────────────────────────────

export interface DrawingFilters {
  recordTypes: Set<string>;
  statuses: Set<string>;
  contacts: Set<string>;
  companies: Set<string>;
  annotationTypes: Set<string>;
  annotationColors: Set<string>;
  createdBy: Set<string>;
}

export function emptyFilters(): DrawingFilters {
  return {
    recordTypes: new Set(),
    statuses: new Set(),
    contacts: new Set(),
    companies: new Set(),
    annotationTypes: new Set(),
    annotationColors: new Set(),
    createdBy: new Set(),
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DrawingFilterPanelProps {
  filters: DrawingFilters;
  onChange: (f: DrawingFilters) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DrawingFilterPanel({
  filters,
  onChange,
  onClose,
}: DrawingFilterPanelProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleItem = (
    field: keyof DrawingFilters,
    value: string
  ) => {
    const current = filters[field] as Set<string>;
    const next = new Set(current);
    next.has(value) ? next.delete(value) : next.add(value);
    onChange({ ...filters, [field]: next });
  };

  const clearAll = () => onChange(emptyFilters());

  const totalActive =
    filters.recordTypes.size +
    filters.statuses.size +
    filters.contacts.size +
    filters.companies.size +
    filters.annotationTypes.size +
    filters.annotationColors.size +
    filters.createdBy.size;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gray-100 dark:bg-gray-950">
      {/* Header */}
      <div
        className="flex-none flex items-center px-4 h-12 gap-3"
        style={{ background: "#1b3a5c" }}
      >
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white"
        >
          <X size={20} />
        </button>
        <span className="flex-1 text-base font-semibold text-white">
          Filters
        </span>
        {totalActive > 0 && (
          <button
            onClick={clearAll}
            className="text-sm font-medium"
            style={{ color: "#60a5fa" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* RECORDS section */}
        <SectionHeader label="RECORDS" />

        <FilterGroup
          label="Record types"
          groupKey="recordTypes"
          isOpen={openGroups.has("recordTypes")}
          onToggle={() => toggleGroup("recordTypes")}
          activeCount={filters.recordTypes.size}
        >
          {RECORD_TYPES.map((rt) => (
            <CheckRow
              key={rt}
              label={rt}
              checked={filters.recordTypes.has(rt)}
              onToggle={() => toggleItem("recordTypes", rt)}
            />
          ))}
        </FilterGroup>

        <FilterGroup
          label="Status"
          groupKey="statuses"
          isOpen={openGroups.has("statuses")}
          onToggle={() => toggleGroup("statuses")}
          activeCount={filters.statuses.size}
        >
          {STATUSES.map((s) => (
            <CheckRow
              key={s}
              label={s}
              checked={filters.statuses.has(s)}
              onToggle={() => toggleItem("statuses", s)}
            />
          ))}
        </FilterGroup>

        <FilterGroup
          label="Assigned to contact"
          groupKey="contacts"
          isOpen={openGroups.has("contacts")}
          onToggle={() => toggleGroup("contacts")}
          activeCount={filters.contacts.size}
        >
          {CONTACTS.map((c) => (
            <CheckRow
              key={c}
              label={c}
              checked={filters.contacts.has(c)}
              onToggle={() => toggleItem("contacts", c)}
            />
          ))}
        </FilterGroup>

        <FilterGroup
          label="Assigned to company"
          groupKey="companies"
          isOpen={openGroups.has("companies")}
          onToggle={() => toggleGroup("companies")}
          activeCount={filters.companies.size}
        >
          {COMPANIES.map((c) => (
            <CheckRow
              key={c}
              label={c}
              checked={filters.companies.has(c)}
              onToggle={() => toggleItem("companies", c)}
            />
          ))}
        </FilterGroup>

        {/* ANNOTATIONS section */}
        <SectionHeader label="ANNOTATIONS" />

        <FilterGroup
          label="Type"
          groupKey="annotationTypes"
          isOpen={openGroups.has("annotationTypes")}
          onToggle={() => toggleGroup("annotationTypes")}
          activeCount={filters.annotationTypes.size}
        >
          {ANNOTATION_TYPES.map((t) => (
            <CheckRow
              key={t}
              label={t}
              checked={filters.annotationTypes.has(t)}
              onToggle={() => toggleItem("annotationTypes", t)}
            />
          ))}
        </FilterGroup>

        <FilterGroup
          label="Color"
          groupKey="annotationColors"
          isOpen={openGroups.has("annotationColors")}
          onToggle={() => toggleGroup("annotationColors")}
          activeCount={filters.annotationColors.size}
        >
          {ANNOTATION_COLORS.map((c) => (
            <CheckRow
              key={c}
              label={c}
              checked={filters.annotationColors.has(c)}
              onToggle={() => toggleItem("annotationColors", c)}
            />
          ))}
        </FilterGroup>

        <FilterGroup
          label="Created by"
          groupKey="createdBy"
          isOpen={openGroups.has("createdBy")}
          onToggle={() => toggleGroup("createdBy")}
          activeCount={filters.createdBy.size}
        >
          {CREATORS.map((c) => (
            <CheckRow
              key={c}
              label={c}
              checked={filters.createdBy.has(c)}
              onToggle={() => toggleItem("createdBy", c)}
            />
          ))}
        </FilterGroup>

        {/* Bottom padding so last item clears the sticky button */}
        <div className="h-24" />
      </div>

      {/* Sticky apply button */}
      <div className="absolute bottom-0 inset-x-0 px-6 pb-5 pt-3 bg-gradient-to-t from-gray-100 via-gray-100 dark:from-gray-950 dark:via-gray-950">
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-full text-white text-base font-semibold shadow"
          style={{ background: "#1b3a5c" }}
        >
          {totalActive === 0 ? "All annotations" : `Apply ${totalActive} filter${totalActive !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 pt-4 pb-1">
      <span className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
        {label}
      </span>
    </div>
  );
}

// ─── Collapsible filter group ─────────────────────────────────────────────────

function FilterGroup({
  label,
  groupKey,
  isOpen,
  onToggle,
  activeCount,
  children,
}: {
  label: string;
  groupKey: string;
  isOpen: boolean;
  onToggle: () => void;
  activeCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 mb-px">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-800 dark:text-gray-100">{label}</span>
          {activeCount > 0 && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: "#1b3a5c" }}
            >
              {activeCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Checkbox row ─────────────────────────────────────────────────────────────

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-3 border-b border-gray-50 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-none ${checked ? "" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"}`}
        style={checked ? { borderColor: "#1b3a5c", background: "#1b3a5c" } : undefined}
      >
        {checked && (
          <svg viewBox="0 0 12 10" className="w-3 h-2.5" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  );
}
