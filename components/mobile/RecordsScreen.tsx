"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Camera,
  CheckSquare,
  CheckCircle2,
  Circle,
  Clock,
  CloudDownload,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { MOBILE_PROJECTS } from "@/lib/mobile/mockData";
import { getMockRecords, getMockRecordSummary } from "@/lib/mobile/mockData";
import type { MobileRecord } from "@/lib/mobile/mockData";
import { getRecordTypeConfig, getStatusColor } from "@/lib/mobile/recordTypes";
import type { AddOption } from "@/lib/mobile/recordTypes";
import MobileNavDrawer from "./MobileNavDrawer";
import RecordCard from "./RecordCard";
import MockCameraScreen from "./MockCameraScreen";
import MockPhotoPickerScreen from "./MockPhotoPickerScreen";
import RecordsFilterPanel from "./RecordsFilterPanel";
import type { FilterState } from "./RecordsFilterPanel";
import RecordsSortModal from "./RecordsSortModal";
import NotificationsPanel from "./NotificationsPanel";
import RecordsBatchEditForm from "./RecordsBatchEditForm";

// ─── Daily Report card ────────────────────────────────────────────────────────

function DailyReportCard({
  record,
  statusColor,
  batchMode,
  selected,
  onToggleSelect,
  onClick,
}: {
  record: MobileRecord;
  statusColor: string;
  batchMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}) {
  const dateTitle = record.title.replace("Daily Report — ", "");
  const temp = record.meta?.weatherTemp;
  const laborHours = record.meta?.laborHours ?? "0h 0m";
  const notesCount = record.meta?.notesCount ?? 0;
  const isFirst = !record.downloaded || record.id === "dr-05";

  return (
    <div
      className="bg-white dark:bg-gray-900 px-4 py-3 relative cursor-pointer border-b border-gray-100 dark:border-gray-800"
      style={{ outline: selected ? "2px solid #2563eb" : "none", outlineOffset: "-1px" }}
      onClick={batchMode ? onToggleSelect : onClick}
    >
      <div className="flex items-start justify-between mb-0.5">
        <span className="text-xs font-bold tracking-wide" style={{ color: statusColor }}>
          {record.status}
        </span>
        <div className="flex items-center gap-1 flex-none ml-2">
          {batchMode ? (
            <button onClick={e => { e.stopPropagation(); onToggleSelect(); }} className="text-blue-500 dark:text-blue-400">
              {selected ? <CheckCircle2 size={22} className="fill-blue-500 text-white" /> : <Circle size={22} className="text-gray-300 dark:text-gray-600" />}
            </button>
          ) : !isFirst ? (
            <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-0.5" onClick={e => e.stopPropagation()}>
              <MoreVertical size={16} />
            </button>
          ) : null}
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{dateTitle}</p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-1">
          <Clock size={11} className="text-gray-500 dark:text-gray-400" />
          <span className="text-[11px] text-gray-600 dark:text-gray-300">{String(laborHours)}</span>
        </div>
        {temp !== undefined && (
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-1">
            <span className="text-[11px]">☀</span>
            <span className="text-[11px] text-gray-600 dark:text-gray-300">{String(temp)} °F</span>
          </div>
        )}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-1">
          <MessageSquare size={11} className="text-gray-500 dark:text-gray-400" />
          <span className="text-[11px] text-gray-600 dark:text-gray-300">{Number(notesCount)} Notes</span>
        </div>
      </div>
    </div>
  );
}

type ScreenMode = "list" | "search" | "batch-edit";

interface RecordsScreenProps {
  projectId: string;
  recordType: string;
}

const NOTIFICATION_COUNT = 6;

