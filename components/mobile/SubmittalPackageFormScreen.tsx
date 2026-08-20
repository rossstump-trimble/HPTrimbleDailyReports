"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, Lock, User, X } from "lucide-react";
import { getMockRecords } from "@/lib/mobile/mockData";

// ─── Mock submittals inside a package ─────────────────────────────────────────

interface PackageSubmittal {
  id: string;
  number: string;
  title: string;
  specSection: string;
  status: "APPROVED" | "REVISE AND RESUBMIT" | "FOR REVIEW" | "DRAFT" | "REJECTED";
  dueDate: string;
  assigneeCount: number;
}

const PACKAGE_SUBMITTALS: Record<string, PackageSubmittal[]> = {
  "sp-04": [
    { id: "sub-04", number: "055213.1.3.E", title: "AS-1 Air Separator", specSection: "23 21 23 - Hydronic Pumps", status: "REVISE AND RESUBMIT", dueDate: "7/9/26", assigneeCount: 3 },
    { id: "sub-02", number: "03 30 00.2.A", title: "Concrete Type B Mix Design", specSection: "03 30 00 - Cast-in-Place Concrete", status: "APPROVED", dueDate: "6/25/26", assigneeCount: 1 },
    { id: "sub-01", number: "05 12 00.1.A", title: "Structural Steel Connections — Grid A", specSection: "05 12 00 - Structural Steel Framing", status: "APPROVED", dueDate: "6/18/26", assigneeCount: 2 },
  ],
  "sp-03": [
    { id: "sub-05", number: "23 74 00.3.A", title: "AHU-1 Air Handling Unit", specSection: "23 74 00 - Packaged Outdoor HVAC", status: "REVISE AND RESUBMIT", dueDate: "7/7/26", assigneeCount: 2 },
    { id: "sub-06", number: "23 74 00.3.B", title: "AHU-2 Air Handling Unit", specSection: "23 74 00 - Packaged Outdoor HVAC", status: "FOR REVIEW", dueDate: "7/7/26", assigneeCount: 2 },
  ],
  "sp-02": [
    { id: "sub-03", number: "08 44 13.1.A", title: "Exterior Glazing System — North Elevation", specSection: "08 40 00 - Entrances and Storefronts", status: "APPROVED", dueDate: "6/25/26", assigneeCount: 1 },
    { id: "sub-03", number: "08 44 13.1.B", title: "Exterior Glazing System — South Elevation", specSection: "08 40 00 - Entrances and Storefronts", status: "APPROVED", dueDate: "6/25/26", assigneeCount: 1 },
  ],
  "sp-01": [
    { id: "sub-01", number: "03 30 00.1.A", title: "Concrete Type B Mix Design", specSection: "03 30 00 - Cast-in-Place Concrete", status: "APPROVED", dueDate: "6/5/26", assigneeCount: 1 },
  ],
};

const DEFAULT_SUBMITTALS: PackageSubmittal[] = [
  { id: "def-1", number: "001-0", title: "Sample Submittal", specSection: "03 00 00 - Concrete", status: "FOR REVIEW", dueDate: "7/9/26", assigneeCount: 1 },
];

// ─── Status styling ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { color: string; border: string; lock: boolean }> = {
  "APPROVED":             { color: "#16a34a", border: "#16a34a", lock: true },
  "REVISE AND RESUBMIT":  { color: "#dc2626", border: "#dc2626", lock: false },
  "FOR REVIEW":           { color: "#2563eb", border: "#2563eb", lock: false },
  "DRAFT":                { color: "#9ca3af", border: "#9ca3af", lock: false },
  "REJECTED":             { color: "#dc2626", border: "#dc2626", lock: false },
};

// ─── Read-only row helpers ────────────────────────────────────────────────────

