"use client";

import { useEffect, useRef } from "react";
import {
  RotateCcw,
  Camera,
  Pencil,
  Cloud,
  Type,
  PenLine,
  Square,
  Ruler,
  Settings2,
  SwitchCamera,
  ScanLine,
  CloudOff,
  CircleDashed,
} from "lucide-react";

// ─── Popup definitions ────────────────────────────────────────────────────────

interface PopupItem {
  id: string;
  icon: React.ReactNode;
}

const MARKUP_ITEMS: PopupItem[] = [
  { id: "text",     icon: <Type size={20} /> },
  { id: "draw",     icon: <PenLine size={20} /> },
];

const TOOLS_ITEMS: PopupItem[] = [
  { id: "markup-brush", icon: <HatchIcon /> },
  { id: "select",       icon: <Square size={20} /> },
  { id: "measure",      icon: <Ruler size={20} /> },
  { id: "settings",     icon: <Settings2 size={20} /> },
];

const CAMERA_ITEMS: PopupItem[] = [
  { id: "flip",     icon: <SwitchCamera size={20} /> },
  { id: "scan",     icon: <ScanLine size={20} /> },
  { id: "photo",    icon: <Camera size={20} /> },
];

const SYNC_ITEMS: PopupItem[] = [
  { id: "offline",  icon: <CircleDashed size={20} /> },
  { id: "local",    icon: <CloudOff size={20} /> },
  { id: "cloud",    icon: <Cloud size={20} /> },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface DrawingToolbarProps {
  activeButton: string | null;
  onButtonPress: (id: string | null) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DrawingToolbar({
  activeButton,
  onButtonPress,
}: DrawingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close popup when tapping outside the toolbar
  useEffect(() => {
    if (!activeButton) return;
    const handler = (e: PointerEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onButtonPress(null);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [activeButton, onButtonPress]);

  return (
    <div
      ref={toolbarRef}
      className="flex-none flex items-center justify-around px-4 h-14"
      style={{ background: "#1c1c1e" }}
    >
      {/* Undo — no popup */}
      <ToolbarBtn
        id="undo"
        icon={<RotateCcw size={22} />}
        label="Undo"
        active={false}
        onPress={() => onButtonPress(null)}
      />

      {/* Tools */}
      <ToolbarBtn
        id="tools"
        icon={<ToolsIcon />}
        label="Tools"
        active={activeButton === "tools"}
        onPress={() => onButtonPress(activeButton === "tools" ? null : "tools")}
      >
        {activeButton === "tools" && (
          <Popup items={TOOLS_ITEMS} onSelect={() => onButtonPress(null)} />
        )}
      </ToolbarBtn>

      {/* Camera */}
      <ToolbarBtn
        id="camera"
        icon={<CameraIcon />}
        label="Camera"
        active={activeButton === "camera"}
        onPress={() => onButtonPress(activeButton === "camera" ? null : "camera")}
      >
        {activeButton === "camera" && (
          <Popup items={CAMERA_ITEMS} onSelect={() => onButtonPress(null)} />
        )}
      </ToolbarBtn>

      {/* Markup */}
      <ToolbarBtn
        id="markup"
        icon={<MarkupIcon />}
        label="Markup"
        active={activeButton === "markup"}
        onPress={() => onButtonPress(activeButton === "markup" ? null : "markup")}
      >
        {activeButton === "markup" && (
          <Popup items={MARKUP_ITEMS} onSelect={() => onButtonPress(null)} />
        )}
      </ToolbarBtn>

      {/* Sync */}
      <ToolbarBtn
        id="sync"
        icon={<div className="relative"><Cloud size={20} /><FlyoutArrow /></div>}
        label="Sync"
        active={activeButton === "sync"}
        onPress={() => onButtonPress(activeButton === "sync" ? null : "sync")}
      >
        {activeButton === "sync" && (
          <Popup items={SYNC_ITEMS} onSelect={() => onButtonPress(null)} />
        )}
      </ToolbarBtn>
    </div>
  );
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  icon,
  active,
  onPress,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  label?: string;
  active: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Floating popup above button */}
      {children}

      <button
        onClick={onPress}
        className="flex items-center justify-center w-12 h-10 rounded-xl"
        style={active ? { background: "#2c6fad" } : undefined}
      >
        <span className={active ? "text-white" : "text-white/60"}>{icon}</span>
      </button>
    </div>
  );
}

// ─── Floating popup ───────────────────────────────────────────────────────────

function Popup({
  items,
  onSelect,
}: {
  items: PopupItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: "#2c2c2e" }}
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10"
          style={
            i < items.length - 1
              ? { borderBottom: "1px solid rgba(255,255,255,0.1)" }
              : undefined
          }
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}

// ─── Custom toolbar icons ─────────────────────────────────────────────────────

/** "Aₒ" drafting/tools icon matching the original app */
function ToolsIcon() {
  return (
    <div className="relative">
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 L7 19" />
        <path d="M12 3 L17 19" />
        <path d="M8.5 11 L15.5 11" />
        <circle cx="12" cy="3" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="7" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
      </svg>
      <FlyoutArrow />
    </div>
  );
}

/** Camera with flyout arrow indicator */
function CameraIcon() {
  return (
    <div className="relative">
      <Camera size={20} />
      <FlyoutArrow />
    </div>
  );
}

/** Pencil with flyout arrow indicator */
function MarkupIcon() {
  return (
    <div className="relative">
      <Pencil size={20} />
      <FlyoutArrow />
    </div>
  );
}

/** Small diagonal arrow in bottom-right, indicating a flyout menu */
function FlyoutArrow() {
  return (
    <svg
      viewBox="0 0 6 6"
      className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 opacity-55"
      fill="currentColor"
      style={{ borderRadius: "0 0 2px 0" }}
    >
      <polygon points="6,0 6,6 0,6" />
    </svg>
  );
}

/** Hatch icon for markup brush tool */
function HatchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="16" height="16" rx="2" />
      <line x1="2" y1="8"  x2="8"  y2="2"  />
      <line x1="2" y1="14" x2="14" y2="2"  />
      <line x1="6" y1="18" x2="18" y2="6"  />
      <line x1="12" y1="18" x2="18" y2="12" />
    </svg>
  );
}
