"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, CloudDownload, Grid2X2, History, Info, MoreVertical, Search, Share2, X, XCircle } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { SpecSection } from "@/lib/mobile/mockData";
import DrawingShareSheet from "./DrawingShareSheet";

interface Transform { tx: number; ty: number; scale: number; }

// Page render resolution — higher = sharper when zoomed
const PAGE_WIDTH_PX = 1200;

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

type SubView = "pdf" | "recent" | "search" | "form" | "thumbnails" | "revisions";

interface SpecRevision {
  id: string;
  number: string;
  date: string;
  isCurrent: boolean;
}

// Two mock revisions per section
const MOCK_REVISIONS: SpecRevision[] = [
  { id: "rev01", number: "01", date: "1/19/21", isCurrent: true },
  { id: "rev00", number: "00", date: "12/16/20", isCurrent: false },
];

// Mock recently viewed list
const RECENTLY_VIEWED = [
  { id: "s000000", code: "000000", title: "TOC", revision: "01", status: "CURRENT" },
];

// Mock search results
const MOCK_SEARCH_RESULTS = [
  { page: 1, snippets: [
    "Construction Documents SECTION 011000 - SUMMARY PART 1 -",
    "the construction stage. 1. See Division 01 Section",
    "for construction operations during construction period. Contractor's use of",
    "during construction period. Contractor's use of Project site is",
  ]},
];

interface Props {
  section: SpecSection;
  onBack: () => void;
}

// ─── Form View ────────────────────────────────────────────────────────────────

function SpecFormView({ section, onBack }: { section: SpecSection; onBack: () => void }) {
  const rows: { label: string; value: string; chevron?: boolean }[] = [
    { label: "Section code", value: `${section.code} - ${section.title}` },
    { label: "Status", value: section.status },
    { label: "Group", value: section.group },
    { label: "Revision", value: section.revision, chevron: true },
    { label: "Division", value: section.division },
    { label: "Discipline", value: section.discipline },
    { label: "Issue date", value: section.issueDate },
    { label: "Received date", value: section.receivedDate },
    { label: "Specification set", value: section.specSet },
    { label: "CC", value: "", chevron: true },
    { label: "Records", value: "" },
    { label: "Web links", value: "" },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onBack} className="text-white p-1 mr-2"><ArrowLeft size={20} /></button>
        <h1 className="text-white font-semibold text-base">Specification</h1>
      </header>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3">
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">{row.label}</p>
              {row.value && <p className="text-sm text-gray-800 dark:text-gray-100 mt-0.5">{row.value}</p>}
            </div>
            {row.chevron && <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />}
          </div>
        ))}
      </div>

      {/* Read-only toast */}
      <div className="flex-none bg-gray-600/90 px-4 py-3">
        <p className="text-white text-sm text-center">This record is read-only.</p>
      </div>
    </div>
  );
}

// ─── Thumbnails View ──────────────────────────────────────────────────────────

