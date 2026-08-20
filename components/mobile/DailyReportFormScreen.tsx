"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  Paperclip,
  Plus,
  Save,
  Trash2,
  Wind,
  X,
  XCircle,
} from "lucide-react";
import { getMockRecords } from "@/lib/mobile/mockData";
import AttachmentsSheet from "./subforms/AttachmentsSheet";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeatherEntry {
  id: string;
  time: string;
  temp: number;
  humidity: number;
  wind: number;
  gusts: number;
  condition: "Clear" | "Partly Cloudy" | "Cloudy" | "Rain" | "Thunderstorm";
}

interface LaborEntry {
  id: string;
  company: string;
  crew: string;
  status: "Pending" | "Approved";
  location: string;
  description: string;
  workers: { name: string; hours: string }[];
}

interface EquipmentEntry {
  id: string;
  equipment: string;
  rate: number;
  company: string;
  crew: string;
  qty: number;
  location: string;
  hours: string;
  notes: string;
}

type SubScreen =
  | "status"
  | "weather-log"
  | "edit-weather"
  | "labor"
  | "add-labor"
  | "edit-labor"
  | "add-equipment";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_WEATHER_LOG: WeatherEntry[] = [
  { id: "w1", time: "01:53 PM", temp: 92, humidity: 31, wind: 5, gusts: 0, condition: "Clear" },
  { id: "w2", time: "12:53 PM", temp: 88, humidity: 34, wind: 3, gusts: 0, condition: "Clear" },
  { id: "w3", time: "11:53 AM", temp: 82, humidity: 41, wind: 0, gusts: 0, condition: "Clear" },
  { id: "w4", time: "10:53 AM", temp: 76, humidity: 50, wind: 0, gusts: 0, condition: "Clear" },
  { id: "w5", time: "09:53 AM", temp: 71, humidity: 57, wind: 5, gusts: 0, condition: "Clear" },
  { id: "w6", time: "08:53 AM", temp: 67, humidity: 66, wind: 6, gusts: 8, condition: "Clear" },
];

const MOCK_LABOR: LaborEntry[] = [
  {
    id: "l1",
    company: "Sample Company",
    crew: "Day Crew",
    status: "Pending",
    location: "",
    description: "",
    workers: [
      { name: "Jesse Lavine", hours: "8h 00m" },
      { name: "Paula Standley (Sample)", hours: "8h 00m" },
      { name: "Scott Casey (Sample)", hours: "8h 00m" },
      { name: "Frank Ochoa (Acme)", hours: "8h 00m" },
    ],
  },
];

const CONDITION_ICON = (c: WeatherEntry["condition"]) => {
  if (c === "Clear") return "☀";
  if (c === "Partly Cloudy") return "⛅";
  if (c === "Cloudy") return "☁";
  if (c === "Rain") return "🌧";
  return "⛈";
};

// ─── Shared sub-header ────────────────────────────────────────────────────────

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
    <header className="flex items-center px-3 py-3 flex-none gap-2" style={{ backgroundColor: "#1b3a5c" }}>
      <button onClick={onBack} className="text-white p-1">
        <ChevronRight size={20} className="rotate-180" />
      </button>
      <h1 className="flex-1 text-white font-semibold text-base truncate">{title}</h1>
      {right}
    </header>
  );
}

function DoneBtn({ onPress }: { onPress: () => void }) {
  return (
    <button onClick={onPress} className="text-white text-sm font-semibold px-1">
      Done
    </button>
  );
}

// ─── Weather Log screen ───────────────────────────────────────────────────────