export default function RecordsScreen({ projectId, recordType }: RecordsScreenProps) {
  const project = MOBILE_PROJECTS.find((p) => p.id === projectId) ?? MOBILE_PROJECTS[0];
  const router = useRouter();
  const config = getRecordTypeConfig(recordType);
  const allRecords = useMemo(() => getMockRecords(recordType), [recordType]);
  const summary = useMemo(() => getMockRecordSummary(recordType), [recordType]);

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<ScreenMode>("list");

  // ── Selection (batch edit) ────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitBatchEdit = () => {
    setMode("list");
    setSelectedIds(new Set());
  };

  // ── Sort ─────────────────────────────────────────────────────────────────
  const [activeSort, setActiveSort] = useState(config.defaultSort);
  const [showSort, setShowSort] = useState(false);

  // ── Filter ────────────────────────────────────────────────────────────────
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    assignedToMe: false,
    assignedToMyCompany: false,
    pastDue: false,
    statuses: new Set<string>(),
  });

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const enterSearch = () => {
    setMode("search");
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };
  const exitSearch = () => {
    setMode("list");
    setSearchQuery("");
  };

  // ── FAB menu ─────────────────────────────────────────────────────────────
  const [showFABMenu,    setShowFABMenu]    = useState(false);
  const [showCamera,     setShowCamera]     = useState(false);
  const [showPhotoPicker,setShowPhotoPicker]= useState(false);

  // ── Overlays ─────────────────────────────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBatchEditForm, setShowBatchEditForm] = useState(false);

  // ── Nav drawer ────────────────────────────────────────────────────────────
  const [navOpen, setNavOpen] = useState(false);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  const [isSyncing, setIsSyncing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PULL_THRESHOLD = 60;

  const triggerSync = useCallback(() => {
    if (isSyncing) return;
    setIsSyncing(true);
    setPullDistance(0);
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => setIsSyncing(false), 1800);
  }, [isSyncing]);

  const onListPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (listRef.current && listRef.current.scrollTop === 0) {
      pullStartY.current = e.clientY;
    }
  }, []);

  const onListPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pullStartY.current === null || isSyncing) return;
    if (listRef.current && listRef.current.scrollTop > 0) {
      pullStartY.current = null;
      return;
    }
    const delta = Math.max(0, e.clientY - pullStartY.current);
    setPullDistance(Math.min(delta, PULL_THRESHOLD * 1.5));
  }, [isSyncing]);

  const onListPointerUp = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD) triggerSync();
    else setPullDistance(0);
    pullStartY.current = null;
  }, [pullDistance, triggerSync]);

  // Clean up timer on unmount
  useEffect(() => () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); }, []);

  // ── Filtered + sorted records ────────────────────────────────────────────
  const visibleRecords = useMemo(() => {
    let records = allRecords;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.number.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
      );
    }

    if (activeFilters.statuses.size > 0) {
      const upperStatuses = new Set(
        Array.from(activeFilters.statuses).map((s) => s.toUpperCase())
      );
      records = records.filter((r) =>
        upperStatuses.has(r.status.toUpperCase())
      );
    }

    return records;
  }, [allRecords, searchQuery, activeFilters]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
      {/* ── Nav drawer ── */}
      <MobileNavDrawer
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        projectId={project.id}
        projectName={`${project.number} - ${project.name}`}
        companyName={project.company}
      />

      {/* ── Header (3 modes) ── */}
      {mode === "search" ? (
        <SearchHeader
          query={searchQuery}
          inputRef={searchInputRef}
          onChange={setSearchQuery}
          onCancel={exitSearch}
        />
      ) : mode === "batch-edit" ? (
        <BatchEditHeader
          onClose={exitBatchEdit}
          onNotifications={() => setShowNotifications(true)}
          onSearch={enterSearch}
          notificationCount={NOTIFICATION_COUNT}
        />
      ) : (
        <NormalHeader
          title={config.label}
          subtitle={isSyncing ? "Updating..." : `Synced ${project.syncedDate}`}
          syncing={isSyncing}
          onMenuOpen={() => setNavOpen(true)}
          onEdit={() => setMode("batch-edit")}
          onNotifications={() => setShowNotifications(true)}
          onSearch={enterSearch}
          notificationCount={NOTIFICATION_COUNT}
        />
      )}

      {/* ── Records count + sort/filter bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-none">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
          Records ({visibleRecords.length})
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSort(true)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowUpDown size={14} />
            Sort
          </button>
          <button
            onClick={() => setShowFilter(true)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <SlidersHorizontal size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* ── Downloaded bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-none">
        <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
          {summary.downloaded} of {summary.total} downloaded
        </span>
        <button className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" aria-label="Download all">
          <CloudDownload size={20} />
        </button>
      </div>

      {/* ── Record list ── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto min-h-0"
        onPointerDown={onListPointerDown}
        onPointerMove={onListPointerMove}
        onPointerUp={onListPointerUp}
        onPointerCancel={onListPointerUp}
        style={{ touchAction: "pan-y" }}
      >
        {/* Pull-to-refresh indicator */}
        <div
          className="overflow-hidden transition-all duration-200 flex items-center justify-center"
          style={{
            height: isSyncing ? 52 : pullDistance > 0 ? pullDistance * 0.6 : 0,
          }}
        >
          <SyncSpinner
            active={isSyncing}
            progress={Math.min(pullDistance / PULL_THRESHOLD, 1)}
          />
        </div>

        <div className="flex flex-col gap-px">
          {visibleRecords.map((record) => {
            const color = getStatusColor(config, record.status);
            const commonProps = {
              record,
              statusColor: color,
              batchMode: mode === "batch-edit",
              selected: selectedIds.has(record.id),
              onToggleSelect: () => toggleSelect(record.id),
              onClick: () => router.push(`/mobile/projects/${projectId}/records/${recordType}/${record.id}`),
            };
            return recordType === "daily-reports" ? (
              <DailyReportCard key={record.id} {...commonProps} />
            ) : (
              <RecordCard key={record.id} {...commonProps} />
            );
          })}
        </div>
        {/* Bottom padding so FAB doesn't overlap last card */}
        <div className="h-20" />
      </div>

      {/* ── Batch edit bottom bar ── */}
      {mode === "batch-edit" && (
        <div className="flex-none bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 py-3 z-10">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {selectedIds.size} selected{" "}
            {selectedIds.size === 1 ? config.singularLabel : config.label}
          </span>
          <button
            disabled={selectedIds.size === 0}
            onClick={() => selectedIds.size > 0 && setShowBatchEditForm(true)}
            className={`px-6 py-2 rounded text-sm font-semibold text-white transition-colors ${
              selectedIds.size > 0
                ? "opacity-100 cursor-pointer"
                : "opacity-40 cursor-not-allowed"
            }`}
            style={{ backgroundColor: "#1b3a5c" }}
          >
            Edit
          </button>
        </div>
      )}

      {/* ── FAB ── */}
      {mode !== "batch-edit" && config.addOptions.length > 0 && (
        <>
          {/* FAB backdrop */}
          {showFABMenu && (
            <div
              className="absolute inset-0 z-20"
              onClick={() => setShowFABMenu(false)}
              aria-hidden="true"
            />
          )}

          {/* FAB option bubbles */}
          {showFABMenu && (
            <div className="absolute bottom-24 right-4 z-30 flex flex-col items-end gap-3">
              {config.addOptions.map((option) => (
                <FABOption
                  key={option.label}
                  option={option}
                  onTap={() => {
                    setShowFABMenu(false);
                    if (option.iconName === "camera") {
                      setShowCamera(true);
                    } else if (option.iconName === "image") {
                      setShowPhotoPicker(true);
                    } else {
                      router.push(`/mobile/projects/${projectId}/records/${recordType}/new`);
                    }
                  }}
                />
              ))}
            </div>
          )}

          {/* Main FAB button — if only one add option, go directly without showing menu */}
          <button
            className="absolute bottom-5 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 text-white transition-transform"
            style={{ backgroundColor: "#1b3a5c" }}
            aria-label={showFABMenu ? "Close menu" : `Add ${config.singularLabel}`}
            onClick={() => {
              if (config.addOptions.length === 1) {
                const opt = config.addOptions[0];
                if (opt.iconName === "camera") setShowCamera(true);
                else if (opt.iconName === "image") setShowPhotoPicker(true);
                else router.push(`/mobile/projects/${projectId}/records/${recordType}/new`);
              } else {
                setShowFABMenu((v) => !v);
              }
            }}
          >
            {showFABMenu ? <X size={24} /> : <Plus size={26} />}
          </button>
        </>
      )}

      {/* ── Overlays ── */}
      {showFilter && (
        <RecordsFilterPanel
          config={config}
          initialFilters={activeFilters}
          onApply={setActiveFilters}
          onClose={() => setShowFilter(false)}
        />
      )}

      {showSort && (
        <RecordsSortModal
          options={config.sortOptions}
          activeSort={activeSort}
          onSelect={setActiveSort}
          onClose={() => setShowSort(false)}
        />
      )}

      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}

      {showBatchEditForm && (
        <RecordsBatchEditForm
          config={config}
          selectedCount={selectedIds.size}
          onClose={() => setShowBatchEditForm(false)}
        />
      )}

      {/* ── Camera overlay ── */}
      {showCamera && (
        <MockCameraScreen
          onCapture={() => {
            setShowCamera(false);
            router.push(`/mobile/projects/${projectId}/records/${recordType}/new`);
          }}
          onCancel={() => setShowCamera(false)}
        />
      )}

      {/* ── Photo picker overlay ── */}
      {showPhotoPicker && (
        <MockPhotoPickerScreen
          onSelect={() => {
            setShowPhotoPicker(false);
            router.push(`/mobile/projects/${projectId}/records/${recordType}/new`);
          }}
          onCancel={() => setShowPhotoPicker(false)}
        />
      )}
    </div>
  );
}