function ReadRow({ label, value, chevron }: { label: string; value?: string; chevron?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-gray-800 dark:text-gray-100">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-gray-400 dark:text-gray-500 truncate max-w-[160px]">{value}</span>}
        {chevron && <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-none" />}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="mx-4 border-t border-gray-100 dark:border-gray-800" />;
}

// ─── Submittal card ───────────────────────────────────────────────────────────

function SubmittalCard({ sub, onClick }: { sub: PackageSubmittal; onClick: () => void }) {
  const style = STATUS_STYLES[sub.status] ?? STATUS_STYLES.DRAFT;
  return (
    <div
      className="bg-white dark:bg-gray-900 border-l-4 px-4 py-3 mb-px cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
      style={{ borderLeftColor: style.border }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold tracking-wide" style={{ color: style.color }}>
          {sub.status}
        </span>
        {style.lock && <Lock size={12} style={{ color: style.color }} />}
      </div>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">{sub.number} {sub.title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{sub.specSection}</p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">
          <CalendarDays size={11} className="text-gray-500 dark:text-gray-400" />
          <span className="text-[11px] text-gray-600 dark:text-gray-300">{sub.dueDate}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">
          <User size={11} className="text-gray-500 dark:text-gray-400" />
          <span className="text-[11px] text-gray-600 dark:text-gray-300">{sub.assigneeCount}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function ReadOnlyToast() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-lg transition-opacity duration-500 pointer-events-none whitespace-nowrap"
      style={{ backgroundColor: "rgba(50,50,50,0.88)", opacity: visible ? 1 : 0 }}
    >
      This record is read-only.
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  recordId: string;
}

export default function SubmittalPackageFormScreen({ projectId, recordId }: Props) {
  const router = useRouter();
  const records = getMockRecords("submittal-packages");
  const record  = records.find(r => r.id === recordId) ?? records[0];
  const submittals = PACKAGE_SUBMITTALS[record.id] ?? DEFAULT_SUBMITTALS;

  // Tap anywhere → show toast
  const [tapped, setTapped]   = useState(false);
  const [showToast, setShowToast] = useState(true);

  const handleTap = useCallback(() => {
    setTapped(true);
    setTimeout(() => setTapped(false), 200);
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-gray-100 dark:bg-gray-950 overflow-hidden relative" onClick={handleTap}>
      {/* Header */}
      <header className="flex items-center px-3 py-3 flex-none gap-3" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={() => router.back()} className="text-white p-1"><X size={20} /></button>
        <h1 className="flex-1 text-white font-semibold text-base truncate">Submittal package</h1>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Core fields card */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-gray-100 dark:border-gray-800">
          <ReadRow label="Number" value={record.number} />
          <Divider />
          <ReadRow label="Status" value={record.status.charAt(0) + record.status.slice(1).toLowerCase()} />
          <Divider />
          {/* Closed toggle */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-gray-300 dark:text-gray-600">Closed</span>
            <div className="w-10 h-6 rounded-full bg-gray-200 dark:bg-gray-700 relative flex-none">
              <div className="w-5 h-5 bg-white rounded-full shadow absolute top-0.5 left-0.5 transition-transform" />
            </div>
          </div>
          <Divider />
          {/* Description */}
          <div className="px-4 py-3.5">
            <p className="text-sm text-gray-800 dark:text-gray-100 mb-0.5">Description</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">{record.title}</p>
          </div>
          <Divider />
          {/* References */}
          <div className="px-4 py-4">
            <p className="text-sm text-gray-800 dark:text-gray-100">References</p>
          </div>
          <Divider />
          {/* Comments */}
          <div className="px-4 py-3.5">
            <p className="text-sm text-gray-800 dark:text-gray-100 mb-1">Comments</p>
            <p className="text-sm text-gray-300 dark:text-gray-600 italic">No Comments to display</p>
          </div>
          <Divider />
          <ReadRow label="Revision" value="01" />
          <Divider />
          {/* Spec section */}
          <div className="px-4 py-3.5">
            <p className="text-sm text-gray-800 dark:text-gray-100 mb-0.5">Spec section</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">03 00 00 - Concrete</p>
          </div>
          <Divider />
          <ReadRow label="Due date" value={record.dueDate} />
          <Divider />
          <ReadRow label="Type" value="None" />
          <Divider />
          <ReadRow label="Importance" value="None" />
          <Divider />
          <ReadRow label="Trade" />
          <Divider />
          <ReadRow label="Author package number" />
          <Divider />
          <ReadRow label="Location" />
          <Divider />
          <ReadRow label="CC" chevron />
          <Divider />
          <ReadRow label="Records" />
          <Divider />
          <ReadRow label="Web links" />
        </div>

        {/* SUBMITTALS section */}
        <div className="mb-4">
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800">
            <span className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400">SUBMITTALS</span>
          </div>
          {submittals.map((sub, i) => (
            <SubmittalCard
              key={`${sub.id}-${i}`}
              sub={sub}
              onClick={() => router.push(`/mobile/projects/${projectId}/records/submittals/${sub.id}`)}
            />
          ))}
        </div>

        <div className="h-4" />
      </div>

      {/* Read-only toast */}
      {showToast && <ReadOnlyToast />}
    </div>
  );
}
