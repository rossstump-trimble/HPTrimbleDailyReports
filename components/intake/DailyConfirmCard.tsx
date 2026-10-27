"use client";

import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { Camera, Image as ImageIcon, Minus, Paperclip, Plus, RotateCcw, Send, Trash2, Upload, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CrewEntry, DailyReport, TradePartner } from "@/types/hpproto";
import { resolveTradePartner } from "@/lib/trade-partner";
import { calculateCrewTotals } from "@/lib/crew-hours";

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date" | "email";
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition",
        className,
      )}
    />
  );
}

function FieldTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition resize-none"
    />
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400">{title}</h3>
      </div>
      <div className="px-4 py-4 space-y-4">{children}</div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type DailyFormData = Omit<DailyReport, "id" | "projectId" | "submittedAt" | "rawSourceFileName">;

interface DailyConfirmCardProps {
  tradePartners: TradePartner[];
  initialData: DailyFormData;
  data: DailyFormData;
  onChange: (data: DailyFormData) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  requireTradePartner?: boolean;
  submitDisabled?: boolean;
  attachedFiles?: File[];
  onAttachedFilesChange?: (files: File[]) => void;
  staFiles?: File[];
  onStaFilesChange?: (files: File[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EquipmentEntry {
  name: string;
  count: number;
}

function parseEquipmentRow(item: string): EquipmentEntry {
  const match =
    item.match(/^(.*?)(?:[\s–—:-]+(?:qty|quantity|count)?\s*[:=]?\s*(\d+(?:\.\d+)?|\(\d+\)))$/i) ||
    item.match(/^(\d+)\s*[xX]?\s+(.*)$/);

  if (match) {
    if (/^\d+/.test(match[1]) && match[2]) {
      return { name: match[2].trim(), count: parseInt(match[1], 10) || 1 };
    }
    const rawCount = match[2].replace(/[()]/g, "");
    return { name: match[1].trim(), count: parseInt(rawCount, 10) || 1 };
  }
  return { name: item.trim(), count: 1 };
}

function formatEquipmentRow(entry: EquipmentEntry): string {
  if (!entry.name.trim()) return "";
  return entry.count > 1 ? `${entry.name.trim()} (Qty: ${entry.count})` : entry.name.trim();
}

export default function DailyConfirmCard({
  tradePartners,
  data,
  onChange,
  onCancel,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Confirm & Submit Daily",
  requireTradePartner = true,
  submitDisabled = false,
  attachedFiles,
  onAttachedFilesChange,
  staFiles,
  onStaFilesChange,
}: DailyConfirmCardProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(
    <K extends keyof DailyFormData>(key: K, value: DailyFormData[K]) => {
      onChange({ ...data, [key]: value });
    },
    [data, onChange],
  );

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAttachedFilesChange) {
      const newFiles = Array.from(e.target.files);
      onAttachedFilesChange([...(attachedFiles || []), ...newFiles]);
    }
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    if (onAttachedFilesChange && attachedFiles) {
      onAttachedFilesChange(attachedFiles.filter((_, i) => i !== index));
    }
  };

  const derivedWorkerCount = data.crewBreakdown.reduce((s, r) => s + r.count, 0);
  const workers = data.workerCount || derivedWorkerCount || 0;
  const currentHoursPerPerson =
    workers > 0 && data.totalHours > 0
      ? Math.round((data.totalHours / workers) * 10) / 10
      : data.totalHours > 0
      ? data.totalHours
      : 8;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const primaryEmail = data.emailRecipients[0] || "";
  const hasInvalidEmail = data.emailRecipients.some(
    (e) => e.trim().length > 0 && !emailRegex.test(e.trim()),
  );

  // ── crew helpers ────────────────────────────────────────────────────────────

  const updateCrew = (index: number, field: keyof CrewEntry, value: string | number) => {
    const updated = data.crewBreakdown.map((row, i) =>
      i === index ? { ...row, [field]: field === "craft" ? String(value) : Number(value) } : row,
    );
    const { workerCount, totalHours, updatedCrew } = calculateCrewTotals(updated);
    onChange({
      ...data,
      crewBreakdown: updatedCrew,
      workerCount,
      totalHours,
    });
  };

  const addCrewRow = () => {
    const updated = [...data.crewBreakdown, { craft: "", count: 1, hoursPerWorker: 8.0, totalHours: 8.0 }];
    const { workerCount, totalHours, updatedCrew } = calculateCrewTotals(updated);
    onChange({
      ...data,
      crewBreakdown: updatedCrew,
      workerCount,
      totalHours,
    });
  };

  const removeCrewRow = (index: number) => {
    const updated = data.crewBreakdown.filter((_, i) => i !== index);
    const { workerCount, totalHours, updatedCrew } = calculateCrewTotals(updated);
    onChange({
      ...data,
      crewBreakdown: updatedCrew,
      workerCount,
      totalHours,
    });
  };

  // ── equipment helpers ───────────────────────────────────────────────────────

  const [equipmentRows, setEquipmentRows] = useState<EquipmentEntry[]>(() => {
    return data.equipment && data.equipment.length > 0
      ? data.equipment.map(parseEquipmentRow)
      : [];
  });

  useEffect(() => {
    if (data.equipment) {
      const parsed = data.equipment.map(parseEquipmentRow);
      const currentValid = equipmentRows.map(formatEquipmentRow).filter(Boolean);
      const incomingValid = data.equipment.filter(Boolean);
      if (JSON.stringify(currentValid) !== JSON.stringify(incomingValid)) {
        setEquipmentRows(parsed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.equipment]);

  const updateEquipmentRow = (index: number, field: "name" | "count", value: string | number) => {
    const updated = [...equipmentRows];
    if (!updated[index]) return;
    if (field === "name") {
      updated[index] = { ...updated[index], name: String(value) };
    } else {
      updated[index] = { ...updated[index], count: Math.max(1, Number(value) || 1) };
    }
    setEquipmentRows(updated);
    onChange({
      ...data,
      equipment: updated.map(formatEquipmentRow).filter(Boolean),
    });
  };

  const addEquipmentRow = () => {
    const updated = [...equipmentRows, { name: "", count: 1 }];
    setEquipmentRows(updated);
  };

  const removeEquipmentRow = (index: number) => {
    const updated = equipmentRows.filter((_, i) => i !== index);
    setEquipmentRows(updated);
    onChange({
      ...data,
      equipment: updated.map(formatEquipmentRow).filter(Boolean),
    });
  };

  // ── tier subs helpers ──────────────────────────────────────────────────────
  const tierSubs = data.tierSubcontractors ?? [];

  const updateTierSub = (
    index: number,
    field: "name" | "count" | "trade",
    value: string | number,
  ) => {
    const updated = [...tierSubs];
    if (!updated[index]) return;
    if (field === "name") {
      updated[index] = { ...updated[index], name: String(value) };
    } else if (field === "count") {
      updated[index] = { ...updated[index], count: Math.max(0, Number(value) || 0) };
    } else {
      updated[index] = { ...updated[index], trade: String(value) };
    }
    onChange({
      ...data,
      tierSubcontractors: updated,
      tierSubsSummary:
        updated.length > 0
          ? updated.map((s) => `${s.name} (${s.count})`).join(", ")
          : "None",
    });
  };

  const addTierSub = () => {
    const updated = [...tierSubs, { name: "", count: 1, trade: "" }];
    onChange({
      ...data,
      tierSubcontractors: updated,
    });
  };

  const removeTierSub = (index: number) => {
    const updated = tierSubs.filter((_, i) => i !== index);
    onChange({
      ...data,
      tierSubcontractors: updated,
      tierSubsSummary:
        updated.length > 0
          ? updated.map((s) => `${s.name} (${s.count})`).join(", ")
          : "None",
    });
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [comboboxQuery, setComboboxQuery] = useState(data.tradePartnerName || "");

  useEffect(() => {
    setComboboxQuery(data.tradePartnerName || "");
  }, [data.tradePartnerName]);

  const matchedPartner = tradePartners.find(
    (tp) =>
      tp.id === data.tradePartnerId ||
      tp.name.toLowerCase() === (data.tradePartnerName || "").trim().toLowerCase(),
  );

  const isInvalidTrackedSelection =
    Boolean(data.tradePartnerName?.trim()) && tradePartners.length > 0 && !matchedPartner;

  const suggestions = useMemo(() => {
    const q = comboboxQuery.trim().toLowerCase();
    if (!q) return tradePartners.slice(0, 8);
    return tradePartners
      .filter(
        (tp) =>
          tp.name.toLowerCase().includes(q) ||
          (tp.category || "").toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [comboboxQuery, tradePartners]);

  return (
    <div className="space-y-4">
      {/* ── Trade partner & date ───────────────────────────────────────────── */}
      <Section title="Report Details">
        <div className="relative">
          <FieldLabel required={requireTradePartner}>Trade Partner / Tracked Company</FieldLabel>
          <div className="relative">
            <input
              type="text"
              value={comboboxQuery}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
              onChange={(e) => {
                const val = e.target.value;
                setComboboxQuery(val);
                setShowSuggestions(true);
                const resolved = resolveTradePartner(val, tradePartners);
                onChange({ ...data, ...resolved, tradePartnerName: val });
              }}
              placeholder="Start typing company name or trade (e.g. Electrical, Titan)..."
              className={cn(
                "w-full rounded-xl border bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 transition",
                isInvalidTrackedSelection
                  ? "border-amber-400 focus:ring-amber-400"
                  : "border-gray-200 dark:border-gray-700 focus:ring-blue-400",
              )}
            />
            {matchedPartner && (
              <span className="absolute right-3 top-2.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-medium pointer-events-none">
                {matchedPartner.category || "Tracked"}
              </span>
            )}
          </div>

          {/* Autocomplete Suggestions Popup */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Select Tracked Project Company
              </div>
              {suggestions.map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setComboboxQuery(tp.name);
                    setShowSuggestions(false);
                    onChange({
                      ...data,
                      tradePartnerId: tp.id,
                      tradePartnerName: tp.name,
                      emailRecipients: tp.contactEmail ? [tp.contactEmail] : data.emailRecipients,
                    });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200">{tp.name}</span>
                  {tp.category && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                      {tp.category}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Fallback Direct Dropdown */}
          {tradePartners.length > 0 && tradePartners.length <= 200 && (
            <select
              value={matchedPartner ? matchedPartner.id : ""}
              onChange={(e) => {
                const tp = tradePartners.find((t) => t.id === e.target.value);
                if (tp) {
                  setComboboxQuery(tp.name);
                  onChange({
                    ...data,
                    tradePartnerId: tp.id,
                    tradePartnerName: tp.name,
                    emailRecipients: tp.contactEmail ? [tp.contactEmail] : data.emailRecipients,
                  });
                }
              }}
              className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">— Pick from tracked bowling sheet companies ({tradePartners.length}) —</option>
              {tradePartners.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.name} ({tp.category || "Trade Partner"})
                </option>
              ))}
            </select>
          )}

          {/* Validation warning if typing an untracked company */}
          {isInvalidTrackedSelection && (
            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <span>⚠️</span>
              <span>
                &ldquo;{data.tradePartnerName}&rdquo; is not a tracked company on this project&apos;s bowling sheet. Please select a tracked company.
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <FieldLabel required>Reporter / Author (Foreman / Lead)</FieldLabel>
            <FieldInput
              value={data.submittedBy || ""}
              onChange={(v) => set("submittedBy", v)}
              placeholder="e.g. Evan Grimm, Foreman"
            />
          </div>
          <div>
            <FieldLabel>Email Address</FieldLabel>
            <FieldInput
              type="email"
              value={primaryEmail}
              onChange={(v) => {
                const rest = data.emailRecipients.slice(1);
                set("emailRecipients", v.trim() ? [v.trim(), ...rest] : rest);
              }}
              placeholder="foreman@trade.com"
            />
            {primaryEmail && !emailRegex.test(primaryEmail.trim()) && (
              <span className="text-[11px] text-red-500 mt-1 block">Please enter a valid email format</span>
            )}
          </div>
          <div>
            <FieldLabel required>Report Date</FieldLabel>
            <FieldInput
              type="date"
              value={data.date}
              onChange={(v) => set("date", v)}
            />
          </div>
        </div>
      </Section>

      {/* ── Location & work description ────────────────────────────────────── */}
      <Section title="Work Summary">
        <div>
          <FieldLabel>Location & Work Description</FieldLabel>
          <FieldTextarea
            value={data.locationDescription}
            onChange={(v) => set("locationDescription", v)}
            placeholder="Describe work performed and locations…"
            rows={3}
          />
        </div>
      </Section>

      {/* ── Crew breakdown ─────────────────────────────────────────────────── */}
      <Section title="Crew Breakdown">
        <div className="space-y-2">
          {data.crewBreakdown.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 px-1">
              <span className="flex-1">Craft / Role</span>
              <span className="w-16 text-center">Workers</span>
              <span className="w-20 text-center">Hrs/Worker</span>
              <span className="w-16 text-right pr-2">Total</span>
              <span className="w-6"></span>
            </div>
          )}
          {data.crewBreakdown.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">No crew rows — add one below.</p>
          )}
          {data.crewBreakdown.map((row, i) => {
            const rowCount = Number(row.count) || 0;
            const rowHpp = row.hoursPerWorker != null ? Number(row.hoursPerWorker) : 8.0;
            const rowTotal = row.totalHours != null ? row.totalHours : Math.round(rowCount * rowHpp * 10) / 10;
            return (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={row.craft}
                  onChange={(e) => updateCrew(i, "craft", e.target.value)}
                  placeholder="Craft / Role"
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                <input
                  type="number"
                  min={0}
                  value={row.count}
                  onChange={(e) => updateCrew(i, "count", e.target.value)}
                  className="w-16 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-center text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={row.hoursPerWorker != null ? row.hoursPerWorker : 8.0}
                  onChange={(e) => updateCrew(i, "hoursPerWorker", e.target.value)}
                  className="w-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-center text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                <span className="w-16 text-right pr-2 text-xs font-semibold tabular-nums text-gray-600 dark:text-gray-300">
                  {rowTotal}h
                </span>
                <button
                  type="button"
                  onClick={() => removeCrewRow(i)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                  aria-label="Remove crew row"
                >
                  <Minus size={16} />
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addCrewRow}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        >
          <Plus size={16} /> Add crew role
        </button>

        {/* Totals row */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div>
            <FieldLabel>Total Workers</FieldLabel>
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm font-bold text-gray-800 dark:text-gray-100">
              {data.workerCount || derivedWorkerCount || 0}
            </div>
          </div>
          <div>
            <FieldLabel>Total Shift Hours</FieldLabel>
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm font-bold text-blue-700 dark:text-blue-400">
              {data.totalHours || 0} hrs
            </div>
          </div>
        </div>
      </Section>

      {/* ── Tier Subcontractors ────────────────────────────────────────────── */}
      <Section title="Tier Subcontractors">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Did you have any tier subcontractors on site, and how many people did they have onsite?
          </p>

          <div className="space-y-2">
            {(data.tierSubcontractors ?? []).length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                No tier subcontractors listed today. Click &quot;Add tier subcontractor&quot; if tier subs worked on site.
              </p>
            ) : (
              (data.tierSubcontractors ?? []).map((sub, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => updateTierSub(i, "name", e.target.value)}
                    placeholder="Subcontractor company name"
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-muted-foreground font-semibold">Headcount:</span>
                    <input
                      type="number"
                      min={0}
                      value={sub.count || ""}
                      onChange={(e) => updateTierSub(i, "count", Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-14 bg-transparent text-sm text-center font-semibold text-gray-800 dark:text-gray-100 focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={sub.trade || ""}
                    onChange={(e) => updateTierSub(i, "trade", e.target.value)}
                    placeholder="Trade / Scope (optional)"
                    className="w-32 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeTierSub(i)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                    aria-label="Remove tier subcontractor"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={addTierSub}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            >
              <Plus size={16} /> Add tier subcontractor
            </button>
            {(data.tierSubcontractors ?? []).length > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                Total tier subs: {(data.tierSubcontractors ?? []).reduce((s, r) => s + (r.count || 0), 0)} workers
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* ── Equipment ──────────────────────────────────────────────────────── */}
      <Section title="Equipment on Site">
        <div className="space-y-2.5">
          {equipmentRows.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">No equipment listed for this shift.</p>
          ) : (
            equipmentRows.map((eq, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={eq.name}
                  onChange={(e) => updateEquipmentRow(i, "name", e.target.value)}
                  placeholder="Equipment item (e.g. Scissor Lift, Welder)"
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-muted-foreground font-semibold">Qty:</span>
                  <input
                    type="number"
                    min={1}
                    value={eq.count}
                    onChange={(e) => updateEquipmentRow(i, "count", Number(e.target.value) || 1)}
                    className="w-12 bg-transparent text-sm text-center font-bold text-gray-800 dark:text-gray-100 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEquipmentRow(i)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                  aria-label="Remove equipment row"
                >
                  <Minus size={16} />
                </button>
              </div>
            ))
          )}

          <button
            type="button"
            onClick={addEquipmentRow}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#0063a3] dark:text-blue-400 hover:underline pt-1 transition-colors"
          >
            <Plus size={16} /> Add equipment
          </button>
        </div>
      </Section>

      {/* ── Trades & Favors ───────────────────────────────────────────────── */}
      <Section title="Trades & Favors">
        <div>
          <FieldLabel>Favors / Assistance Done for Trade Partners</FieldLabel>
          <FieldTextarea
            value={data.tradesAndFavors ?? ""}
            onChange={(v) => set("tradesAndFavors", v)}
            placeholder="Record any favors, equipment loaned, staging help, or trade assistance done for trade partners today…"
            rows={3}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Keep track of favors, accommodations, and reciprocal trade assistance.
          </p>
        </div>
      </Section>

      {/* ── Notes & delays ─────────────────────────────────────────────────── */}
      <Section title="Notes & Delays">
        <div>
          <FieldLabel>Coordination issues, discrepancies, safety notes</FieldLabel>
          <FieldTextarea
            value={data.notes}
            onChange={(v) => set("notes", v)}
            placeholder="Record any coordination issues, schedule impacts, or safety observations…"
            rows={4}
          />
        </div>
      </Section>

      {/* ── STA & email ────────────────────────────────────────────────────── */}
      <Section title="Compliance & Notifications">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">STA Completed</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Safety Task Analysis completed &amp; briefing held
            </p>
          </div>
          <Switch
            checked={data.staCompleted}
            onCheckedChange={(v) => set("staCompleted", v)}
          />
        </div>

        <div>
          <FieldLabel>Send a Copy / Confirmation Email Address(es)</FieldLabel>
          <FieldInput
            type="text"
            value={data.emailRecipients.join(", ")}
            onChange={(v) =>
              set(
                "emailRecipients",
                v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="foreman@trade.com, copy@trade.com"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Optional. A PDF confirmation will be emailed to these addresses upon submission.
          </p>
          {hasInvalidEmail && (
            <span className="text-xs text-red-500 mt-1 block font-medium">
              Please enter valid email address(es) or leave blank.
            </span>
          )}
        </div>
      </Section>

      {/* ── Attached Documents & Photos ───────────────────────────────────── */}
      {((attachedFiles && attachedFiles.length > 0) || (staFiles && staFiles.length > 0)) && (
        <Section title="Uploaded Attachments">
          {attachedFiles && attachedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Daily Report Captures ({attachedFiles.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200"
                  >
                    <Paperclip size={13} className="text-blue-600 dark:text-blue-400" />
                    <span className="max-w-[180px] truncate">{file.name}</span>
                    {onAttachedFilesChange && (
                      <button
                        type="button"
                        onClick={() => onAttachedFilesChange(attachedFiles.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {staFiles && staFiles.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span>📋</span> Safety Task Analysis (STA) Photos ({staFiles.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {staFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs text-amber-900 dark:text-amber-200"
                  >
                    <Camera size={13} className="text-amber-600 dark:text-amber-400" />
                    <span className="max-w-[180px] truncate">{file.name}</span>
                    {onStaFilesChange && (
                      <button
                        type="button"
                        onClick={() => onStaFilesChange(staFiles.filter((_, i) => i !== idx))}
                        className="text-amber-400 hover:text-red-500 transition-colors ml-1"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Action buttons ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-1">
        {hasInvalidEmail && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center">
            * Please enter valid email address(es) or leave blank to submit
          </p>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={
            isSubmitting ||
            submitDisabled ||
            !data.date ||
            (requireTradePartner && (!data.tradePartnerName.trim() || isInvalidTrackedSelection)) ||
            hasInvalidEmail
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#0063a3" }}
        >
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Submitting…
            </>
          ) : (
            <>
              <Send size={16} />
              {submitLabel}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RotateCcw size={15} />
          Cancel &amp; Re-upload
        </button>
      </div>
    </div>
  );
}