// ─── Sub-headers ─────────────────────────────────────────────────────────────

function NormalHeader({
  title,
  subtitle,
  syncing = false,
  onMenuOpen,
  onEdit,
  onNotifications,
  onSearch,
  notificationCount,
}: {
  title: string;
  subtitle: string;
  syncing?: boolean;
  onMenuOpen: () => void;
  onEdit: () => void;
  onNotifications: () => void;
  onSearch: () => void;
  notificationCount: number;
}) {
  return (
    <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
      <button onClick={onMenuOpen} className="mr-3 text-white opacity-90 hover:opacity-100 p-1" aria-label="Open menu">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-white font-semibold text-base leading-tight truncate">{title}</h1>
        <p className="text-white text-xs opacity-60 leading-tight flex items-center gap-1.5">
          {syncing && (
            <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
          {subtitle}
        </p>
      </div>
      <div className="flex items-center gap-0.5 ml-1">
        <button onClick={onEdit} className="text-white opacity-90 hover:opacity-100 p-1.5" aria-label="Batch edit">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button onClick={onNotifications} className="relative text-white opacity-90 hover:opacity-100 p-1.5" aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-[3px]">
              {notificationCount}
            </span>
          )}
        </button>
        <button onClick={onSearch} className="text-white opacity-90 hover:opacity-100 p-1.5" aria-label="Search">
          <Search size={20} />
        </button>
      </div>
    </header>
  );
}

