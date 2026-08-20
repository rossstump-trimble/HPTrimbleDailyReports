"use client";

import { useState, useMemo } from "react";
import { Bell, ChevronDown, ChevronUp, CloudDownload, Filter, MoreVertical, Search, SlidersHorizontal } from "lucide-react";
import { SPEC_DIVISIONS, SpecSection, MOBILE_PROJECTS } from "@/lib/mobile/mockData";
import MobileNavDrawer from "./MobileNavDrawer";
import NotificationsPanel from "./NotificationsPanel";
import SpecViewerScreen from "./SpecViewerScreen";

interface Props {
  projectId: string;
  onBack: () => void;
}

const TOTAL_SECTIONS = SPEC_DIVISIONS.reduce((n, d) => n + d.sections.length, 0);

export default function SpecificationsScreen({ projectId, onBack }: Props) {
  const [expandedDivs, setExpandedDivs] = useState<Set<string>>(new Set(["div00"]));
  const [navOpen, setNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openSection, setOpenSection] = useState<SpecSection | null>(null);

  const project = MOBILE_PROJECTS.find((p) => p.id === projectId) ?? MOBILE_PROJECTS[0];

  const toggleDiv = (id: string) => {
    setExpandedDivs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredDivisions = useMemo(() => {
    if (!searchQuery.trim()) return SPEC_DIVISIONS;
    const q = searchQuery.toLowerCase();
    return SPEC_DIVISIONS.map(div => ({
      ...div,
      sections: div.sections.filter(s =>
        s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
      ),
    })).filter(div => div.sections.length > 0);
  }, [searchQuery]);

  if (openSection) {
    return (
      <SpecViewerScreen
        section={openSection}
        onBack={() => setOpenSection(null)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      <MobileNavDrawer
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        projectId={project.id}
        projectName={`${project.number} - ${project.name}`}
        companyName={project.company}
      />
      {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}

      {/* Header */}
      <header className="flex items-center px-3 py-3 flex-none z-10" style={{ backgroundColor: "#1b3a5c" }}>
        {searchMode ? (
          <>
            <input
              autoFocus
              className="flex-1 bg-white/20 text-white placeholder-white/60 rounded px-3 py-1.5 text-sm focus:outline-none"
              placeholder="Search specifications…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="ml-2 text-white text-sm" onClick={() => { setSearchMode(false); setSearchQuery(""); }}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setNavOpen(true)} className="mr-3 text-white opacity-90 hover:opacity-100 p-1">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-semibold text-base leading-tight">Specifications</h1>
              <p className="text-white/60 text-xs leading-tight">Synced 2 mins ago</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="relative p-2 text-white" onClick={() => setNotificationsOpen(true)}>
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">6</span>
              </button>
              <button className="p-2 text-white" onClick={() => setSearchMode(true)}>
                <Search size={20} />
              </button>
            </div>
          </>
        )}
      </header>

      {/* Sub-header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Records ({TOTAL_SECTIONS})</span>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium">
            <SlidersHorizontal size={14} />
            Sort
          </button>
          <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium">
            <Filter size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {filteredDivisions.map(div => {
          const isExpanded = expandedDivs.has(div.id) || !!searchQuery;
          const downloaded = div.sections.filter(s => s.downloaded).length;
          return (
            <div key={div.id}>
              {/* Division header row */}
              <div className="flex items-center bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <button
                  className="flex-1 flex items-center gap-3 px-4 py-3 text-left"
                  onClick={() => toggleDiv(div.id)}
                >
                  {isExpanded ? <ChevronUp size={16} className="text-gray-500 dark:text-gray-400 flex-none" /> : <ChevronDown size={16} className="text-gray-500 dark:text-gray-400 flex-none" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{div.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {downloaded} of {div.sections.length} downloaded
                    </p>
                  </div>
                </button>
                {downloaded < div.sections.length && (
                  <button className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    <CloudDownload size={20} style={{ color: "#1b3a5c" }} />
                  </button>
                )}
              </div>

              {/* Sections */}
              {isExpanded && div.sections.map(section => (
                <div
                  key={section.id}
                  className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => setOpenSection(section)}
                >
                  <div className="flex-1 min-w-0">
                    {section.status === "Current" && (
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 tracking-wide">CURRENT</span>
                    )}
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                      {section.code} - {section.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Revision {section.revision}</p>
                  </div>
                  <div
                    className="text-gray-400 dark:text-gray-500 p-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreVertical size={16} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