function ThumbnailsView({ section, onBack, totalPages, onGoToPage }: { section: SpecSection; onBack: () => void; totalPages: number; onGoToPage: (p: number) => void }) {
  const [tab, setTab] = useState<"thumbnails" | "outlines">("thumbnails");
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onBack} className="text-white p-1 mr-2"><ArrowLeft size={20} /></button>
        <h1 className="text-white font-semibold text-base truncate flex-1">{section.code} - {section.title}</h1>
      </header>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none px-4 gap-4">
        {(["thumbnails", "outlines"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 text-sm font-medium border-b-2 capitalize ${tab === t ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400"}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "thumbnails" ? (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-3">
            {pageNums.map(n => (
              <button
                key={n}
                onClick={() => { onGoToPage(n); onBack(); }}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-full bg-white dark:bg-gray-800 rounded border-2 overflow-hidden aspect-[8.5/11] flex items-center justify-center ${n === 1 ? "border-blue-500 dark:border-blue-400" : "border-gray-200 dark:border-gray-700"}`}>
                  <Document file={section.pdfPath ?? ""} loading={<></>} error={<></>}>
                    <Page pageNumber={n} width={130} renderAnnotationLayer={false} renderTextLayer={false} />
                  </Document>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{n}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          No outline available
        </div>
      )}
    </div>
  );
}

// ─── Recently Viewed ──────────────────────────────────────────────────────────

function RecentlyViewedView({ onBack, onOpen }: { onBack: () => void; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onBack} className="text-white p-1 mr-2"><ArrowLeft size={20} /></button>
        <h1 className="text-white font-semibold text-base">Recently Viewed</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        {RECENTLY_VIEWED.map(item => (
          <button
            key={item.id}
            className="w-full flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => { onOpen(item.id); onBack(); }}
          >
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.code} - {item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Revision {item.revision} {item.status}</p>
            </div>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Search View ──────────────────────────────────────────────────────────────

function SearchView({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");

  const totalHits = query ? MOCK_SEARCH_RESULTS.reduce((n, r) => n + r.snippets.length, 0) : 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white dark:bg-gray-900">
      {/* Search header */}
      <header className="flex items-center px-3 py-2 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <input
          autoFocus
          className="flex-1 bg-white/20 text-white placeholder-white/60 rounded-full px-4 py-2 text-sm focus:outline-none"
          placeholder="Search"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="ml-3 text-white text-sm font-medium" onClick={onBack}>Cancel</button>
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {query ? (
          <>
            <p className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{totalHits} Results Found</p>
            {MOCK_SEARCH_RESULTS.map(result => (
              <div key={result.page}>
                <p className="px-4 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200">Page {result.page}</p>
                {result.snippets.map((snippet, i) => (
                  <div key={i} className="mx-4 mb-2 bg-white dark:bg-gray-900 rounded-lg px-4 py-3 shadow-sm">
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                      {snippet.split(new RegExp(`(${query})`, "gi")).map((part, j) =>
                        part.toLowerCase() === query.toLowerCase()
                          ? <mark key={j} className="bg-yellow-200 dark:bg-yellow-600 text-gray-800 dark:text-gray-100 rounded px-0.5">{part}</mark>
                          : part
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </>
        ) : (
          <p className="px-4 py-8 text-sm text-gray-400 dark:text-gray-500 text-center">Type to search within this specification</p>
        )}
      </div>

      {query && (
        <button
          className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg"
          onClick={onBack}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Revisions View ───────────────────────────────────────────────────────────

function RevisionsView({
  section,
  currentRevId,
  onSelect,
  onBack,
}: {
  section: SpecSection;
  currentRevId: string;
  onSelect: (rev: SpecRevision) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onBack} className="text-white p-1 mr-2"><ArrowLeft size={20} /></button>
        <h1 className="text-white font-semibold text-base">Revisions</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {MOCK_REVISIONS.map(rev => {
          const isSelected = rev.id === currentRevId;
          const borderColor = rev.isCurrent ? "#16a34a" : "#dc2626";
          return (
            <button
              key={rev.id}
              className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 text-left flex items-start gap-0 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => { onSelect(rev); onBack(); }}
            >
              {/* Colored left border accent */}
              <div className="w-1 self-stretch rounded-r mr-3 flex-none" style={{ backgroundColor: borderColor }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Revision {rev.number}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Rev. Date: {rev.date}</span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {section.code} - {section.title}
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-bold"
                    style={{ color: borderColor }}
                  >
                    {rev.isCurrent ? "CURRENT" : "NOT CURRENT"}
                  </span>
                  {!rev.isCurrent && (
                    <CloudDownload size={22} style={{ color: "#1b3a5c" }} />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── More Menu ────────────────────────────────────────────────────────────────

function MoreMenu({ onClose, onViewForm, onThumbnails, onShare }: { onClose: () => void; onViewForm: () => void; onThumbnails: () => void; onShare: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true))); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 250); };

  const actions = [
    { icon: <Info size={20} className="text-gray-600 dark:text-gray-300 flex-none" />, label: "View Form", action: onViewForm },
    { icon: <Grid2X2 size={20} className="text-gray-600 dark:text-gray-300 flex-none" />, label: "Thumbnails", action: onThumbnails },
    { icon: <Share2 size={20} className="text-gray-600 dark:text-gray-300 flex-none" />, label: "Share", action: onShare },
  ];

  return (
    <>
      <div
        className="absolute inset-0 z-50 bg-black/40 transition-opacity duration-250"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl overflow-hidden transition-transform duration-250"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          {actions.map(item => (
            <button
              key={item.label}
              onClick={() => { item.action(); handleClose(); }}
              className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
            >
              {item.icon}
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.label}</span>
            </button>
          ))}
          <button onClick={handleClose} className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800">
            <XCircle size={20} className="text-gray-500 dark:text-gray-400 flex-none" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancel</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Viewer ──────────────────────────────────────────────────────────────

// Gap between pages in rendered pixels
const PAGE_GAP = 24;

export default function SpecViewerScreen({ section, onBack }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subView, setSubView] = useState<SubView>("pdf");
  const [showMore, setShowMore] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [activeRevision, setActiveRevision] = useState<SpecRevision>(MOCK_REVISIONS[0]);

  // Pan / zoom state
  const containerRef = useRef<HTMLDivElement>(null);
  const [xform, setXform] = useState<Transform>({ tx: 0, ty: 0, scale: 1 });
  const xformRef = useRef<Transform>({ tx: 0, ty: 0, scale: 1 });
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);

  // Per-page height in rendered px (set after first page loads)
  const [pageHeightPx, setPageHeightPx] = useState<number | null>(null);
  const pdfReady = useRef(false);

  const syncXform = useCallback((next: Transform) => {
    xformRef.current = next;
    setXform(next);
  }, []);

  // Total height of the stacked-pages canvas in rendered px
  const totalCanvasHeight = useCallback(
    (pages: number, phPx: number) => pages * phPx + (pages - 1) * PAGE_GAP,
    []
  );

  // After first page renders, fit width to container
  const onFirstPageRender = useCallback(() => {
    if (pdfReady.current) return;
    pdfReady.current = true;
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (!cw || !ch) return;
      // 0.88 leaves ~6% margin each side so pages aren't edge-to-edge
      const initialScale = (cw / PAGE_WIDTH_PX) * 0.88;
      const scaledW = PAGE_WIDTH_PX * initialScale;
      // Centre horizontally; small top margin
      const tx = (cw - scaledW) / 2;
      const ph = (11 / 8.5) * PAGE_WIDTH_PX;
      setPageHeightPx(ph);
      syncXform({ tx, ty: 16, scale: initialScale });
    };
    requestAnimationFrame(() => requestAnimationFrame(measure));
  }, [syncXform]);

  // Once we know real page height, update transform
  const onPageLoad = useCallback((page: { view: number[] }) => {
    const [, , w, h] = page.view;
    const ph = (h / w) * PAGE_WIDTH_PX;
    setPageHeightPx(ph);
  }, []);

  const EDGE_MARGIN = 40;
  const clamp = useCallback(
    (t: Transform): Transform => {
      const container = containerRef.current;
      if (!container || pageHeightPx === null) return t;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scaledW = PAGE_WIDTH_PX * t.scale;
      const scaledH = totalCanvasHeight(totalPages, pageHeightPx) * t.scale;
      return {
        tx: Math.max(EDGE_MARGIN - scaledW, Math.min(cw - EDGE_MARGIN, t.tx)),
        ty: Math.max(EDGE_MARGIN - scaledH, Math.min(ch - EDGE_MARGIN, t.ty)),
        scale: t.scale,
      };
    },
    [pageHeightPx, totalPages, totalCanvasHeight]
  );

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPinchDist.current = null;
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const curr = { x: e.clientX, y: e.clientY };

    if (pointers.current.size === 2) {
      // Pinch zoom
      const ids = Array.from(pointers.current.keys());
      const other = pointers.current.get(ids.find(id => id !== e.pointerId)!)!;
      const dist = Math.hypot(curr.x - other.x, curr.y - other.y);
      if (lastPinchDist.current !== null) {
        const ratio = dist / lastPinchDist.current;
        const t = xformRef.current;
        const midX = (curr.x + other.x) / 2;
        const midY = (curr.y + other.y) / 2;
        const container = containerRef.current!;
        const rect = container.getBoundingClientRect();
        const ox = midX - rect.left;
        const oy = midY - rect.top;
        const newScale = Math.max(0.3, Math.min(6, t.scale * ratio));
        const scaleDiff = newScale / t.scale;
        syncXform(clamp({
          tx: ox - scaleDiff * (ox - t.tx),
          ty: oy - scaleDiff * (oy - t.ty),
          scale: newScale,
        }));
      }
      lastPinchDist.current = dist;
    } else {
      // Pan
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const t = xformRef.current;
      syncXform(clamp({ tx: t.tx + dx, ty: t.ty + dy, scale: t.scale }));
    }
    pointers.current.set(e.pointerId, curr);
  }, [clamp, syncXform]);

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    lastPinchDist.current = null;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    const t = xformRef.current;
    const delta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newScale = Math.max(0.3, Math.min(6, t.scale * delta));
    const scaleDiff = newScale / t.scale;
    syncXform(clamp({
      tx: ox - scaleDiff * (ox - t.tx),
      ty: oy - scaleDiff * (oy - t.ty),
      scale: newScale,
    }));
  }, [clamp, syncXform]);

  const onDocumentLoad = useCallback(({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
  }, []);

  if (subView === "form") return <SpecFormView section={section} onBack={() => setSubView("pdf")} />;
  if (subView === "thumbnails") return <ThumbnailsView section={section} onBack={() => setSubView("pdf")} totalPages={totalPages} onGoToPage={setCurrentPage} />;
  if (subView === "recent") return <RecentlyViewedView onBack={() => setSubView("pdf")} onOpen={() => {}} />;
  if (subView === "search") return <SearchView onBack={() => setSubView("pdf")} />;
  if (subView === "revisions") return (
    <RevisionsView
      section={section}
      currentRevId={activeRevision.id}
      onSelect={rev => { setActiveRevision(rev); pdfReady.current = false; }}
      onBack={() => setSubView("pdf")}
    />
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative bg-gray-200">
      {showMore && (
        <MoreMenu
          onClose={() => setShowMore(false)}
          onViewForm={() => setSubView("form")}
          onThumbnails={() => setSubView("thumbnails")}
          onShare={() => { setShowMore(false); setShowShareSheet(true); }}
        />
      )}

      {showShareSheet && (
        <DrawingShareSheet
          drawingNumber={section.code}
          drawingName={section.title}
          onClose={() => setShowShareSheet(false)}
        />
      )}

      {/* Header */}
      <header className="flex items-center px-3 py-3 flex-none z-10" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onBack} className="text-white p-1 mr-2"><X size={20} /></button>
        <h1 className="text-white font-semibold text-base flex-1 truncate">
          {section.code} - {section.title}
        </h1>
        <div className="flex items-center gap-1">
          <button className="p-2 text-white" onClick={() => setSubView("recent")}><History size={20} /></button>
          <button className="p-2 text-white" onClick={() => setSubView("search")}><Search size={20} /></button>
          <button className="p-2 text-white" onClick={() => setShowMore(true)}><MoreVertical size={20} /></button>
        </div>
      </header>

      {/* Revision chip row — sits between header and canvas */}
      <div className="flex-none flex justify-end px-3 py-1.5 bg-gray-200 z-10">
        <button
          onClick={() => setSubView("revisions")}
          className="flex items-center gap-1 text-white text-sm font-semibold px-3 py-1.5 rounded shadow"
          style={{
            backgroundColor: activeRevision.isCurrent
              ? "#16a34a"
              : "rgba(220, 38, 38, 0.75)",
          }}
        >
          {activeRevision.isCurrent ? "Current" : "Not Current"}
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Pan/zoom canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        style={{ cursor: "grab" }}
      >
        <div
          style={{
            transform: `translate(${xform.tx}px, ${xform.ty}px) scale(${xform.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          <Document
            file={section.pdfPath ?? ""}
            onLoadSuccess={onDocumentLoad}
            loading={<div className="text-gray-400 text-sm p-8">Loading…</div>}
            error={<div className="text-gray-400 text-sm p-8">Could not load PDF</div>}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <div
                key={n}
                className="bg-white shadow-lg"
                style={{
                  width: PAGE_WIDTH_PX,
                  marginBottom: n < totalPages ? PAGE_GAP : 0,
                }}
              >
                <Page
                  pageNumber={n}
                  width={PAGE_WIDTH_PX}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  onLoadSuccess={n === 1 ? onPageLoad : undefined}
                  onRenderSuccess={n === 1 ? onFirstPageRender : undefined}
                />
              </div>
            ))}
          </Document>
        </div>
      </div>

      {/* Page navigation bar */}
      <div className="flex-none flex items-center justify-center gap-4 bg-gray-800/90 py-2 px-6">
        <button
          className="text-white disabled:opacity-30"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-white text-sm font-mono min-w-[64px] text-center">
          {currentPage} / {totalPages}
        </span>
        <button
          className="text-white disabled:opacity-30"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
