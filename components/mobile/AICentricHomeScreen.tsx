"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  SendHorizonal,
  X,
} from "lucide-react";
import {
  HOURLY_WEATHER,
  MOBILE_DRAWINGS,
  RECENT_RFIS,
  TEAM_MEMBERS,
} from "@/lib/mobile/mockData";
import type { MobileProject, TeamMember } from "@/lib/mobile/mockData";

// ─── Constants ──────────────────────────────────────────────────────────────

const MEMBER_PHOTOS: (string | null)[] = [
  null,
  null,
  "https://i.pravatar.cc/40?img=5",
  "https://i.pravatar.cc/40?img=9",
  "https://i.pravatar.cc/40?img=11",
  "https://i.pravatar.cc/40?img=12",
  null,
  "https://i.pravatar.cc/40?img=32",
  "https://i.pravatar.cc/40?img=47",
];

const MEMBER_PHOTOS_LARGE: (string | null)[] = [
  null,
  null,
  "https://i.pravatar.cc/80?img=5",
  "https://i.pravatar.cc/80?img=9",
  "https://i.pravatar.cc/80?img=11",
  "https://i.pravatar.cc/80?img=12",
  null,
  "https://i.pravatar.cc/80?img=32",
  "https://i.pravatar.cc/80?img=47",
];

const RECENT_DRAWINGS = MOBILE_DRAWINGS.filter((d) => d.downloaded).slice(0, 3);

const QUICK_ACTIONS = [
  "Start a site walk",
  "Capture site photos",
  "Record an observation",
  "Review my assignments",
];

