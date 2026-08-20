"use client";

import {
  CheckSquare,
  ClipboardList,
  Diamond,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  MessageSquare,
  HardHat,
  X,
} from "lucide-react";

export interface AddRecordOption {
  recordType: string;
  label: string;
  icon: React.ReactNode;
}

const OPTIONS: AddRecordOption[] = [
  { recordType: "action-items",          label: "Action item",          icon: <CheckSquare size={20} /> },
  { recordType: "checklists",            label: "Checklist",            icon: <ClipboardList size={20} /> },
  { recordType: "field-work-directives", label: "Field work directive", icon: <Diamond size={20} /> },
  { recordType: "issues",               label: "Issue",                icon: <AlertTriangle size={20} /> },
  { recordType: "notices-to-comply",    label: "Notice to comply",     icon: <XCircle size={20} /> },
  { recordType: "punch-items",          label: "Punch item",           icon: <CheckCircle2 size={20} /> },
  { recordType: "rfis",                 label: "RFI",                  icon: <MessageSquare size={20} /> },
  { recordType: "safety-notices",       label: "Safety notice",        icon: <HardHat size={20} /> },
];

interface AddRecordMenuProps {
  onSelect: (option: AddRecordOption) => void;
  onClose: () => void;
}

export default function AddRecordMenu({ onSelect, onClose }: AddRecordMenuProps) {
  return (
    <>
      {/* Dim backdrop */}
      <div
        className="absolute inset-0 z-20 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 inset-x-0 z-30 bg-white dark:bg-gray-900 rounded-t-2xl overflow-hidden shadow-2xl">
        {OPTIONS.map((opt) => (
          <button
            key={opt.recordType}
            onClick={() => onSelect(opt)}
            className="w-full flex items-center gap-4 px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
          >
            <span className="text-gray-500 dark:text-gray-400">{opt.icon}</span>
            <span className="text-sm text-gray-800 dark:text-gray-100">{opt.label}</span>
          </button>
        ))}

        {/* Cancel row */}
        <button
          onClick={onClose}
          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
        >
          <span className="text-gray-500 dark:text-gray-400"><X size={20} /></span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Cancel</span>
        </button>
      </div>
    </>
  );
}
