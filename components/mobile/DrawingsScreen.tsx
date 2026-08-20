"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ChevronDown, ChevronUp, CloudDownload, SlidersHorizontal } from "lucide-react";
import { MOBILE_DRAWINGS, MOBILE_PROJECTS, type MobileDrawing } from "@/lib/mobile/mockData";
import MobileHeader from "./MobileHeader";
import MobileNavDrawer from "./MobileNavDrawer";
import NotificationsPanel from "./NotificationsPanel";

interface DrawingsScreenProps {
  projectId: string;
}

export default function DrawingsScreen({ projectId }: DrawingsScreenProps) {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [architecturalOpen, setArchitecturalOpen] = useState(true);
  const [noDisciplineOpen, setNoDisciplineOpen] = useState(false);

  const project = MOBILE_PROJECTS.find((p) => p.id === projectId) ?? MOBILE_PROJECTS[0];

  const architecturalDrawings = MOBILE_DRAWINGS.filter(
    (d) => d.discipline === "Architectural"
  );

  const noDisciplineDrawings = MOBILE_DRAWINGS.filter(
    (d) => d.discipline === null
  );

  return (
    <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
      <MobileNavDrawer
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        projectId={project.id}
        projectName={`${project.number} - ${project.name}`}
        companyName={project.company}
      />

      <MobileHeader
        title="Drawings"
        subtitle={`Synced ${project.syncedDate}`}
        onMenuOpen={() => setNavOpen(true)}
        showNotifications
        notificationCount={6}
        onNotificationsOpen={() => setNotificationsOpen(true)}
        showSearch
      />

      {/* Records count + sort/filter */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-none">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
          Drawings ({MOBILE_DRAWINGS.length})
        </span>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ArrowUpDown size={14} />
            Sort
          </button>
          <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <SlidersHorizontal size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* Notifications panel */}
      {notificationsOpen && (
        <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
      )}

      {/* Drawing list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* No Discipline section */}
        <DisciplineSection
          label="No Discipline specified"
          countLabel={`${noDisciplineDrawings.filter((d) => d.downloaded).length} of ${noDisciplineDrawings.length} downloaded`}
          isOpen={noDisciplineOpen}
          onToggle={() => setNoDisciplineOpen((v) => !v)}
          drawings={noDisciplineDrawings}
          projectId={projectId}
        />

        {/* Architectural section */}
        <DisciplineSection
          label="Architectural"
          countLabel={`${architecturalDrawings.filter((d) => d.downloaded).length} of ${architecturalDrawings.length} downloaded`}
          isOpen={architecturalOpen}
          onToggle={() => setArchitecturalOpen((v) => !v)}
          drawings={architecturalDrawings}
          projectId={projectId}
        />
      </div>
    </div>
  );
}

// ─── Discipline section with collapsible grid ────────────────────────────────

function DisciplineSection({
  label,
  countLabel,
  isOpen,
  onToggle,
  drawings,
  projectId,
}: {
  label: string;
  countLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  drawings: MobileDrawing[];
  projectId: string;
}) {
  return (
    <div className="mb-1">
      {/* Section header */}
      <div className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 flex-1 text-left"
        >
          {isOpen ? (
            <ChevronUp size={16} className="text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{countLabel}</span>
        </button>
        <button
          className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
          aria-label="Download all"
        >
          <CloudDownload size={20} />
        </button>
      </div>

      {/* Grid of thumbnails */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-900 px-3 pb-3">
          <div className="grid grid-cols-2 gap-3 pt-3">
            {drawings.map((drawing) => (
              <DrawingCard key={drawing.id} drawing={drawing} projectId={projectId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DrawingCard({ drawing, projectId }: { drawing: MobileDrawing; projectId: string }) {
  const router = useRouter();
  return (
    <button
      className="flex flex-col items-start text-left"
      onClick={() => router.push(`/mobile/projects/${projectId}/drawings/${drawing.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[4/3] bg-white dark:bg-gray-800 rounded overflow-hidden border border-gray-200 dark:border-gray-700 mb-1">
        {drawing.imageSrc ? (
          <img
            src={drawing.imageSrc}
            alt={drawing.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800" />
        )}
      </div>

      {/* Label */}
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
        {drawing.number} {drawing.revision}
      </span>
      <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5 line-clamp-2">
        {drawing.name}
      </span>
    </button>
  );
}
