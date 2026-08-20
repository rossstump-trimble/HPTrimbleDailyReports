"use client";

import { useCallback } from "react";
import { Minus, Plus, RotateCcw, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CrewEntry, DailyReport, TradePartner } from "@/types/hpproto";

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

export type DailyFormData = Omit<DailyReport, "id" | "projectId" | "submittedAt" | "submittedBy" | "rawSourceFileName">;

interface DailyConfirmCardProps {
  tradePartners: TradePartner[];
  initialData: DailyFormData;
  data: DailyFormData;
  onChange: (data: DailyFormData) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DailyConfirmCard({
  tradePartners,
  data,
  onChange,
  onCancel,
  onSubmit,
  isSubmitting = false,
}: DailyConfirmCardProps) {
  const set = useCallback(
    <K extends keyof DailyFormData>(key: K, value: DailyFormData[K]) => {
      onChange({ ...data, [key]: value });
    },
    [data, onChange],
  );

  // ── crew helpers ────────────────────────────────────────────────────────────

  const updateCrew = (index: number, field: keyof CrewEntry, value: string | number) => {
    const updated = data.crewBreakdown.map((row, i) =>
      i === index ? { ...row, [field]: field === "count" ? Number(value) : value } : row,
    );
    const totalWorkers = updated.reduce((s, r) => s + r.count, 0);
    onChange({ ...data, crewBreakdown: updated, workerCount: totalWorkers });
  };

  const addCrewRow = () => {
    const updated = [...data.crewBreakdown, { craft: "", count: 1 }];
    onChange({
      ...data,
      crewBreakdown: updated,
      workerCount: updated.reduce((s, r) => s + r.count, 0),
    });
  };

  const removeCrewRow = (index: number) => {
    const updated = data.crewBreakdown.filter((_, i) => i !== index);
    onChange({
      ...data,
      crewBreakdown: updated,
      workerCount: updated.reduce((s, r) => s + r.count, 0),
    });
  };

  const derivedWorkerCount = data.crewBreakdown.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-4">
      {/* ── Trade partner & date ───────────────────────────────────────────── */}
      <Section title="Report Details">
        <div>
          <FieldLabel required>Trade Partner</FieldLabel>
          <select
            value={data.tradePartnerId}
            onChange={(e) => {
              const tp = tradePartners.find((t) => t.id === e.target.value);
              onChange({
                ...data,
                tradePartnerId: e.target.value,
                tradePartnerName: tp?.name ?? "",
              });
            }}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition"
          >
            <option value="">— Select trade partner —</option>
            {tradePartners.map((tp) => (
              <option key={tp.id} value={tp.id}>
                {tp.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel required>Report Date</FieldLabel>
          <FieldInput
            type="date"
            value={data.date}
            onChange={(v) => set("date", v)}
          />
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
          {data.crewBreakdown.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">No crew rows — add one below.</p>
          )}
          {data.crewBreakdown.map((row, i) => (
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
              <button
                type="button"
                onClick={() => removeCrewRow(i)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                aria-label="Remove crew row"
              >
                <Minus size={16} />
              </button>
            </div>
          ))}
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
            <FieldInput
              type="number"
              value={data.workerCount || derivedWorkerCount}
              onChange={(v) => set("workerCount", Number(v))}
              placeholder="0"
            />
          </div>
          <div>
            <FieldLabel>Total Hours</FieldLabel>
            <FieldInput
              type="number"
              value={data.totalHours}
              onChange={(v) => set("totalHours", Number(v))}
              placeholder="0"
            />
          </div>
        </div>
      </Section>

      {/* ── Equipment ──────────────────────────────────────────────────────── */}
      <Section title="Equipment on Site">
        <div>
          <FieldLabel>Equipment (comma-separated)</FieldLabel>
          <FieldInput
            value={data.equipment.join(", ")}
            onChange={(v) =>
              set(
                "equipment",
                v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="e.g. Excavator, Boom Lift, Concrete Pump"
          />
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
          <FieldLabel>Optional Email Copy</FieldLabel>
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
            placeholder="comma@separated.com, emails@here.com"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            A PDF confirmation will be emailed to these addresses
          </p>
        </div>
      </Section>

      {/* ── Action buttons ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !data.tradePartnerId || !data.date}
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
              Confirm &amp; Submit Daily
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