function BatchEditHeader({
  onClose,
  onNotifications,
  onSearch,
  notificationCount,
}: {
  onClose: () => void;
  onNotifications: () => void;
  onSearch: () => void;
  notificationCount: number;
}) {
  return (
    <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
      <button onClick={onClose} className="mr-3 text-white opacity-90 hover:opacity-100 p-1" aria-label="Cancel batch edit">
        <X size={22} />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-white font-semibold text-base leading-tight">Batch Edit</h1>
        <p className="text-white text-xs opacity-60 leading-tight">Synced a few secs ago</p>
      </div>
      <div className="flex items-center gap-0.5 ml-1">
        <button onClick={onNotifications} className="relative text-white opacity-90 hover:opacity-100 p-1.5" aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-[3px]">
              {notificationCount}
            </span>
          )}
        </button>
        <button onClick={onSearch} className="text-white opacity-90 hover:opacity-100 p-1.5" aria-label="Search">
          <Search size={20} />
        </button>
      </div>
    </header>
  );
}

function SearchHeader({
  query,
  inputRef,
  onChange,
  onCancel,
}: {
  query: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onChange: (v: string) => void;
  onCancel: () => void;
}) {
  return (
    <header className="flex items-center gap-2 px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search here..."
        className="flex-1 bg-white/20 text-white placeholder-white/60 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:bg-white/30"
      />
      <button onClick={onCancel} className="text-white text-sm font-medium flex-none hover:opacity-80">
        Cancel
      </button>
    </header>
  );
}

// ─── FAB option row ───────────────────────────────────────────────────────────

const FAB_ICON_MAP: Record<AddOption["iconName"], React.ReactNode> = {
  camera: <Camera size={20} />,
  image: <ImageIcon size={20} />,
  "check-square": <CheckSquare size={20} />,
  "file-text": <FileText size={20} />,
  plus: <Plus size={20} />,
};

function FABOption({
  option,
  onTap,
}: {
  option: AddOption;
  onTap: () => void;
}) {
  return (
    <div className="flex items-center gap-3 pointer-events-auto">
      <span className="bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow">
        {option.label}
      </span>
      <button
        className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg"
        style={{ backgroundColor: "#1b3a5c" }}
        aria-label={option.label}
        onClick={onTap}
      >
        {FAB_ICON_MAP[option.iconName]}
      </button>
    </div>
  );
}

// ─── Sync spinner ─────────────────────────────────────────────────────────────

function SyncSpinner({ active, progress }: { active: boolean; progress: number }) {
  // While actively syncing, show a full spinning arc.
  // While pulling, show an arc whose length grows with pull progress.
  const R = 10;
  const circumference = 2 * Math.PI * R;
  const dashOffset = active ? 0 : circumference * (1 - progress * 0.75);
  const opacity = active ? 1 : progress;

  return (
    <div
      className="flex items-center justify-center"
      style={{ opacity, transition: active ? "opacity 0.15s" : "none" }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        className={active ? "animate-spin" : ""}
        style={!active ? { transform: `rotate(${progress * 270}deg)` } : undefined}
      >
        <circle
          cx="12"
          cy="12"
          r={R}
          fill="none"
          stroke="#1b3a5c"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: active ? "none" : "stroke-dashoffset 0.05s" }}
        />
      </svg>
    </div>
  );
}
