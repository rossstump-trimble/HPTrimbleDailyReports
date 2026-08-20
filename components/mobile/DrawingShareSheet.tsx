"use client";

import { Copy, Pencil, Printer, ChevronDown } from "lucide-react";

interface DrawingShareSheetProps {
  drawingNumber: string;
  drawingName: string;
  onClose: () => void;
}

const MOCK_CONTACTS = [
  { initials: "AJ", name: "Alex\nJohnson",  bg: "#6366f1" },
  { initials: "MG", name: "Maria\nGarcia",  bg: "#ec4899" },
  { initials: "JL", name: "James\nLee",     bg: "#f97316" },
  { initials: "SC", name: "Sarah\nChen",    bg: "#14b8a6" },
];

const SHARE_APPS = [
  {
    label: "AirDrop",
    bg: "linear-gradient(135deg,#38bdf8,#6366f1)",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="white" strokeWidth="1.8">
        <path d="M12 2v10M8 6l4-4 4 4M6 14a6 6 0 1012 0" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Messages",
    bg: "#22c55e",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
        <path d="M20 2H4a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
      </svg>
    ),
  },
  {
    label: "Drive",
    bg: "white",
    icon: (
      <svg viewBox="0 0 87.3 78" className="w-7 h-7">
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
        <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9 9 0 000 53h27.5z" fill="#00ac47"/>
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5A9 9 0 0087.3 53H59.8l5.4 9.35z" fill="#ea4335"/>
        <path d="M43.65 25L57.4 0H30.6L43.65 25z" fill="#00832d"/>  
        <path d="M59.8 53H87.3a9 9 0 00-1.2-4.5L61.3 3.3A8.9 8.9 0 0058 0H43.65L59.8 53z" fill="#2684fc"/>
        <path d="M27.5 53L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2L59.8 53z" fill="#ffba00"/>
      </svg>
    ),
  },
  {
    label: "Discord",
    bg: "#5865f2",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
        <path d="M20.3 4.4A19.6 19.6 0 0015.5 3c-.2.4-.5.9-.7 1.3a18.2 18.2 0 00-5.5 0C9.1 3.9 8.8 3.4 8.5 3A19.5 19.5 0 003.7 4.4C.5 9.1-.3 13.7.1 18.2a19.7 19.7 0 006 3c.5-.6.9-1.3 1.3-2a12.8 12.8 0 01-2-.9l.5-.4a14 14 0 0012.2 0l.5.4c-.6.3-1.3.6-2 .9.4.7.8 1.4 1.3 2a19.6 19.6 0 006-3c.5-5.1-.8-9.6-3.6-13.8zM8.2 15.4c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm7.6 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z"/>
      </svg>
    ),
  },
];

const ACTION_ITEMS = [
  { label: "Copy",      icon: <Copy size={22} className="text-gray-700 dark:text-gray-300" /> },
  { label: "Markup",    icon: <Pencil size={22} className="text-gray-700 dark:text-gray-300" /> },
  { label: "Print",     icon: <Printer size={22} className="text-gray-700 dark:text-gray-300" /> },
  { label: "View More", icon: <ChevronDown size={22} className="text-gray-700 dark:text-gray-300" /> },
];

export default function DrawingShareSheet({
  drawingNumber,
  drawingName,
  onClose,
}: DrawingShareSheetProps) {
  const filename = `${drawingNumber}_${drawingName.replace(/\s+/g, "_").toUpperCase()}`;

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-20 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-t-2xl overflow-hidden shadow-2xl">
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-400/50 dark:bg-gray-500/50" />
        </div>

        {/* File preview row */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200/70 dark:border-gray-700/70">
          <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 flex-none">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{filename}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{filename}.pdf</p>
          </div>
        </div>

        {/* Contacts row */}
        <div className="flex items-start justify-around px-4 py-4 border-b border-gray-200/70 dark:border-gray-700/70">
          {MOCK_CONTACTS.map((c) => (
            <button key={c.initials} className="flex flex-col items-center gap-1.5 w-16">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                style={{ background: c.bg }}
              >
                {c.initials}
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-300 text-center leading-tight whitespace-pre-line">
                {c.name}
              </span>
            </button>
          ))}
        </div>

        {/* Apps row */}
        <div className="flex items-start justify-around px-4 py-4 border-b border-gray-200/70 dark:border-gray-700/70">
          {SHARE_APPS.map((app) => (
            <button key={app.label} className="flex flex-col items-center gap-1.5 w-16">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700"
                style={{ background: app.bg }}
              >
                {app.icon}
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-300 text-center">{app.label}</span>
            </button>
          ))}
        </div>

        {/* Actions row */}
        <div className="flex items-start justify-around px-4 py-4 pb-6">
          {ACTION_ITEMS.map((item) => (
            <button key={item.label} className="flex flex-col items-center gap-1.5 w-16">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                {item.icon}
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-300 text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