const ACTION_META = [
  // 0: Start a site walk
  {
    color: "#0e5fa6",
    hint: "Begin a structured walk-through and log observations",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="1" /><path d="m9 20 3-6 3 6" /><path d="m6 8 6 2 6-2" /><path d="m9 14-2 6" /><path d="m15 14 2 6" />
      </svg>
    ),
  },
  // 1: Capture site photos
  {
    color: "#d97706",
    hint: "Take and tag photos from the job site",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
      </svg>
    ),
  },
  // 2: Record an observation
  {
    color: "#059669",
    hint: "Capture a field note, photo, or punch item",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  // 3: Review my assignments
  {
    color: "#7c3aed",
    hint: "See open items and records assigned to you",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
];

const AI_GRADIENT = "linear-gradient(90deg, #06b6d4 0%, #8b5cf6 40%, #ec4899 70%, #3b82f6 100%)";

/** Wrapper that paints a 2px gradient border via a padded gradient background */
function GradientInputBorder({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex-1 rounded-2xl p-[1.5px] outline-none"
      style={{ background: AI_GRADIENT }}
    >
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-[14px] px-4 py-2.5 h-full outline-none">
        {children}
      </div>
    </div>
  );
}

function AIIcon({ size = 22 }: { size?: number }) {
  return (
    <span className="flex-none inline-flex" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/ai-icon-light.png" alt="" className="w-full h-full object-contain dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/ai-icon-dark.png" alt="" className="w-full h-full object-contain hidden dark:block" />
    </span>
  );
}

// Assignments pinned to the current user (Jay Lavine / jl)
interface AssignedRecord {
  id: string;
  type: "RFI" | "Punch" | "Issue";
  number: string;
  title: string;
  status: string;
  dueDate: string;
  location?: string;
  typeColor: string;
}

const MY_ASSIGNMENTS: AssignedRecord[] = [
  {
    id: "a1", type: "RFI", number: "RFI-011",
    title: "Confirm structural connection detail at grid C4",
    status: "Open", dueDate: "07/17/26", location: "Level 2 — Grid C4",
    typeColor: "#2563eb",
  },
  {
    id: "a2", type: "Punch", number: "013",
    title: "Fix chip in wood soffit — south corridor",
    status: "Open", dueDate: "07/15/26", location: "Interior / Level 1",
    typeColor: "#7c3aed",
  },
  {
    id: "a3", type: "Issue", number: "ISS-004",
    title: "Standing water accumulation on Level 2 slab",
    status: "Open", dueDate: "07/16/26", location: "Interior / 2nd Floor",
    typeColor: "#dc2626",
  },
  {
    id: "a4", type: "RFI", number: "RFI-013",
    title: "Window sill flashing detail — west elevation",
    status: "Open", dueDate: "07/22/26", location: "West Elevation",
    typeColor: "#2563eb",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getCurrentHourIndex() {
  const h = new Date().getHours();
  const labels = HOURLY_WEATHER.map((w) => {
    const [num, period] = w.hour.split(" ");
    let n = parseInt(num, 10);
    if (period === "PM" && n !== 12) n += 12;
    if (period === "AM" && n === 12) n = 0;
    return n;
  });
  let best = 0;
  let bestDiff = Infinity;
  labels.forEach((l, i) => {
    const diff = Math.abs(l - h);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  });
  return best;
}

const STATUS_COLOR: Record<string, string> = {
  Open: "#d97706",
  "IN REVIEW": "#2563eb",
  OPEN: "#d97706",
  "PENDING REINSPECTION": "#d97706",
};

function statusColor(s: string) {
  return STATUS_COLOR[s] ?? "#6b7280";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MemberAvatar({
  member,
  photoUrl,
  size = 36,
}: {
  member: TeamMember;
  photoUrl: string | null;
  size?: number;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={member.name}
        className="rounded-full object-cover flex-none"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-none text-xs font-semibold"
      style={{ width: size, height: size, background: "#dbeafe", color: "#1e40af" }}
    >
      {member.initials}
    </div>
  );
}

/** Bottom-sheet contact card for a team member */
function MemberContactSheet({
  member,
  photoUrl,
  onClose,
}: {
  member: TeamMember;
  photoUrl: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>

        {/* Avatar + name */}
        <div className="flex flex-col items-center py-4 border-b border-gray-100 dark:border-gray-800">
          <MemberAvatar member={member} photoUrl={photoUrl} size={64} />
          <p className="mt-2.5 text-base font-semibold text-gray-800 dark:text-gray-100">
            {member.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{member.role} · {member.company}</p>
        </div>

        {/* Contact rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800 pb-6">
          {member.phone && (
            <div className="flex items-center px-5 py-3.5 gap-3">
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Phone</p>
                <p className="text-sm text-gray-800 dark:text-gray-100 mt-0.5">{member.phone}</p>
              </div>
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#1b3a5c" }}
              >
                <Phone size={16} className="text-white" />
              </button>
            </div>
          )}
          {member.mobile && (
            <div className="flex items-center px-5 py-3.5 gap-3">
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Mobile</p>
                <p className="text-sm text-gray-800 dark:text-gray-100 mt-0.5">{member.mobile}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#1b3a5c" }}
                >
                  <MessageCircle size={16} className="text-white" />
                </button>
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#1b3a5c" }}
                >
                  <Phone size={16} className="text-white" />
                </button>
              </div>
            </div>
          )}
          {member.email && (
            <div className="flex items-center px-5 py-3.5 gap-3">
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Email</p>
                <p className="text-sm text-gray-800 dark:text-gray-100 mt-0.5 truncate">{member.email}</p>
              </div>
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#1b3a5c" }}
              >
                <Mail size={16} className="text-white" />
              </button>
            </div>
          )}
          {!member.phone && !member.mobile && !member.email && (
            <p className="text-sm text-gray-400 dark:text-gray-500 px-5 py-4 text-center">
              No contact details available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Full-screen list overlay for Recent Records or My Assignments */
function RecordListOverlay({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-gray-50 dark:bg-gray-950">
      <header
        className="flex items-center px-3 py-3 flex-none"
        style={{ backgroundColor: "#1b3a5c" }}
      >
        <button onClick={onBack} className="text-white p-1 mr-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-semibold text-base">{title}</h1>
      </header>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

// ─── Recent Records unified card ─────────────────────────────────────────────

type RecentCard =
  | { kind: "drawing"; id: string; number: string; name: string; imageSrc?: string; href: string }
  | { kind: "rfi"; id: string; number: string; title: string; status: string; location?: string; dueDate: string; href: string };

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  project: MobileProject;
  onNavOpen?: () => void;
  onNotificationsOpen?: () => void;
}

type SubScreen = "home" | "recent-records" | "my-assignments" | "latest-activity";

export default function AICentricHomeScreen({
  project,
  onNavOpen,
  onNotificationsOpen,
}: Props) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [subScreen, setSubScreen] = useState<SubScreen>("home");
  const [selectedMember, setSelectedMember] = useState<{ member: TeamMember; photoUrl: string | null } | null>(null);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [chatMode, setChatMode] = useState<"suggestions" | "composing" | "typing" | "response">("suggestions");
  const [chatWorkflow, setChatWorkflow] = useState<"rfi" | "assignments" | null>(null);
  const [quickActionsCollapsed, setQuickActionsCollapsed] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "RFI" | "Punch" | "Issue" | "this-week">("all");
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const expandedInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const currentWeather = HOURLY_WEATHER[getCurrentHourIndex()];

  // Scroll to bottom when AI response appears
  useEffect(() => {
    if (chatMode === "response") {
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [chatMode]);

  const closeAI = () => {
    setAiExpanded(false);
    setChatMode("suggestions");
    setInputValue("");
    setSentMessage("");
    setChatWorkflow(null);
    setAssignmentFilter("all");
  };

  const triggerWorkflow = (workflow: "rfi" | "assignments", label: string) => {
    setSentMessage(label);
    setInputValue("");
    setChatWorkflow(workflow);
    setChatMode("typing");
    setAiExpanded(true);
    setTimeout(() => setChatMode("response"), 3200);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setSentMessage(inputValue);
    setInputValue("");
    setChatWorkflow("rfi");
    setChatMode("typing");
    setTimeout(() => setChatMode("response"), 3200);
  };

  // Interleave drawings and RFIs so both are visible: drawing, RFI, drawing, RFI, drawing
  const drawingCards = RECENT_DRAWINGS.map((d) => ({
    kind: "drawing" as const,
    id: d.id, number: d.number, name: d.name, imageSrc: d.imageSrc,
    href: `/mobile/projects/${project.id}/drawings/${d.id}`,
  }));
  const rfiCards = RECENT_RFIS.slice(0, 3).map((r) => ({
    kind: "rfi" as const,
    id: r.id, number: r.number, title: r.title, status: r.status,
    location: r.location, dueDate: r.dueDate,
    href: `/mobile/projects/${project.id}/records/rfis/${r.id}`,
  }));
  const recentCards: RecentCard[] = [
    drawingCards[0], rfiCards[0],
    drawingCards[1], rfiCards[1],
    drawingCards[2],
  ].filter(Boolean);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50 dark:bg-gray-950 overflow-hidden relative">

      {/* ── Sub-screen: Recent Records list ── */}
        {subScreen === "recent-records" && (
        <RecordListOverlay title="Open Recent" onBack={() => setSubScreen("home")}>
          <div className="py-2">
            {/* Drawings group */}
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Drawings</span>
            </div>
            {RECENT_DRAWINGS.map((d) => (
              <button
                key={d.id}
                onClick={() => router.push(`/mobile/projects/${project.id}/drawings/${d.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
              >
                {d.imageSrc ? (
                  <img src={d.imageSrc} alt={d.name} className="w-14 h-10 rounded object-cover flex-none" />
                ) : (
                  <div className="w-14 h-10 rounded bg-gray-200 dark:bg-gray-700 flex-none" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{d.number}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-100 truncate">{d.name}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 flex-none" />
              </button>
            ))}

            {/* RFIs group */}
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 mt-2">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">RFIs</span>
            </div>
            {RECENT_RFIS.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/mobile/projects/${project.id}/records/rfis`)}
                className="w-full flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
              >
                <div className="flex-none w-14 h-10 rounded flex items-center justify-center" style={{ background: "#2563eb" }}>
                  <span className="text-white text-[10px] font-bold">RFI</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{r.number}</span>
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: "#fef3c7", color: "#92400e" }}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">{r.title}</p>
                  {r.location && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{r.location}</p>}
                </div>
                <div className="flex-none flex flex-col items-end gap-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Due {r.dueDate}</span>
                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                    <MessageSquare size={10} />
                    <span className="text-[10px]">{r.commentCount}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </RecordListOverlay>
      )}

      {/* ── Sub-screen: My Assignments list ── */}
        {subScreen === "my-assignments" && (
        <RecordListOverlay title="Take Action" onBack={() => setSubScreen("home")}>
          <div className="py-2">
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
                {MY_ASSIGNMENTS.length} items assigned
              </span>
            </div>
            {MY_ASSIGNMENTS.map((a) => {
              const routeMap: Record<AssignedRecord["type"], string> = { RFI: "rfis", Punch: "punch-items", Issue: "issues" };
              const ret = encodeURIComponent(`/mobile/projects/${project.id}`);
              return (
              <button
                key={a.id}
                onClick={() => router.push(`/mobile/projects/${project.id}/records/${routeMap[a.type]}/${a.id}?returnTo=${ret}`)}
                className="w-full flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
              >
                <div
                  className="flex-none w-14 h-10 rounded flex items-center justify-center"
                  style={{ background: a.typeColor }}
                >
                  <span className="text-white text-[10px] font-bold">{a.type.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold" style={{ color: a.typeColor }}>{a.number}</span>
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: "#fef3c7", color: "#92400e" }}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">{a.title}</p>
                  {a.location && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{a.location}</p>}
                </div>
                <div className="flex-none">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Due {a.dueDate}</span>
                </div>
              </button>
            );})}
          </div>
        </RecordListOverlay>
      )}

      {/* ── Sub-screen: Latest Activity ── */}
      {subScreen === "latest-activity" && (
        <RecordListOverlay title="Latest Activity" onBack={() => setSubScreen("home")}>
          {(() => {
            const ACTIVITY = [
              { id: "a1", icon: "drawing", color: "#2563eb", bg: "#dbeafe", darkBg: "#1e3a8a",
                title: <><span className="font-semibold">24 new Drawings</span> posted by Turner Construction</>, time: "2 hours ago",
                href: `/mobile/projects/${project.id}/drawings` },
              { id: "a2", icon: "chat", color: "#d97706", bg: "#fef3c7", darkBg: "#78350f",
                title: <><span className="font-semibold">John Simpson</span> replied to RFI-004</>, time: "4 hours ago",
                href: `/mobile/projects/${project.id}/records/rfis/rfi-10` },
              { id: "a3", icon: "punch", color: "#7c3aed", bg: "#ede9fe", darkBg: "#4c1d95",
                title: <><span className="font-semibold">Alex Brooks</span> submitted Punch Item #013</>, time: "Yesterday, 3:45 PM",
                href: `/mobile/projects/${project.id}/records/punch-items` },
              { id: "a4", icon: "photo", color: "#0891b2", bg: "#cffafe", darkBg: "#164e63",
                title: <><span className="font-semibold">Dana Donovan</span> uploaded 8 photos to Daily Report</>, time: "Yesterday, 1:12 PM",
                href: `/mobile/projects/${project.id}/records/daily-reports` },
              { id: "a5", icon: "check", color: "#059669", bg: "#d1fae5", darkBg: "#064e3b",
                title: <><span className="font-semibold">Sam Carter</span> approved Submittal SP-003</>, time: "2 days ago",
                href: `/mobile/projects/${project.id}/records/submittals` },
              { id: "a6", icon: "alert", color: "#dc2626", bg: "#fee2e2", darkBg: "#7f1d1d",
                title: <><span className="font-semibold">RFI-011</span> is overdue — response requested</>, time: "3 days ago",
                href: `/mobile/projects/${project.id}/records/rfis/rfi-11` },
              { id: "a7", icon: "issue", color: "#ea580c", bg: "#ffedd5", darkBg: "#7c2d12",
                title: <>Issue ISS-003 status changed to <span className="font-semibold">IN REVIEW</span></>, time: "3 days ago",
                href: `/mobile/projects/${project.id}/records/issues` },
              { id: "a8", icon: "check", color: "#059669", bg: "#d1fae5", darkBg: "#064e3b",
                title: <>Weekly safety inspection checklist <span className="font-semibold">completed</span></>, time: "4 days ago",
                href: `/mobile/projects/${project.id}/records/checklists` },
              { id: "a9", icon: "drawing", color: "#2563eb", bg: "#dbeafe", darkBg: "#1e3a8a",
                title: <><span className="font-semibold">Revision 3</span> issued for A2.01 Level 1 Floor Plan</>, time: "5 days ago",
                href: `/mobile/projects/${project.id}/drawings/a2-01` },
              { id: "a10", icon: "chat", color: "#d97706", bg: "#fef3c7", darkBg: "#78350f",
                title: <><span className="font-semibold">Sam Carter</span> opened RFI-014</>, time: "5 days ago",
                href: `/mobile/projects/${project.id}/records/rfis/rfi-14` },
            ];
            const iconSvg = (type: string, color: string) => {
              if (type === "drawing") return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;
              if (type === "chat") return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
              if (type === "photo") return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;
              if (type === "punch") return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
              if (type === "check") return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
              if (type === "alert") return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
              return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
            };
            return (
              <div className="py-1">
                {ACTIVITY.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => router.push(a.href)}
                    className="w-full flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                  >
                    <div
                      className="flex-none w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                      style={{ background: a.bg }}
                    >
                      {iconSvg(a.icon, a.color)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug">{a.title}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{a.time}</p>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-none mt-1" />
                  </button>
                ))}
              </div>
            );
          })()}
        </RecordListOverlay>
      )}

      {/* ── Member contact sheet ── */}
      {selectedMember && (
        <MemberContactSheet
          member={selectedMember.member}
          photoUrl={selectedMember.photoUrl}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-2 bg-gray-50 dark:bg-gray-950">

        {/* Welcome + Weather card (also serves as the top toolbar) */}
        <div
          className="rounded-b-2xl overflow-hidden shadow-sm"
          style={{ background: "linear-gradient(160deg, #0f2540 0%, #1b3a5c 45%, #2563eb 100%)" }}
        >
          {/* ── Top nav row: hamburger | logo | bell ── */}
          <div className="flex items-center px-3 pt-4 pb-2">
            {/* Hamburger */}
            <button
              onClick={onNavOpen}
              className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Centered ProjectSight logo */}
            <div className="flex-1 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/projectsight_logo_dark.svg"
                alt="ProjectSight"
                style={{ height: 22, width: "auto" }}
              />
            </div>

            {/* Bell */}
            <button
              onClick={onNotificationsOpen}
              className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
            >
              <Bell size={19} />
            </button>
          </div>

          {/* ── Greeting + project location ── */}
          <div className="px-4 pt-1 pb-3">
            <p className="text-white font-bold text-2xl leading-tight">
              {getGreeting()}, Jesse!
            </p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} className="text-white/50 flex-none" />
              <p className="text-white/70 text-sm truncate">
                {project.name} ({project.number})
              </p>
            </div>

            {/* Current weather — tap to toggle hourly forecast */}
            <button
              className="w-full flex items-center gap-3 mt-3 bg-white/10 rounded-xl px-3 py-2 text-left"
              onClick={() => setWeatherExpanded((v) => !v)}
            >
              <span className="text-3xl leading-none">{currentWeather.icon}</span>
              <div>
                <p className="text-white font-bold text-xl leading-none">{currentWeather.temp}°F</p>
                <p className="text-white/70 text-xs mt-0.5">{currentWeather.condition}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white/50 text-[10px]">Today</p>
                <p className="text-white/80 text-xs font-medium">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              {/* Expand indicator */}
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-white/40 ml-1 flex-none transition-transform"
                style={{ transform: weatherExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Hourly forecast strip — revealed on tap */}
          {weatherExpanded && (
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
              {HOURLY_WEATHER.map((w, i) => {
                const isCurrent = i === getCurrentHourIndex();
                return (
                  <div
                    key={w.hour}
                    className={`flex-none flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 min-w-[52px] ${
                      isCurrent ? "bg-white/25 ring-1 ring-white/40" : "bg-white/10"
                    }`}
                  >
                    <p className="text-white/60 text-[10px] font-medium">{w.hour}</p>
                    <span className="text-base leading-none my-0.5">{w.icon}</span>
                    <p className="text-white font-semibold text-xs">{w.temp}°</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team members */}
        <div className="mx-3 mt-3 bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <button
              className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1"
              onClick={() => router.push(`/mobile/projects/${project.id}/team`)}
            >
              {TEAM_MEMBERS.length} Team members
            </button>
            <div className="flex items-center gap-1.5">
              <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <Plus size={16} />
              </button>
              <button
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => router.push(`/mobile/projects/${project.id}/team`)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Tappable overlapping avatars */}
          <div className="flex">
            {TEAM_MEMBERS.map((member, i) => {
              const photoUrl = MEMBER_PHOTOS[i];
              const largePh = MEMBER_PHOTOS_LARGE[i];
              return (
                <button
                  key={member.id}
                  className="w-9 h-9 rounded-full flex-none border-2 border-white dark:border-gray-900 overflow-hidden"
                  style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: TEAM_MEMBERS.length - i }}
                  title={member.name}
                  onClick={() => setSelectedMember({ member, photoUrl: largePh })}
                >
                  <MemberAvatar member={member} photoUrl={photoUrl} size={36} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Records — unified horizontal card scroll */}
        <div className="mx-3 mt-3 bg-white dark:bg-gray-900 rounded-2xl px-4 pt-3 pb-4 shadow-sm">
          <button
            className="w-full flex items-center justify-between mb-3"
            onClick={() => setSubScreen("recent-records")}
          >
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Open Recent</h3>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
          </button>

          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {recentCards.map((card) => {
              if (card.kind === "drawing") {
                return (
                  <button
                    key={card.id}
                    onClick={() => router.push(card.href)}
                    className="flex-none flex flex-col rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                    style={{ width: 96 }}
                  >
                    {card.imageSrc ? (
                      <img src={card.imageSrc} alt={card.name} className="w-full object-cover" style={{ height: 56 }} />
                    ) : (
                      <div className="w-full bg-gray-200 dark:bg-gray-700" style={{ height: 56 }} />
                    )}
                    <div className="px-2 py-1.5">
                      <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Drawing</p>
                      <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">{card.number}</p>
                    </div>
                  </button>
                );
              }
              // RFI card
              return (
                <button
                  key={card.id}
                  onClick={() => router.push(card.href)}
                  className="flex-none flex flex-col rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                  style={{ width: 96 }}
                >
                  <div
                    className="w-full flex items-center gap-1.5 px-2 py-1.5"
                    style={{ background: "#1e40af" }}
                  >
                    <span className="text-white text-[9px] font-bold tracking-widest">RFI</span>
                    <span className="text-white/70 text-[9px] font-medium truncate">{card.number}</span>
                  </div>
                  <div className="px-2 py-2 flex flex-col gap-1 text-left">
                    <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-100 leading-tight line-clamp-3">{card.title}</p>
                    <span className="text-[9px] text-blue-500 dark:text-blue-400 font-medium flex items-center gap-0.5 mt-0.5">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 flex-none" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                      You
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Latest Activity */}
        <div className="mx-3 mt-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Latest Activity</h3>
            <button
              onClick={() => setSubScreen("latest-activity")}
              className="text-xs text-blue-500 dark:text-blue-400 font-medium flex items-center gap-0.5"
            >
              View More <ChevronRight size={13} />
            </button>
          </div>

          {/* Row: 24 new Drawings */}
          <button
            onClick={() => router.push(`/mobile/projects/${project.id}/drawings`)}
            className="w-full flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex-none w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug">
                <span className="font-semibold">24 new Drawings</span> posted
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">2 hours ago</p>
            </div>
            <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-none" />
          </button>

          {/* Row: RFI reply */}
          <button
            onClick={() => router.push(`/mobile/projects/${project.id}/records/rfis/rfi-10`)}
            className="w-full flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex-none w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug">
                <span className="font-semibold">John Simpson</span> replied to RFI-004
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">4 hours ago</p>
            </div>
            <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-none" />
          </button>
        </div>

        <div className="h-2" />
      </div>

      {/* ── Collapsed AI input footer ── */}
      <div className="flex-none border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)]">

        {/* Drag handle — tap to collapse / expand quick actions */}
        <button
          onClick={() => setQuickActionsCollapsed((v) => !v)}
          className={`w-full flex items-center justify-center pt-2 hover:opacity-70 transition-opacity ${quickActionsCollapsed ? "pb-2" : "pb-1.5"}`}
          aria-label={quickActionsCollapsed ? "Expand quick actions" : "Collapse quick actions"}
        >
          <div className="rounded-full bg-gray-300 dark:bg-gray-600" style={{ width: 28, height: 3 }} />
        </button>

        {/* Collapsible quick-action grid */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: quickActionsCollapsed ? 0 : 200, opacity: quickActionsCollapsed ? 0 : 1 }}
        >
        <div className="px-3 grid grid-cols-2 gap-2 mb-3">
          {QUICK_ACTIONS.map((action, i) => {
            const meta = ACTION_META[i];
            return (
              <button
                key={action}
                onClick={() => {
                  if (action === "Review my assignments") {
                    triggerWorkflow("assignments", action);
                  } else {
                    setInputValue(action);
                    setChatMode("suggestions");
                    setAiExpanded(true);
                    setTimeout(() => expandedInputRef.current?.focus(), 80);
                  }
                }}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl py-3 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: meta.color }}
                >
                  {meta.icon}
                </div>
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200 text-center leading-tight px-1">{action}</span>
              </button>
            );
          })}
        </div>
        </div>{/* end collapsible wrapper */}

        {/* Tappable input bar — gradient border */}
        <div className="px-3 pb-3">
        <div
          className="w-full rounded-2xl p-[1.5px] cursor-pointer"
          style={{ background: AI_GRADIENT }}
          onClick={() => {
            setAiExpanded(true);
            setTimeout(() => expandedInputRef.current?.focus(), 80);
          }}
        >
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-[14px] px-4 py-2.5 outline-none">
            <AIIcon size={20} />
            <span className="flex-1 text-sm text-gray-400 dark:text-gray-500">
              {inputValue || "What would you like to work on?"}
            </span>
            <SendHorizonal size={15} className="text-gray-300 dark:text-gray-600" />
          </div>
        </div>
        </div>{/* end px-3 pb-3 input wrapper */}
      </div>

      {/* ── Expanded AI overlay (full-screen, slides up) ── */}
      {aiExpanded && (
        <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-gray-950">

          {/* ── Header ── */}
          {chatMode === "suggestions" ? (
            /* Suggestions header: close only, then large icon + title */
            <div className="flex-none px-4 pt-10 pb-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={closeAI}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <AIIcon size={72} />
                <div>
                  <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 tracking-widest uppercase mb-1">AI Assistant</p>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 leading-snug">
                    What would you like<br />to work on?
                  </h2>
                </div>
              </div>
            </div>
          ) : (
            /* Chat header: back | logo + "ProjectSight AI" | close */
            <div className="flex-none flex items-center px-3 pt-10 pb-3 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { setChatMode("suggestions"); setInputValue(""); setSentMessage(""); setChatWorkflow(null); setAssignmentFilter("all"); }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex-none"
              >
                <ArrowLeft size={16} />
              </button>

              {/* Centered logo + "AI" inline */}
              <div className="flex-1 flex items-center justify-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/projectsight_logo.svg"
                  alt="ProjectSight"
                  className="dark:hidden"
                  style={{ height: 16, width: "auto" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/projectsight_logo_dark.svg"
                  alt="ProjectSight"
                  className="hidden dark:block"
                  style={{ height: 16, width: "auto" }}
                />
                <span className="text-base font-bold text-gray-900 dark:text-white leading-none" style={{ marginBottom: 2 }}>AI</span>
              </div>

              <button
                onClick={closeAI}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex-none"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* keyframe for bubble fly-in */}
          <style>{`
            @keyframes bubbleIn {
              from { opacity: 0; transform: translateY(14px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* ── Suggestions list ── */}
          {chatMode === "suggestions" && (
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Suggested</p>
              <div className="flex flex-col gap-3">
                {QUICK_ACTIONS.map((action, i) => {
                  const meta = ACTION_META[i];
                  return (
                    <button
                      key={action}
                      onClick={() => {
                        if (action === "Review my assignments") {
                          triggerWorkflow("assignments", action);
                        } else {
                          setInputValue(action);
                          setChatMode("composing");
                          expandedInputRef.current?.focus();
                        }
                      }}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none" style={{ background: meta.color }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{action}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{meta.hint}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-none" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Composing: blank area (no preview bubble) ── */}
          {chatMode === "composing" && (
            <div className="flex-1" />
          )}

          {/* ── Chat thread (typing + response) ── */}
          {(chatMode === "typing" || chatMode === "response") && (
            <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 flex flex-col gap-4">

              {/* Sent user bubble */}
              <div className="flex justify-end" style={{ animation: "bubbleIn 0.25s ease-out" }}>
                <div
                  className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white leading-relaxed shadow-sm"
                  style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)" }}
                >
                  {sentMessage}
                </div>
              </div>

              {/* AI typing indicator */}
              {chatMode === "typing" && (
                <div className="flex items-start gap-2.5" style={{ animation: "bubbleIn 0.25s ease-out" }}>
                  <div className="flex-none w-7 h-7 flex items-center justify-center">
                    <AIIcon size={24} />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5">
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">Searching project documents…</span>
                  </div>
                </div>
              )}

              {/* AI full response — RFI workflow */}
              {chatMode === "response" && chatWorkflow === "rfi" && (
                <div className="flex items-start gap-2.5" style={{ animation: "bubbleIn 0.3s ease-out" }}>
                  <div className="flex-none w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AIIcon size={24} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-3">

                    {/* Answer text bubble */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
                        Based on current project documents, here&apos;s what I found for <strong>B-4, Level 3</strong>:
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed mt-2">
                        <strong>Spec 21 13 00</strong> requires pipe hangers at max <strong>10&apos;-0&quot; o.c.</strong> for 4&quot; CPVC, with additional support within 12&quot; of all fittings and branch connections.
                      </p>
                      {/* Conflict callout */}
                      <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-2.5 flex gap-2.5">
                        <span className="text-base leading-none mt-0.5 flex-none">⚠️</span>
                        <div>
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Potential Conflict Detected</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                            <strong>S-201</strong> shows a W8×18 beam at grid B-4 with an 8&quot; slab recess at centerline. Your hanger point may fall in the recess — confirm with the structural engineer before proceeding.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reference thumbnails */}
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">References</p>
                      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">

                        {/* S-201 Structural – opens specific drawing */}
                        <button
                          onClick={() => router.push(`/mobile/projects/${project.id}/drawings/${RECENT_DRAWINGS[0]?.id ?? ""}`)}
                          className="flex-none flex flex-col rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 hover:brightness-95 transition-all"
                          style={{ width: 108 }}
                        >
                          {RECENT_DRAWINGS[0]?.imageSrc ? (
                            <img src={RECENT_DRAWINGS[0].imageSrc} alt="S-201" className="w-full object-cover" style={{ height: 66 }} />
                          ) : (
                            <div className="w-full" style={{ height: 66, background: "linear-gradient(135deg,#0f2540,#1e40af)" }} />
                          )}
                          <div className="px-2 py-1.5">
                            <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Drawing</p>
                            <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 leading-tight">S-201</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">Structural, Lvl 3</p>
                          </div>
                        </button>

                        {/* M-301 Mechanical – opens specific drawing */}
                        <button
                          onClick={() => router.push(`/mobile/projects/${project.id}/drawings/${RECENT_DRAWINGS[1]?.id ?? ""}`)}
                          className="flex-none flex flex-col rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 hover:brightness-95 transition-all"
                          style={{ width: 108 }}
                        >
                          {RECENT_DRAWINGS[1]?.imageSrc ? (
                            <img src={RECENT_DRAWINGS[1].imageSrc} alt="M-301" className="w-full object-cover" style={{ height: 66 }} />
                          ) : (
                            <div className="w-full" style={{ height: 66, background: "linear-gradient(135deg,#134e4a,#0e7490)" }} />
                          )}
                          <div className="px-2 py-1.5">
                            <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Drawing</p>
                            <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 leading-tight">M-301</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">Mechanical, Lvl 3</p>
                          </div>
                        </button>

                        {/* Spec 21 13 00 – opens submittals/specs list as closest proxy */}
                        <button
                          onClick={() => router.push(`/mobile/projects/${project.id}/records/submittals`)}
                          className="flex-none flex flex-col rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 hover:brightness-95 transition-all"
                          style={{ width: 108 }}
                        >
                          <div
                            className="w-full flex items-end px-2 pb-2 pt-3"
                            style={{ height: 66, background: "linear-gradient(135deg,#065f46,#059669)" }}
                          >
                            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="8" y1="13" x2="16" y2="13" />
                              <line x1="8" y1="17" x2="16" y2="17" />
                            </svg>
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Spec</p>
                            <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 leading-tight">21 13 00</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">Fire Suppression</p>
                          </div>
                        </button>

                      </div>
                    </div>

                    {/* Create RFI CTA */}
                    <button
                      onClick={() => {
                        const p = new URLSearchParams({
                          aiSubject: "Fire Suppression Pipe Hanger Conflict — Grid B-4, Level 3",
                          aiDescription:
                            "Planning to install 4\" fire suppression main at grid B-4 on Level 3. " +
                            "Spec 21 13 00 requires hangers at max 10'-0\" o.c. for 4\" CPVC. " +
                            "S-201 shows a W8×18 beam at B-4 with an 8\" slab recess at centerline — " +
                            "hanger attachment point may fall in the recess. Requesting confirmation of " +
                            "hanger location and any required supplemental structure.",
                          aiRefs: "S-201 Structural Framing Lvl 3,Spec 21 13 00 – Fire Suppression",
                          aiCompany: "Encore Electric",
                          aiAssignee: "Dana Donovan",
                          aiAssigneeCompany: "Sample Company",
                          aiDueDate: "07/24/26",
                          aiImportance: "High",
                          fromDrawing: "s201",
                        });
                        router.push(`/mobile/projects/${project.id}/records/rfis/new?${p.toString()}`);
                      }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-none">
                        <Plus size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Create an RFI</p>
                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 leading-snug">Document this conflict and request clarification from the engineer</p>
                      </div>
                      <ChevronRight size={16} className="text-blue-400 dark:text-blue-500 flex-none" />
                    </button>

                  </div>
                </div>
              )}

              {/* AI full response — assignments workflow */}
              {chatMode === "response" && chatWorkflow === "assignments" && (() => {
                const FILTER_PILLS: { id: typeof assignmentFilter; label: string }[] = [
                  { id: "all", label: "All" },
                  { id: "RFI", label: "RFIs" },
                  { id: "Punch", label: "Punch Items" },
                  { id: "Issue", label: "Issues" },
                  { id: "this-week", label: "Due This Week" },
                ];
                // Parse mock date "MM/DD/YY" relative to today 07/17/2026
                const today = new Date(2026, 6, 17); // months 0-indexed
                const parseDate = (s: string) => {
                  const [m, d, y] = s.split("/").map(Number);
                  return new Date(2000 + y, m - 1, d);
                };
                const isOverdue = (d: string) => parseDate(d) < today;
                const isDueToday = (d: string) => { const p = parseDate(d); return p.getFullYear() === today.getFullYear() && p.getMonth() === today.getMonth() && p.getDate() === today.getDate(); };
                const isThisWeek = (d: string) => { const p = parseDate(d); const diff = (p.getTime() - today.getTime()) / 86400000; return diff >= 0 && diff <= 7; };

                const filtered = MY_ASSIGNMENTS.filter((a) => {
                  if (assignmentFilter === "RFI") return a.type === "RFI";
                  if (assignmentFilter === "Punch") return a.type === "Punch";
                  if (assignmentFilter === "Issue") return a.type === "Issue";
                  if (assignmentFilter === "this-week") return isOverdue(a.dueDate) || isDueToday(a.dueDate) || isThisWeek(a.dueDate);
                  return true;
                });

                const overdue = filtered.filter((a) => isOverdue(a.dueDate));
                const dueToday = filtered.filter((a) => isDueToday(a.dueDate));
                const upcoming = filtered.filter((a) => !isOverdue(a.dueDate) && !isDueToday(a.dueDate));

                const typeToRoute: Record<AssignedRecord["type"], string> = {
                  RFI: "rfis",
                  Punch: "punch-items",
                  Issue: "issues",
                };
                const returnTo = encodeURIComponent(`/mobile/projects/${project.id}`);
                const AssignCard = ({ a }: { a: AssignedRecord }) => (
                  <button
                    onClick={() => router.push(`/mobile/projects/${project.id}/records/${typeToRoute[a.type]}/${a.id}?returnTo=${returnTo}`)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-none w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: a.typeColor }}>
                      <span className="text-white text-[9px] font-bold tracking-wide">{a.type}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold" style={{ color: a.typeColor }}>{a.number}</span>
                        {isOverdue(a.dueDate) && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">Overdue</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">{a.title}</p>
                      {a.location && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{a.location}</p>}
                    </div>
                    <div className="flex-none text-right">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Due</p>
                      <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{a.dueDate.slice(0,5)}</p>
                    </div>
                  </button>
                );

                return (
                  <div className="flex items-start gap-2.5" style={{ animation: "bubbleIn 0.3s ease-out" }}>
                    <div className="flex-none w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AIIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-3">

                      {/* Summary bubble */}
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                        <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
                          You have <strong>{MY_ASSIGNMENTS.length} open items</strong> assigned to you —{" "}
                          <strong className="text-red-500">{MY_ASSIGNMENTS.filter(a => isOverdue(a.dueDate)).length} overdue</strong> and{" "}
                          <strong className="text-amber-500">{MY_ASSIGNMENTS.filter(a => isDueToday(a.dueDate)).length} due today</strong>.
                          Here&apos;s a breakdown by urgency:
                        </p>
                      </div>

                      {/* Filter pills */}
                      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                        {FILTER_PILLS.map((pill) => (
                          <button
                            key={pill.id}
                            onClick={() => setAssignmentFilter(pill.id)}
                            className="flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                            style={
                              assignmentFilter === pill.id
                                ? { background: AI_GRADIENT, color: "#fff" }
                                : { background: "transparent", border: "1px solid #d1d5db", color: "#6b7280" }
                            }
                          >
                            {pill.label}
                          </button>
                        ))}
                      </div>

                      {/* Grouped assignment cards */}
                      <div className="flex flex-col gap-3">
                        {overdue.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                              <span>⚡</span> Overdue
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {overdue.map((a) => <AssignCard key={a.id} a={a} />)}
                            </div>
                          </div>
                        )}
                        {dueToday.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                              <span>📅</span> Due Today
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {dueToday.map((a) => <AssignCard key={a.id} a={a} />)}
                            </div>
                          </div>
                        )}
                        {upcoming.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                              <span>📋</span> Upcoming
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {upcoming.map((a) => <AssignCard key={a.id} a={a} />)}
                            </div>
                          </div>
                        )}
                        {filtered.length === 0 && (
                          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nothing matching this filter.</p>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })()}
              {/* Scroll anchor — response scrolls into view here */}
              <div ref={chatBottomRef} />
            </div>
          )}

          {/* ── Input bar ── */}
          <div className="flex-none border-t border-gray-100 dark:border-gray-800 px-3 pt-3 pb-3 bg-white dark:bg-gray-950">
            <div className="flex items-center">
              <GradientInputBorder>
                <AIIcon size={20} />
                <input
                  ref={expandedInputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInputValue(val);
                    if (chatMode === "suggestions" || chatMode === "composing") {
                      setChatMode(val.trim() ? "composing" : "suggestions");
                    }
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { handleSend(); } }}
                  placeholder={chatMode === "suggestions" ? "What would you like to work on?" : "Ask a follow-up…"}
                  className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none ring-0 border-0 focus:outline-none focus:ring-0"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="flex-none p-1 disabled:opacity-30 transition-opacity"
                >
                  <SendHorizonal size={17} className={inputValue.trim() ? "text-blue-500 dark:text-blue-400" : "text-gray-300 dark:text-gray-600"} />
                </button>
              </GradientInputBorder>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
