"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  BarChart2,
  Bell,
  Camera,
  ChevronRight,
  Globe,
  HelpCircle,
  Moon,
  Send,
  Sparkles,
  X,
} from "lucide-react";

interface Props {
  onBack: () => void;
}

/* ─── types ──────────────────────────────────────────────── */
type Screen =
  | "main"
  | "region"
  | "usage"
  | "record-sync"
  | "resolution"
  | "synclog"
  | "log-info";

interface SyncEntry {
  type: "Fetch Files" | "Project Sync";
  project: string;
  company: string;
  datetime: string;
}

/* ─── mock data ──────────────────────────────────────────── */
const REGIONS = ["North America", "Europe", "Australia/New Zealand", "United Kingdom", "Enter Custom URL"];

const MODULES = [
  { label: "Action items",          size: 0.03 },
  { label: "Checklists",            size: 0.02 },
  { label: "Daily reports",         size: 4.83 },
  { label: "Drawings",              size: 14.99 },
  { label: "Field work directives", size: 0.02 },
  { label: "Issues",                size: 0.40 },
  { label: "Notices to comply",     size: 0.05 },
  { label: "Punch items",           size: 5.54 },
  { label: "RFIs",                  size: 1.38 },
  { label: "Safety notices",        size: 0.03 },
  { label: "Specifications",        size: 12.73 },
  { label: "Submittal packages",    size: 0.01 },
  { label: "Submittals",            size: 1.57 },
];

const SYNC_LOG_GROUPS = ["Sync Log for Past Hour", "Sync Log for Today", "Sync Log for Yesterday"];

const SYNC_ENTRIES: SyncEntry[] = [
  { type: "Fetch Files",   project: "Westminster Office Campus South", company: "Acme South, LLC", datetime: "7/9/26 10:49 AM" },
  { type: "Project Sync", project: "Westminster Office Campus South", company: "Acme South, LLC", datetime: "7/9/26 10:48 AM" },
  { type: "Fetch Files",   project: "Westminster Office Campus South", company: "Acme South, LLC", datetime: "7/9/26 10:46 AM" },
  { type: "Project Sync", project: "Westminster Office Campus South", company: "Acme South, LLC", datetime: "7/9/26 10:46 AM" },
  { type: "Fetch Files",   project: "Westminster Office Campus South", company: "Acme South, LLC", datetime: "7/9/26 10:45 AM" },
  { type: "Project Sync", project: "Westminster Office Campus South", company: "Acme South, LLC", datetime: "7/9/26 10:45 AM" },
];

const LOG_DETAIL = `Bookkeeping
7/9/26 10:49 AM
Ending with Completed

SyncJob
7/9/26 10:49 AM
Succeeded
Power: Battery
Charge Level: 89%

App UI Culture       : en
Language ID (TID)    : English
Language Code (TID)  : en-US
Device Culture       : en-US / English (United States)
Country Code         : United States
Short Date Format    : M/d/yy
Medium Date Format   : MMM d, y
Long Date Format     : MMMM d, y
Full Date Format     : EEEE, MMMM d, y
Time Format          : h:mm a
Short Date Example   : 7/9/26
Medium Date Example  : Jul 9, 2026
Long Date Example    : July 9, 2026
Full Date Example    : Thursday, July 9, 2026
Time Example         : 10:49 AM
DateTime Example     : 7/9/26 10:49 AM
Number Example       : 123,456
Currency Example     : $123,456.00

Estimates
Bytes Read: 0
Bytes Written: 0
Files Uploaded: 0
Records Uploaded: 0
Records Fetched: 0`;

/* ─── shared header ──────────────────────────────────────── */
function SubHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
      <button onClick={onBack} className="text-white p-1 mr-2">
        <ChevronRight size={20} className="rotate-180" />
      </button>
      <h1 className="text-white font-semibold text-base flex-1">{title}</h1>
      {right ?? <HelpCircle size={20} className="text-white opacity-80" />}
    </header>
  );
}

