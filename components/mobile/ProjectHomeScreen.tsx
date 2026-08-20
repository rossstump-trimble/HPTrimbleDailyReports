"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CameraOff,
  ChevronRight,
  Plus,
  Settings,
} from "lucide-react";
import { MOBILE_PROJECTS, TEAM_MEMBERS, MOBILE_DRAWINGS } from "@/lib/mobile/mockData";
import MobileNavDrawer from "./MobileNavDrawer";
import NotificationsPanel from "./NotificationsPanel";
import AICentricHomeScreen from "./AICentricHomeScreen";

const SHORTCUT_ITEMS = [
  { img: "/images/icon-shortcut-rfis.png",        label: "RFIs",          href: "/records/rfis" },
  { img: "/images/icon-shortcut-submittals.png",  label: "Submittals",    href: "/records/submittals" },
  { img: "/images/icon-shortcut-punch.png",       label: "Punch",         href: "/records/punch-items" },
  { img: "/images/icon-shortcut-daily.png",       label: "Daily Reports", href: "/records/daily-reports" },
  { img: "/images/icon-shortcut-drawings.png",    label: "Drawings",      href: "/drawings" },
];

const RECENT_DRAWINGS = MOBILE_DRAWINGS.filter((d) => d.downloaded).slice(0, 3);

// Mirrors TEAM_MEMBERS order — null uses the light-blue initials avatar
const MEMBER_PHOTOS: (string | null)[] = [
  null,                              // FreeStyle 015
  null,                              // Scott Casey
  "https://i.pravatar.cc/40?img=5",  // Dragana Dojnov
  "https://i.pravatar.cc/40?img=9",  // Sandra Johnson
  "https://i.pravatar.cc/40?img=11", // Jay Lavine
  "https://i.pravatar.cc/40?img=12", // Jesse Lavine (photo)
  null,                              // Jesse Lavine (initials)
  "https://i.pravatar.cc/40?img=32", // Mike Reyes
  "https://i.pravatar.cc/40?img=47", // Pat Torres
];

interface ProjectHomeScreenProps {
  projectId: string;
}

export default function ProjectHomeScreen({ projectId }: ProjectHomeScreenProps) {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // useSyncExternalStore: SSR-safe localStorage read with no hydration mismatch.
  // Server snapshot returns false; client snapshot reads the real value immediately.
  const aiCentricMode = useSyncExternalStore(
    (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); },
    () => localStorage.getItem("ps-ai-centric-mode") === "1",
    () => false,
  );

  const project = MOBILE_PROJECTS.find((p) => p.id === projectId) ?? MOBILE_PROJECTS[0];

  return (
    <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
      <MobileNavDrawer
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        projectId={project.id}
        projectName={`${project.number} - ${project.name}`}
        companyName={project.company}
      />

      {notificationsOpen && (
        <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
      )}

      {/* Header — hidden in AI Centric Mode (toolbar absorbed into welcome card) */}
      {!aiCentricMode && (
        <header
          className="flex items-center px-3 py-3 flex-none z-10"
          style={{ backgroundColor: "#1b3a5c" }}
        >
          <button
            onClick={() => setNavOpen(true)}
            className="mr-3 text-white opacity-90 hover:opacity-100 p-1"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-white font-semibold text-sm leading-tight truncate">
              {project.number} - {project.name.length > 22 ? project.name.slice(0, 22) + "…" : project.name}
            </h1>
            <p className="text-white text-xs opacity-60 leading-tight">{project.company}</p>
          </div>

          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={() => setNotificationsOpen(true)}
              className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
            >
              <Bell size={19} />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
              onClick={() => router.push("/mobile/settings")}
            >
              <Settings size={19} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white">
              <Plus size={20} />
            </button>
          </div>
        </header>
      )}

      {/* Content */}
      {aiCentricMode ? (
        <AICentricHomeScreen
          project={project}
          onNavOpen={() => setNavOpen(true)}
          onNotificationsOpen={() => setNotificationsOpen(true)}
        />
      ) : (
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Shortcuts */}
        <div className="bg-white dark:bg-gray-900 px-6 pt-4 pb-5 mb-2">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-5">Shortcuts</h2>
          <div className="flex justify-between items-center">
            {SHORTCUT_ITEMS.map((item, i) => (
              <button
                key={i}
                className="opacity-70 hover:opacity-100 transition-opacity p-1"
                onClick={() => router.push(`/mobile/projects/${project.id}${item.href}`)}
              >
                <img src={item.img} alt={item.label} className="w-8 h-8 object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* Team members */}
        <div className="bg-white dark:bg-gray-900 px-4 py-3 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {TEAM_MEMBERS.length} Team members
            </h2>
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"><Plus size={18} /></button>
              <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"><ChevronRight size={18} /></button>
            </div>
          </div>

          {/* Overlapping avatars */}
          <div className="flex">
            {TEAM_MEMBERS.map((member, i) => {
              const photoUrl = MEMBER_PHOTOS[i];
              return (
                <div
                  key={member.id}
                  className="w-9 h-9 rounded-full flex-none border-2 border-white dark:border-gray-900 overflow-hidden"
                  style={{
                    marginLeft: i === 0 ? 0 : "-8px",
                    zIndex: TEAM_MEMBERS.length - i,
                  }}
                  title={member.name}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xs font-semibold"
                      style={{ background: "#dbeafe", color: "#1e40af" }}
                    >
                      {member.initials}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Project details */}
        <div className="bg-white dark:bg-gray-900 px-4 py-3 mb-2">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Project details</h2>
          <div className="flex items-start gap-3">
            {/* Circular project render */}
            <div className="w-16 h-16 rounded-full flex-none overflow-hidden border border-gray-200 dark:border-gray-700">
              <img
                src="/images/project-render.jpg"
                alt="Project"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {project.number} - {project.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Trimble</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                10368 Westmoor Dr, Westminster, CO 80021
              </p>
            </div>
          </div>
        </div>

        {/* Recent drawings */}
        <div className="bg-white dark:bg-gray-900 px-4 py-3 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Recent drawings</h2>
            <button
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              onClick={() => router.push(`/mobile/projects/${project.id}/drawings`)}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {RECENT_DRAWINGS.map((drawing) => (
              <button
                key={drawing.id}
                onClick={() => router.push(`/mobile/projects/${project.id}/drawings/${drawing.id}`)}
                className="flex-none flex flex-col items-start gap-1"
              >
                {drawing.imageSrc ? (
                  <img
                    src={drawing.imageSrc}
                    alt={drawing.name}
                    className="w-28 h-auto rounded"
                  />
                ) : (
                  <div className="w-28 h-20 rounded bg-gray-200 dark:bg-gray-800" />
                )}
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{drawing.number}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 360° Capture */}
        <div className="bg-white dark:bg-gray-900 px-4 py-3 mb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">360° Capture</h2>
              <CameraOff size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-none">
              <img src="/images/icon-360.png" alt="360° Capture" className="w-full h-full object-contain" />
            </div>
            <p className="text-sm text-blue-500 dark:text-blue-400">
              Take a 360° capture and link it to a drawing
            </p>
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
