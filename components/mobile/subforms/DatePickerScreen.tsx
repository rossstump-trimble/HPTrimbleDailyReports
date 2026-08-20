"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { ChevronLeft, Check, X } from "lucide-react";

interface DatePickerScreenProps {
  value: string;
  onSave: (value: string) => void;
  onBack: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const YEARS = Array.from({ length: 21 }, (_, i) => String(2010 + i));

function parseDate(str: string): { month: number; day: number; year: number } {
  const parts = str.split("/");
  if (parts.length === 3) {
    const m = parseInt(parts[0], 10) - 1;
    const d = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const fullYear = y < 100 ? 2000 + y : y;
    const yi = YEARS.indexOf(String(fullYear));
    return {
      month: Math.max(0, Math.min(11, m)),
      day: Math.max(0, Math.min(30, d)),
      year: yi >= 0 ? yi : 6,
    };
  }
  return { month: 9, day: 15, year: 6 };
}

function formatDate(month: number, day: number, year: number): string {
  return `${month + 1}/${day + 1}/${YEARS[year].slice(2)}`;
}

const ITEM_H = 44;
const VISIBLE = 5;

interface DrumRollProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function DrumRoll({ items, selectedIndex, onSelect }: DrumRollProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmitted = useRef(selectedIndex);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = selectedIndex * ITEM_H;
      lastEmitted.current = selectedIndex;
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to new index when externally changed (e.g. "Today" button)
  const prevIdx = useRef(selectedIndex);
  useEffect(() => {
    if (prevIdx.current !== selectedIndex && ref.current) {
      ref.current.scrollTo({ top: selectedIndex * ITEM_H, behavior: "smooth" });
    }
    prevIdx.current = selectedIndex;
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      if (clamped !== lastEmitted.current) {
        lastEmitted.current = clamped;
        onSelect(clamped);
      }
    }, 80);
  }, [items.length, onSelect]);

  return (
    <div
      className="relative flex-1"
      style={{ height: ITEM_H * VISIBLE }}
    >
      {/* Selection highlight */}
      <div
        className="absolute left-0 right-0 border-t border-b border-gray-200 dark:border-gray-700 pointer-events-none z-10"
        style={{ top: ITEM_H * 2, height: ITEM_H }}
      />

      {/* Top fade */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-10 bg-gradient-to-b from-white dark:from-gray-900 to-transparent"
        style={{ height: ITEM_H * 2 }}
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"
        style={{ height: ITEM_H * 2 }}
      />

      {/* Scrollable column */}
      <div
        ref={ref}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-scroll"
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties}
      >
        {/* Top spacer */}
        <div style={{ height: ITEM_H * 2 }} />

        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIndex);
          return (
            <div
              key={i}
              style={{
                height: ITEM_H,
                scrollSnapAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: dist === 0 ? "17px" : "15px",
                fontWeight: dist === 0 ? 600 : 400,
                color: dist === 0
                  ? (isDark ? "#f3f4f6" : "#111827")
                  : dist === 1
                    ? (isDark ? "#9ca3af" : "#6b7280")
                    : (isDark ? "#6b7280" : "#9ca3af"),
                transition: "font-size 0.15s, color 0.15s",
              }}
            >
              {item}
            </div>
          );
        })}

        {/* Bottom spacer */}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

export default function DatePickerScreen({
  value,
  onSave,
  onBack,
}: DatePickerScreenProps) {
  const initial = parseDate(value);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);
  const [year, setYear] = useState(initial.year);

  const handleToday = () => {
    const now = new Date();
    setMonth(now.getMonth());
    setDay(now.getDate() - 1);
    const yi = YEARS.indexOf(String(now.getFullYear()));
    setYear(yi >= 0 ? yi : 10);
  };

  const handleClear = () => {
    onSave("");
    onBack();
  };

  const handleConfirm = () => {
    onSave(formatDate(month, day, year));
    onBack();
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-gray-900">
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
        <span className="flex-1 text-white font-semibold text-base">Due date</span>
      </header>

      {/* Spacer above picker */}
      <div className="flex-1" />

      {/* Drum-roll picker */}
      <div className="flex border-t border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <DrumRoll items={MONTHS} selectedIndex={month} onSelect={setMonth} />
        <DrumRoll items={DAYS} selectedIndex={day} onSelect={setDay} />
        <DrumRoll items={YEARS} selectedIndex={year} onSelect={setYear} />
      </div>

      {/* Action bar */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-none border-t border-gray-100 dark:border-gray-800"
      >
        {/* Clear */}
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <X size={16} />
          Clear
        </button>

        {/* Today */}
        <button
          onClick={handleToday}
          className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
        >
          Today
        </button>

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: "#2563eb" }}
          aria-label="Confirm"
        >
          <Check size={18} />
        </button>
      </div>

      {/* Spacer below */}
      <div className="flex-1" />
    </div>
  );
}