function WeatherLogScreen({
  log,
  onBack,
  onEdit,
  onAdd,
}: {
  log: WeatherEntry[];
  onBack: () => void;
  onEdit: (entry: WeatherEntry) => void;
  onAdd: () => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-gray-100 dark:bg-gray-950">
      <SubHeader title="Weather" onBack={onBack} right={
        <button onClick={onAdd} className="text-white p-1"><Plus size={20} /></button>
      } />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">Notes</p>
          <input
            className="w-full text-sm text-gray-600 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent focus:outline-none"
            placeholder="Enter short note..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <div className="px-4 pt-3 pb-1">
          <span className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400">LOG</span>
        </div>
        <div className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-800">
          {log.map((entry, i) => (
            <div key={entry.id} className={`flex items-center justify-between px-4 py-3 ${i < log.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
              <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                <span className="w-16 text-gray-600 dark:text-gray-300 flex-none">{entry.time}</span>
                <span>{CONDITION_ICON(entry.condition)} {entry.temp}°</span>
                <span>💧 {entry.humidity}%</span>
                <span className="flex items-center gap-0.5">
                  <Wind size={12} className="text-gray-500 dark:text-gray-400" /> {entry.wind} mph
                </span>
              </div>
              <button onClick={() => onEdit(entry)} className="text-gray-400 dark:text-gray-500 p-1">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Weather screen ──────────────────────────────────────────────────────

const CONDITIONS: WeatherEntry["condition"][] = ["Clear", "Partly Cloudy", "Cloudy", "Rain", "Thunderstorm"];

function EditWeatherScreen({
  entry,
  onBack,
  onSave,
  onDelete,
}: {
  entry: WeatherEntry | null;
  onBack: () => void;
  onSave: (e: WeatherEntry) => void;
  onDelete?: () => void;
}) {
  const blank: WeatherEntry = { id: Date.now().toString(), time: "12:00 PM", temp: 75, humidity: 40, wind: 0, gusts: 0, condition: "Clear" };
  const [form, setForm] = useState<WeatherEntry>(entry ?? blank);
  const set = (k: keyof WeatherEntry, v: WeatherEntry[keyof WeatherEntry]) => setForm(f => ({ ...f, [k]: v }));

  const rows = [
    { label: "Time", required: true, value: form.time, display: form.time },
    { label: "Temperature", required: true, value: `${form.temp}`, display: `${form.temp} °F` },
    { label: "Conditions", required: true, value: form.condition, display: `${form.condition} ${CONDITION_ICON(form.condition)}` },
    { label: "Humidity", required: false, value: `${form.humidity}`, display: `${form.humidity} %` },
    { label: "Wind", required: false, value: `${form.wind}`, display: `${form.wind} mph` },
    { label: "Gusts", required: false, value: `${form.gusts}`, display: `${form.gusts} mph` },
  ];

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gray-100 dark:bg-gray-950">
      <SubHeader
        title={entry ? "Edit Weather" : "Add Weather"}
        onBack={onBack}
        right={
          <div className="flex items-center gap-1">
            {onDelete && <button onClick={onDelete} className="text-white p-1"><Trash2 size={18} /></button>}
            <button className="text-white p-1"><Plus size={20} /></button>
            <button onClick={() => { onSave(form); onBack(); }} className="text-white/40 text-sm font-semibold px-1">Done</button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800">
          {rows.map((row, i) => (
            <div key={row.label} className={`flex items-center justify-between px-4 py-3.5 ${i < rows.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-800 dark:text-gray-100">{row.label}</span>
                {row.required && <span className="text-red-500 text-sm">*</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 dark:text-gray-500">{row.display}</span>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Labor list screen ────────────────────────────────────────────────────────

function LaborScreen({
  labor,
  onBack,
  onAdd,
  onEdit,
}: {
  labor: LaborEntry[];
  onBack: () => void;
  onAdd: () => void;
  onEdit: (l: LaborEntry) => void;
}) {
  const totalWorkers = labor.reduce((s, l) => s + l.workers.length, 0);
  const totalHours = labor.reduce((s, l) => s + l.workers.length * 8, 0);
  const hh = Math.floor(totalHours).toString().padStart(2, "0");

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-gray-100 dark:bg-gray-950">
      <SubHeader title="Labor" onBack={onBack} right={
        <div className="flex items-center gap-1">
          <button className="text-white p-1">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <button className="text-white p-1"><Copy size={18} /></button>
          <button onClick={onAdd} className="text-white p-1"><Plus size={20} /></button>
        </div>
      } />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-1">
          <Clock size={22} className="text-gray-500 dark:text-gray-400" />
          <span className="text-2xl font-light text-gray-800 dark:text-gray-100">{hh}h 00m</span>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 ml-9">{hh}h 00m pending</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 ml-9 mb-4">{totalWorkers} workers</p>

        {labor.map(l => (
          <button
            key={l.id}
            onClick={() => onEdit(l)}
            className="w-full bg-white dark:bg-gray-900 rounded-xl px-4 py-3 mb-2 flex items-center justify-between shadow-sm text-left"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{l.company}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{l.crew} · {l.workers.length} workers</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Add / Edit Labor screen ──────────────────────────────────────────────────

function EditLaborScreen({
  entry,
  isAdd,
  onBack,
  onSave,
  onDelete,
}: {
  entry: LaborEntry;
  isAdd: boolean;
  onBack: () => void;
  onSave: (l: LaborEntry) => void;
  onDelete: () => void;
}) {
  const [form, setForm] = useState<LaborEntry>(entry);
  const [showAttachments, setShowAttachments] = useState(false);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gray-100 dark:bg-gray-950">
      <SubHeader
        title={isAdd ? "Add Labor" : "Edit Labor"}
        onBack={onBack}
        right={
          <div className="flex items-center gap-1">
            <button onClick={onDelete} className="text-white p-1"><Trash2 size={18} /></button>
            <button className="text-white p-1"><Plus size={20} /></button>
            <DoneBtn onPress={() => { onSave(form); onBack(); }} />
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Top fields */}
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800">
          {[
            { label: "Company", required: true, value: form.company },
            { label: "Crew", required: true, value: form.crew },
          ].map((row, i) => (
            <div key={row.label} className={`flex items-center justify-between px-4 py-3.5 ${i === 0 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-800 dark:text-gray-100">{row.label}</span>
                {row.required && <span className="text-red-500 text-sm">*</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 dark:text-gray-500">{row.value || ""}</span>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
              </div>
            </div>
          ))}

          {/* Status */}
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">Status</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{form.status}</span>
              <span className="w-4 h-4 rounded-full bg-blue-500 flex-none" />
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">Location</span>
            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
          </div>
        </div>

        {/* Work description */}
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800 px-4 py-3.5">
          <p className="text-sm text-gray-800 dark:text-gray-100 mb-1">Work description</p>
          <input
            className="w-full text-sm text-gray-600 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent focus:outline-none"
            placeholder="Enter a short description..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        {/* Attachments */}
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800">
          <div className="pt-3.5 pb-3">
            <div className="px-4 mb-2">
              <span className="text-sm text-gray-800 dark:text-gray-100">Attachments</span>
            </div>
            <div className="flex items-center pl-4">
              <div className="flex-1" />
              <button
                onClick={() => setShowAttachments(true)}
                className="w-14 h-16 rounded-l-xl text-white flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#1b3a5c" }}
              >
                <Plus size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Workers */}
        <div className="mt-3">
          <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800">
            <span className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400">WORKERS</span>
          </div>
          <div className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-gray-400 dark:text-gray-500" />
                <span className="text-xl font-light text-gray-800 dark:text-gray-100">
                  {(form.workers.length * 8).toString().padStart(2, "0")}h 00m
                </span>
              </div>
              <button className="text-gray-400 dark:text-gray-500"><Plus size={20} /></button>
            </div>
            <div className="px-4 py-1.5 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-400 dark:text-gray-500">{form.workers.length} workers</span>
            </div>
            {form.workers.map((w, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < form.workers.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{w.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{w.hours}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-6" />
      </div>
      {showAttachments && <AttachmentsSheet onClose={() => setShowAttachments(false)} />}
    </div>
  );
}

// ─── Add Equipment screen ─────────────────────────────────────────────────────

function AddEquipmentScreen({ onBack }: { onBack: () => void }) {
  const [equipment, setEquipment] = useState("");
  const [rate, setRate] = useState("0.00");
  const [company, setCompany] = useState("");
  const [crew, setCrew] = useState("");
  const [qty, setQty] = useState("0.0");
  const [notes, setNotes] = useState("");

  const rows = [
    { label: "Equipment", required: true, value: equipment },
    { label: "Rate", required: false, value: rate || "0.00" },
    { label: "Company", required: true, value: company },
    { label: "Crew", required: false, value: crew },
    { label: "Qty.", required: false, value: qty || "0.0" },
    { label: "Location", required: false, value: "" },
    { label: "Hours", required: false, value: "" },
    { label: "Total Hours", required: false, value: "" },
  ];

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gray-100 dark:bg-gray-950">
      <SubHeader
        title="Add Equipment"
        onBack={onBack}
        right={
          <div className="flex items-center gap-1">
            <button className="text-white p-1">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button className="text-white p-1"><Trash2 size={18} /></button>
            <button className="text-white p-1"><Plus size={20} /></button>
            <DoneBtn onPress={onBack} />
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800">
          {rows.map((row, i) => (
            <div key={row.label} className={`flex items-center justify-between px-4 py-3.5 ${i < rows.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-800 dark:text-gray-100">{row.label}</span>
                {row.required && <span className="text-red-500 text-sm">*</span>}
              </div>
              <div className="flex items-center gap-2">
                {row.value ? <span className="text-sm text-gray-400 dark:text-gray-500">{row.value}</span> : null}
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800 px-4 py-3.5">
          <p className="text-sm text-gray-800 dark:text-gray-100 mb-1">Notes</p>
          <input
            className="w-full text-sm text-gray-600 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent focus:outline-none"
            placeholder="Enter short note..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main DailyReportFormScreen ───────────────────────────────────────────────

interface Props {
  projectId: string;
  recordId: string;
}

export default function DailyReportFormScreen({ projectId, recordId }: Props) {
  const router = useRouter();
  const isNew = recordId === "new";
  const records = getMockRecords("daily-reports");
  const record = isNew ? null : (records.find(r => r.id === recordId) ?? records[0]);

  const rawDate = record?.title?.replace("Daily Report — ", "") ?? "Today";
  const dateLabel = rawDate === "Today" ? "Jul 9, 2026" : rawDate;

  // State
  const [status,     setStatus]     = useState("Pending");
  const [notes,      setNotes]      = useState("");
  const [weatherLog, setWeatherLog] = useState<WeatherEntry[]>(MOCK_WEATHER_LOG);
  const [labor,      setLabor]      = useState<LaborEntry[]>(isNew ? [] : MOCK_LABOR);
  const [showAttachments, setShowAttachments] = useState(false);

  const currentWeather = weatherLog[0];

  // Sub-screen stack
  const [subScreen,     setSubScreen]     = useState<SubScreen | null>(null);
  const [subVisible,    setSubVisible]    = useState(false);
  const [editingWeather,setEditingWeather]= useState<WeatherEntry | null>(null);
  const [editingLabor,  setEditingLabor]  = useState<LaborEntry | null>(null);
  const [isAddLabor,    setIsAddLabor]    = useState(false);

  const openSub = useCallback((s: SubScreen) => {
    setSubScreen(s);
    requestAnimationFrame(() => requestAnimationFrame(() => setSubVisible(true)));
  }, []);
  const closeSub = useCallback(() => {
    setSubVisible(false);
    setTimeout(() => setSubScreen(null), 220);
  }, []);

  const totalLaborHours = labor.reduce((s, l) => s + l.workers.length * 8, 0);
  const totalWorkers    = labor.reduce((s, l) => s + l.workers.length, 0);

  return (
    <div className="flex flex-col flex-1 bg-gray-100 dark:bg-gray-950 overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center px-3 py-3 flex-none gap-2" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={() => router.back()} className="text-white p-1"><X size={20} /></button>
        <h1 className="flex-1 text-white font-semibold text-base">Daily report</h1>
        <button className="text-white p-1 opacity-80"><Copy size={20} /></button>
        <button className="text-white p-1 opacity-80"><Save size={20} /></button>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Title card */}
        <div className="bg-white dark:bg-gray-900 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">{dateLabel}</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">Westminster Office Campus South</p>
        </div>

        {/* Core fields */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">Status</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{status}</span>
              <span className="w-4 h-4 rounded-full bg-gray-400 flex-none" />
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-gray-800 dark:text-gray-100">Lost productivity</span>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
              </svg>
              <span className="text-sm text-gray-400 dark:text-gray-500">00h 00m</span>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>
        </div>

        {/* Weather card */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => openSub("weather-log")}
            className="w-full px-4 pt-4 pb-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <h3 className="text-base font-bold text-blue-700 dark:text-blue-400 mb-2">Weather</h3>
            {currentWeather && (
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{CONDITION_ICON(currentWeather.condition)}</span>
                    <span className="text-2xl font-light text-gray-700 dark:text-gray-200">{currentWeather.temp} °F</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{currentWeather.humidity}% humidity</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{currentWeather.wind} mph wind</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Sacramento, CA</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Thursday {currentWeather.time}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{currentWeather.condition}</p>
                </div>
              </div>
            )}
          </button>
          <div className="border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-800 dark:text-gray-100">Total rain or snow</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 dark:text-gray-500">Auto populated</span>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
              </div>
            </div>
            <button
              onClick={() => openSub("weather-log")}
              className="w-full flex items-center justify-end px-4 py-3 gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Weather log</span>
              <ChevronRight size={16} className="text-blue-400 dark:text-blue-300" />
            </button>
          </div>
        </div>

        {/* Labor card */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            <button onClick={() => openSub("labor")} className="text-base font-bold text-blue-700 dark:text-blue-400">
              Labor
            </button>
            <button onClick={() => { setIsAddLabor(true); setEditingLabor({ id: Date.now().toString(), company: "Trimble", crew: "Day Crew", status: "Pending", location: "", description: "", workers: [] }); openSub("add-labor"); }}>
              <Plus size={20} className="text-gray-400 dark:text-gray-500" />
            </button>
          </div>
          {labor.length > 0 ? (
            <div className="px-4 py-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">{totalLaborHours}h 00m · {totalWorkers} workers</p>
            </div>
          ) : (
            <div className="px-4 py-3">
              <p className="text-sm text-gray-300 dark:text-gray-600">No labor added yet</p>
            </div>
          )}
        </div>

        {/* Equipment card */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-base font-bold text-blue-700 dark:text-blue-400">Equipment</span>
            <div className="flex items-center gap-2">
              <button onClick={() => openSub("add-equipment")} className="text-gray-400 dark:text-gray-500">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button onClick={() => openSub("add-equipment")} className="text-gray-400 dark:text-gray-500">
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Notes card */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-gray-100 dark:border-gray-800 px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-blue-700 dark:text-blue-400">Notes</h3>
            <div className="flex items-center gap-3">
              <button className="text-gray-400 dark:text-gray-500"><Camera size={18} /></button>
              <button className="text-gray-400 dark:text-gray-500"><FileText size={18} /></button>
            </div>
          </div>
          <input
            className="w-full text-sm text-gray-600 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent focus:outline-none"
            placeholder="Type something..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Records / Web links / Assign */}
        <div className="bg-white dark:bg-gray-900 mb-4 border-t border-gray-100 dark:border-gray-800">
          {[
            { label: "Records",   right: <Plus size={18} className="text-gray-400 dark:text-gray-500" /> },
            { label: "Web links", right: <Plus size={18} className="text-gray-400 dark:text-gray-500" /> },
            { label: "Assign",    right: <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" /> },
          ].map((row, i) => (
            <div key={row.label} className={`flex items-center justify-between px-4 py-3.5 ${i > 0 ? "border-t border-gray-100 dark:border-gray-800" : ""}`}>
              <span className="text-sm text-gray-800 dark:text-gray-100">{row.label}</span>
              {row.right}
            </div>
          ))}
        </div>
        <div className="h-4" />
      </div>

      {/* Sub-screen overlay */}
      {subScreen && (
        <div
          className="absolute inset-0 z-10"
          style={{ transform: subVisible ? "translateX(0)" : "translateX(100%)", transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)" }}
        >
          {subScreen === "weather-log" && (
            <WeatherLogScreen
              log={weatherLog}
              onBack={closeSub}
              onAdd={() => { setEditingWeather(null); openSub("edit-weather"); }}
              onEdit={e => { setEditingWeather(e); openSub("edit-weather"); }}
            />
          )}
          {subScreen === "edit-weather" && (
            <EditWeatherScreen
              entry={editingWeather}
              onBack={() => { setSubScreen("weather-log"); setSubVisible(true); }}
              onSave={updated => {
                setWeatherLog(prev =>
                  editingWeather
                    ? prev.map(e => e.id === updated.id ? updated : e)
                    : [updated, ...prev]
                );
              }}
              onDelete={editingWeather ? () => {
                setWeatherLog(prev => prev.filter(e => e.id !== editingWeather.id));
                setSubScreen("weather-log"); setSubVisible(true);
              } : undefined}
            />
          )}
          {subScreen === "labor" && (
            <LaborScreen
              labor={labor}
              onBack={closeSub}
              onAdd={() => { setIsAddLabor(true); setEditingLabor({ id: Date.now().toString(), company: "Trimble", crew: "Day Crew", status: "Pending", location: "", description: "", workers: [] }); openSub("add-labor"); }}
              onEdit={l => { setIsAddLabor(false); setEditingLabor(l); openSub("edit-labor"); }}
            />
          )}
          {(subScreen === "add-labor" || subScreen === "edit-labor") && editingLabor && (
            <EditLaborScreen
              entry={editingLabor}
              isAdd={isAddLabor}
              onBack={() => { setSubScreen("labor"); setSubVisible(true); }}
              onSave={updated => setLabor(prev =>
                isAddLabor ? [...prev, updated] : prev.map(l => l.id === updated.id ? updated : l)
              )}
              onDelete={() => { setLabor(prev => prev.filter(l => l.id !== editingLabor.id)); setSubScreen("labor"); setSubVisible(true); }}
            />
          )}
          {subScreen === "add-equipment" && (
            <AddEquipmentScreen onBack={closeSub} />
          )}
        </div>
      )}

      {showAttachments && <AttachmentsSheet onClose={() => setShowAttachments(false)} />}
    </div>
  );
}