/* ─── Toggle ─────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors flex-none ${on ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

/* ─── Radio ──────────────────────────────────────────────── */
function RadioRow({
  label,
  selected,
  onSelect,
  variant = "circle",
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  variant?: "circle" | "check";
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 last:border-0"
    >
      <span className="text-sm text-gray-800 dark:text-gray-100">{label}</span>
      {variant === "circle" ? (
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? "border-blue-600 dark:border-blue-400" : "border-gray-300 dark:border-gray-600"}`}>
          {selected && <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
        </span>
      ) : (
        selected && (
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )
      )}
    </button>
  );
}

/* ─── SettingsScreen ─────────────────────────────────────── */
export default function SettingsScreen({ onBack }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const darkMode = resolvedTheme === "dark";

  const [aiCentricMode, setAiCentricModeState] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ps-ai-centric-mode") === "1";
  });

  const setAiCentricMode = (v: boolean) => {
    setAiCentricModeState(v);
    localStorage.setItem("ps-ai-centric-mode", v ? "1" : "0");
  };

  const [screen, setScreen]           = useState<Screen>("main");
  const [region, setRegion]           = useState("North America");
  const [pendingRegion, setPending]   = useState("North America");
  const [resolution, setResolution]   = useState("Medium");
  const [activeModule, setActiveModule] = useState("");
  const [activeLogEntry, setActiveLog] = useState<SyncEntry | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [attachAutoUpdate, setAttachAuto]  = useState(false);
  const [drawingAutoUpdate, setDrawAuto]   = useState(false);
  const [specAutoUpdate, setSpecAuto]      = useState(false);

  /* ── main ── */
  if (screen === "main") return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button className="text-white p-1 mr-3" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-white font-semibold text-base flex-1">Settings</h1>
        <button className="relative p-2 text-white mr-1" onClick={() => setNotificationsOpen(true)}>
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">6</span>
        </button>
        <button className="p-2 text-white"><HelpCircle size={20} /></button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800">
          {/* AI Centric Mode */}
          <div className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-none" style={{ backgroundColor: "#7c3aed" }}>
              <Sparkles size={20} className="text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-800 dark:text-gray-100">AI Centric Mode</span>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">Replace home shortcuts with an AI-powered overview</p>
            </div>
            <Toggle on={aiCentricMode} onChange={setAiCentricMode} />
          </div>
          {/* Dark mode */}
          <div className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-none" style={{ backgroundColor: "#374151" }}>
              <Moon size={20} className="text-white" />
            </span>
            <span className="flex-1 text-sm text-gray-800 dark:text-gray-100 text-left">Dark mode</span>
            <Toggle on={darkMode} onChange={(v) => setTheme(v ? "dark" : "light")} />
          </div>
          {[
            { icon: <Globe size={20} className="text-white" />, bg: "#2563eb", label: "Data center region", value: region.replace(" ", ""), screen: "region" as Screen },
            { icon: <BarChart2 size={20} className="text-white" />, bg: "#1d4ed8", label: "Usage & Sync", value: "67.44 MB", screen: "usage" as Screen },
            { icon: <Camera size={20} className="text-white" />, bg: "#1d4ed8", label: "Photo Resolution", value: resolution, screen: "resolution" as Screen },
            { icon: <AlertTriangle size={20} className="text-white" />, bg: "#d97706", label: "Sync Log", value: "", screen: "synclog" as Screen },
          ].map(item => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 bg-white dark:bg-gray-900"
              onClick={() => setScreen(item.screen)}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-none" style={{ backgroundColor: item.bg }}>
                {item.icon}
              </span>
              <span className="flex-1 text-sm text-gray-800 dark:text-gray-100 text-left">{item.label}</span>
              <span className="text-sm text-gray-400 dark:text-gray-500 mr-1">{item.value}</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 mt-4 border-t border-b border-gray-200 dark:border-gray-800">
          <button className="w-full py-3.5 text-center text-red-600 dark:text-red-400 text-sm font-medium">
            Remove Project
          </button>
        </div>
      </div>
    </div>
  );

  /* ── region ── */
  if (screen === "region") return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
      <SubHeader title="Data center region" onBack={() => setScreen("main")} right={null} />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800">
          {REGIONS.map(r => (
            <RadioRow key={r} label={r} selected={pendingRegion === r} onSelect={() => setPending(r)} />
          ))}
        </div>
      </div>
      <div className="px-4 pb-6 pt-3 flex justify-end bg-gray-100 dark:bg-gray-950">
        <button
          className="px-6 py-2.5 text-sm font-bold text-white rounded"
          style={{ backgroundColor: "#1b3a5c" }}
          onClick={() => { setRegion(pendingRegion); setScreen("main"); }}
        >
          CONFIRM
        </button>
      </div>
    </div>
  );

  /* ── usage ── */
  if (screen === "usage") return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
      <SubHeader title="Usage & Sync" onBack={() => setScreen("main")} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-950">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">SPACE AVAILABLE: 10.46 GB</span>
        </div>
        <div className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Project Size</span>
            <span className="text-sm font-semibold text-red-500 dark:text-red-400">67.44 MB</span>
          </div>
          {MODULES.map(m => (
            <button
              key={m.label}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 bg-white dark:bg-gray-900"
              onClick={() => { setActiveModule(m.label); setScreen("record-sync"); }}
            >
              <span className="text-sm text-gray-800 dark:text-gray-100">{m.label}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400 dark:text-gray-500">{m.size.toFixed(2)} MB</span>
                <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── record-sync ── */
  if (screen === "record-sync") return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
      <SubHeader title={`${activeModule} Settings`} onBack={() => setScreen("usage")} />
      <div className="flex-1 overflow-y-auto">
        {[
          { group: "ATTACHMENTS",          fileSize: "4.11 MB", autoOn: attachAutoUpdate, setAuto: setAttachAuto },
          { group: "LINKED DRAWINGS",      fileSize: "1.30 MB", autoOn: drawingAutoUpdate, setAuto: setDrawAuto },
          { group: "LINKED SPECIFICATIONS",fileSize: "0 MB",    autoOn: specAutoUpdate,   setAuto: setSpecAuto },
        ].map(section => (
          <div key={section.group} className="mt-3">
            <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-950">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{section.group}</span>
            </div>
            <div className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-100">File Size</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 mr-3">{section.fileSize}</span>
                <button className="px-4 py-1.5 bg-red-600 text-white text-sm font-semibold rounded">Delete</button>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-800 dark:text-gray-100">Auto Update</span>
                <Toggle on={section.autoOn} onChange={section.setAuto} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── resolution ── */
  if (screen === "resolution") return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
      <SubHeader title="Photo Resolution" onBack={() => setScreen("main")} />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800">
          {["Low", "Medium", "High"].map(r => (
            <RadioRow key={r} label={r} selected={resolution === r} onSelect={() => setResolution(r)} variant="check" />
          ))}
        </div>
      </div>
    </div>
  );

  /* ── synclog ── */
  if (screen === "synclog") return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
      <SubHeader title="Sync Log" onBack={() => setScreen("main")} right={<span />} />
      <div className="flex-1 overflow-y-auto">
        {/* grouped headers */}
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800">
          {SYNC_LOG_GROUPS.map(g => (
            <button key={g} className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <span className="text-sm text-gray-800 dark:text-gray-100">{g}</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </button>
          ))}
        </div>

        {/* individual entries */}
        <div className="bg-white dark:bg-gray-900 mt-4 border-t border-b border-gray-200 dark:border-gray-800">
          {SYNC_ENTRIES.map((entry, i) => (
            <button
              key={i}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 bg-white dark:bg-gray-900 text-left"
              onClick={() => { setActiveLog(entry); setScreen("log-info"); }}
            >
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{entry.type}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{entry.project}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{entry.company}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{entry.datetime}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 flex-none" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── log-info ── */
  if (screen === "log-info" && activeLogEntry) return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white dark:bg-gray-900">
      <SubHeader
        title="Log Information"
        onBack={() => setScreen("synclog")}
        right={<Send size={20} className="text-white opacity-80" />}
      />
      <div className="flex-1 overflow-y-auto">
        {/* breadcrumb */}
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-400 dark:text-gray-500">Sync Log for Today</span>
        </div>
        {/* gray header bar */}
        <div className="px-4 py-3 bg-gray-200 dark:bg-gray-800">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {activeLogEntry.type} — {activeLogEntry.project} ({activeLogEntry.company}) — {activeLogEntry.datetime.split(" ")[1]}
          </p>
        </div>
        {/* monospace log */}
        <div className="px-4 py-4">
          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{LOG_DETAIL}</pre>
        </div>
      </div>
    </div>
  );

  return null;
}
