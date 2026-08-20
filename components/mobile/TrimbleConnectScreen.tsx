"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Grid2X2, List, MoreVertical, Plus, QrCode } from "lucide-react";
import { MOBILE_PROJECTS } from "@/lib/mobile/mockData";
import MobileNavDrawer from "./MobileNavDrawer";

interface Props {
  projectId: string;
  onBack: () => void;
}

type ViewMode = "list" | "grid";

const FOLDERS = [
  { name: "01 Drawings",                    modified: "2025-10-31T04:28:39+0000" },
  { name: "Aerial Photography",             modified: "2024-03-06T16:12:11+0000" },
  { name: "Change Order Request Documents", modified: "2024-04-10T19:32:00+0000" },
  { name: "Checklist Documents",            modified: "2024-03-06T16:12:19+0000" },
  { name: "Contract Documents",             modified: "2026-04-14T19:56:55+0000" },
  { name: "Correspondence",                 modified: "2024-03-06T16:12:05+0000" },
  { name: "Drawing Documents",              modified: "2025-11-04T20:53:48+0000" },
  { name: "General Invoice Documents",      modified: "2024-03-06T16:12:19+0000" },
  { name: "Meeting Minutes",                modified: "2024-05-22T10:44:00+0000" },
  { name: "Photos",                         modified: "2025-09-15T08:30:12+0000" },
  { name: "Project Reports",                modified: "2024-06-01T13:00:00+0000" },
  { name: "RFI Documents",                  modified: "2024-07-18T09:15:33+0000" },
  { name: "Submittal Documents",            modified: "2024-08-02T14:22:00+0000" },
];

function formatModified(iso: string) {
  return `Modified ${iso.replace("T", " ").replace(/\+\d{4}$/, "")}`;
}

// Folder icon matching the screenshot style
function FolderIcon() {
  return (
    <svg viewBox="0 0 40 34" className="w-9 h-8 flex-none fill-[#2d3748] dark:fill-gray-400">
      <path d="M0 6C0 4.9 0.9 4 2 4H16L20 8H38C39.1 8 40 8.9 40 10V32C40 33.1 39.1 34 38 34H2C0.9 34 0 33.1 0 32V6Z" />
      <path d="M0 4C0 2.9 0.9 2 2 2H15L18 6H2C0.9 6 0 6.9 0 8V4Z" opacity="0.5" className="fill-[#1a202c] dark:fill-gray-600"/>
    </svg>
  );
}

export default function TrimbleConnectScreen({ projectId, onBack }: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const project = MOBILE_PROJECTS.find((p) => p.id === projectId) ?? MOBILE_PROJECTS[0];

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative bg-white dark:bg-gray-900">
      <MobileNavDrawer
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        projectId={project.id}
        projectName={`${project.number} - ${project.name}`}
        companyName={project.company}
      />

      {/* Back link row */}
      <div className="flex-none px-4 pt-3 pb-1" style={{ backgroundColor: "#1b3a5c" }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/70 text-sm hover:text-white"
        >
          <ChevronLeft size={14} />
          ProjectSight
        </button>
      </div>

      {/* Title header */}
      <div
        className="flex items-center px-3 pb-3 flex-none"
        style={{ backgroundColor: "#1b3a5c" }}
      >
        <button className="text-white p-1" onClick={() => setNavOpen(true)}>
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-white font-semibold text-base leading-tight">Trimble Connect</p>
          <p className="text-white/70 text-xs leading-tight">File Library</p>
        </div>
        <button className="text-white p-1">
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex-none px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-400 dark:text-gray-500">Explorer</span>
          <ChevronRight size={14} className="text-gray-400 dark:text-gray-500" />
          <span className="text-gray-800 dark:text-gray-100 font-medium">ProjectSight Documents</span>
        </div>
      </div>

      {/* View toggle toolbar */}
      <div className="flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <button className="p-2 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
          <QrCode size={20} />
        </button>
        <button
          className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
          onClick={() => setViewMode("grid")}
        >
          <Grid2X2 size={20} />
        </button>
        <button
          className={`p-2 rounded ${viewMode === "list" ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
          onClick={() => setViewMode("list")}
        >
          <List size={20} />
        </button>
        <button className="p-2 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* List view */}
      {viewMode === "list" && (
        <div className="flex-1 overflow-y-auto">
          {/* Sort header */}
          <div className="flex items-center px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1">
              Name
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="currentColor">
                <path d="M8 3l4 6H4z" />
              </svg>
            </span>
          </div>

          {FOLDERS.map((folder) => (
            <div
              key={folder.name}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <FolderIcon />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{folder.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatModified(folder.modified)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-3">
            {FOLDERS.map((folder) => (
              <div
                key={folder.name}
                className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <FolderIcon />
                <p className="text-xs text-gray-700 dark:text-gray-300 text-center leading-tight line-clamp-2">{folder.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg hover:bg-blue-600"
      >
        <Plus size={24} className="text-white" />
      </button>
    </div>
  );
}
