"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import {
  X,
  SlidersHorizontal,
  Plus,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import { MOBILE_DRAWINGS, type MobileDrawing } from "@/lib/mobile/mockData";
import DrawingFilterPanel, { emptyFilters, type DrawingFilters } from "./DrawingFilterPanel";
import AddRecordMenu, { type AddRecordOption } from "./AddRecordMenu";
import DrawingMoreMenu from "./DrawingMoreMenu";
import DrawingRevisionPanel, { type DrawingRevision } from "./DrawingRevisionPanel";
import AnnotationRecordCard, { type AnnotationRecord } from "./AnnotationRecordCard";
import DrawingShareSheet from "./DrawingShareSheet";
import DrawingToolbar from "./DrawingToolbar";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

const DRAWING_PDF_URL = "/drawings/A2.01.pdf";
const PAGE_RENDER_PX = 3200;

// How far (px) pointer must move to count as a drag vs. a tap
const TAP_THRESHOLD = 6;

interface DrawingViewerScreenProps {
  projectId: string;
  drawingId: string;
}

interface Transform {
  tx: number;
  ty: number;
  scale: number;
}

// ─── Sample annotations ───────────────────────────────────────────────────────

const ANNOTATIONS = [
  {
    id: "ann-cloud-1",
    kind: "cloud" as const,
    // Page-space coordinates (out of PAGE_RENDER_PX = 3200 wide)
    pageX: 640,
    pageY: 760,
    width: 340,
    height: 210,
    color: "#dc2626",
    record: {
      type: "RFI",
      status: "OPEN",
      statusColor: "#ca8a04",
      number: "001",
      title: "Type H1 fixture stairway mounting height",
      description: "What is the mounting height of stairway light fixture, Type H1?",
      date: "11/23/16",
      assigneeCount: 2,
      commentCount: 4,
      recordType: "rfis",
      recordId: "rfi-001",
    } satisfies AnnotationRecord,
  },
  {
    id: "ann-pin-1",
    kind: "pin" as const,
    pageX: 1650,
    pageY: 860,
    width: 0,
    height: 0,
    color: "#dc2626",
    record: {
      type: "Punch",
      status: "OPEN",
      statusColor: "#ca8a04",
      number: "PI-001",
      title: "Paint touch-up required at stairwell wall",
      description: "Missing paint coverage on north stairwell wall, approximately 2 sq ft area near landing.",
      date: "01/15/17",
      assigneeCount: 1,
      commentCount: 2,
      recordType: "punch-items",
      recordId: "punch-001",
    } satisfies AnnotationRecord,
  },
  {
    id: "ann-rect-1",
    kind: "rect" as const,
    // Positioned over the east stairwell area on the Level 1 floor plan
    pageX: 1820,
    pageY: 1050,
    width: 460,
    height: 300,
    color: "#2563eb",
    record: {
      type: "Issue",
      status: "OPEN",
      statusColor: "#dc2626",
      number: "ISS-004",
      title: "Standing water accumulation on Level 2 slab",
      description: "Significant water pooling observed near east stairwell. Drainage appears insufficient — requires immediate review before next pour.",
      date: "07/10/26",
      assigneeCount: 2,
      commentCount: 3,
      recordType: "issues",
      recordId: "iss-04",
      latestComment: {
        authorInitials: "SC",
        authorName: "Sarah Chen",
        date: "July 9, 2026",
        text: "Reviewed with superintendent on site. Drainage slope is insufficient — contractor has been notified and must address before the next pour.",
      },
    } satisfies AnnotationRecord,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DrawingViewerScreen({
  projectId,
  drawingId,
}: DrawingViewerScreenProps) {
  const router = useRouter();

  const drawing: MobileDrawing =
    MOBILE_DRAWINGS.find((d) => d.id === drawingId) ?? MOBILE_DRAWINGS[0];

  // ── UI overlay state ──────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DrawingFilters>(emptyFilters);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [currentRevisionId, setCurrentRevisionId] = useState("rev01");
  const [selectedAnnotation, setSelectedAnnotation] = useState<typeof ANNOTATIONS[number] | null>(null);
  const [activeToolbarBtn, setActiveToolbarBtn] = useState<string | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [annotationsHidden, setAnnotationsHidden] = useState(false);

  // ── Pin placement state ───────────────────────────────────────────────────
  const [pinMode, setPinMode] = useState<AddRecordOption | null>(null);
  const [placedPin, setPlacedPin] = useState<{ px: number; py: number } | null>(null);

  const activeFilterCount =
    filters.recordTypes.size + filters.statuses.size + filters.contacts.size +
    filters.companies.size + filters.annotationTypes.size +
    filters.annotationColors.size + filters.createdBy.size;

  // ── PDF / transform state ─────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [xform, setXform] = useState<Transform>({ tx: 0, ty: 0, scale: 1 });
  const xformRef = useRef<Transform>({ tx: 0, ty: 0, scale: 1 });

  const syncXform = useCallback((next: Transform) => {
    xformRef.current = next;
    setXform(next);
  }, []);

  // Track whether the pointer moved enough to count as a drag
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const isDrag = useRef(false);

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);

  // ── PDF page load ─────────────────────────────────────────────────────────

  const onPageSuccess = useCallback((page: { view: number[] }) => {
    const [, , vpW, vpH] = page.view;
    const ph = (vpH / vpW) * PAGE_RENDER_PX;
    setPageHeight(ph);
    setPdfReady(true);
  }, []);

  useEffect(() => {
    if (!pdfReady || pageHeight === null) return;
    const container = containerRef.current;
    if (!container) return;
    let attempts = 0;
    const measure = () => {
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      if ((containerW === 0 || containerH === 0) && attempts < 20) {
        // Container not yet laid out (can happen during concurrent transitions) — retry
        attempts++;
        setTimeout(measure, 50);
        return;
      }
      if (containerW === 0 || containerH === 0) return;
      const initialScale = containerW / PAGE_RENDER_PX;
      const scaledH = pageHeight * initialScale;
      const ty = (containerH - scaledH) / 2;
      syncXform({ tx: 0, ty, scale: initialScale });
    };
    requestAnimationFrame(() => requestAnimationFrame(measure));
  }, [pdfReady, pageHeight, syncXform]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const EDGE_MARGIN = 60;
  const clampTransform = useCallback(
    (t: Transform): Transform => {
      const container = containerRef.current;
      if (!container) return t;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scaledW = PAGE_RENDER_PX * t.scale;
      const scaledH = (pageHeight ?? PAGE_RENDER_PX * 0.7) * t.scale;
      return {
        tx: Math.max(EDGE_MARGIN - scaledW, Math.min(cw - EDGE_MARGIN, t.tx)),
        ty: Math.max(EDGE_MARGIN - scaledH, Math.min(ch - EDGE_MARGIN, t.ty)),
        scale: t.scale,
      };
    },
    [pageHeight]
  );

  const resetFit = useCallback(() => {
    const container = containerRef.current;
    if (!container || pageHeight === null) return;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    if (containerW === 0 || containerH === 0) return;
    const initialScale = containerW / PAGE_RENDER_PX;
    const scaledH = pageHeight * initialScale;
    syncXform({ tx: 0, ty: (containerH - scaledH) / 2, scale: initialScale });
  }, [pageHeight, syncXform]);

  // Convert container-space (x,y) → page-space (px,py)
  const toPageCoords = useCallback(
    (canvasX: number, canvasY: number) => ({
      px: (canvasX - xformRef.current.tx) / xformRef.current.scale,
      py: (canvasY - xformRef.current.ty) / xformRef.current.scale,
    }),
    []
  );

  // ── Pointer events ────────────────────────────────────────────────────────

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPinchDist.current = null;
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    isDrag.current = false;
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const prev = pointers.current.get(e.pointerId);
      if (!prev) return;
      const curr = { x: e.clientX, y: e.clientY };

      // Mark as drag if moved past threshold
      if (pointerDownPos.current) {
        const dx = e.clientX - pointerDownPos.current.x;
        const dy = e.clientY - pointerDownPos.current.y;
        if (Math.hypot(dx, dy) > TAP_THRESHOLD) isDrag.current = true;
      }

      if (pointers.current.size === 1) {
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        syncXform(clampTransform({ ...xformRef.current, tx: xformRef.current.tx + dx, ty: xformRef.current.ty + dy }));
      } else if (pointers.current.size === 2) {
        const otherEntry = Array.from(pointers.current.entries()).find(([id]) => id !== e.pointerId);
        if (!otherEntry) return;
        const other = otherEntry[1];
        const midX = (curr.x + other.x) / 2;
        const midY = (curr.y + other.y) / 2;
        const dist = Math.hypot(curr.x - other.x, curr.y - other.y);
        if (lastPinchDist.current !== null) {
          const ratio = dist / lastPinchDist.current;
          const container = containerRef.current;
          if (!container) return;
          const rect = container.getBoundingClientRect();
          const originX = midX - rect.left;
          const originY = midY - rect.top;
          const newScale = Math.max(0.15, Math.min(10, xformRef.current.scale * ratio));
          const sr = newScale / xformRef.current.scale;
          syncXform(clampTransform({
            tx: originX - sr * (originX - xformRef.current.tx),
            ty: originY - sr * (originY - xformRef.current.ty),
            scale: newScale,
          }));
        }
        lastPinchDist.current = dist;
      }
      pointers.current.set(e.pointerId, curr);
    },
    [clampTransform, syncXform]
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const wasTap = !isDrag.current && pointers.current.size === 1;

      if (wasTap) {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const { px, py } = toPageCoords(e.clientX - rect.left, e.clientY - rect.top);

          if (pinMode) {
            // Pin placement mode — drop a pin
            setPlacedPin({ px, py });
          } else {
            // Hit-test annotations (30px screen-space radius)
            const hitRadius = 30 / xformRef.current.scale;
            const hit = ANNOTATIONS.find((ann) => {
              if (ann.kind === "pin") {
                return Math.hypot(px - ann.pageX, py - ann.pageY) < hitRadius;
              }
              // Cloud / rect: hit if inside bounding rect (with small margin)
              const margin = hitRadius;
              return (
                px >= ann.pageX - margin && px <= ann.pageX + ann.width + margin &&
                py >= ann.pageY - margin && py <= ann.pageY + ann.height + margin
              );
            }) ?? null;
            setSelectedAnnotation(hit);
          }
        }
      }

      pointers.current.delete(e.pointerId);
      lastPinchDist.current = null;
      pointerDownPos.current = null;
    },
    [pinMode, toPageCoords]
  );

  // ── Mouse-wheel zoom ──────────────────────────────────────────────────────

  const onWheel = useCallback(
    (e: ReactWheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const originX = e.clientX - rect.left;
      const originY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.15, Math.min(10, xformRef.current.scale * factor));
      const sr = newScale / xformRef.current.scale;
      syncXform(clampTransform({
        tx: originX - sr * (originX - xformRef.current.tx),
        ty: originY - sr * (originY - xformRef.current.ty),
        scale: newScale,
      }));
    },
    [clampTransform, syncXform]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // ── Add menu handlers ─────────────────────────────────────────────────────

  const onAddMenuSelect = useCallback((opt: AddRecordOption) => {
    setShowAddMenu(false);
    setPinMode(opt);
    setPlacedPin(null);
  }, []);

  const cancelPinMode = useCallback(() => {
    setPinMode(null);
    setPlacedPin(null);
  }, []);

  const confirmPin = useCallback(() => {
    if (!pinMode) return;
    const params = new URLSearchParams({ fromDrawing: drawingId });
    if (placedPin) {
      params.set("pinX", String(Math.round(placedPin.px)));
      params.set("pinY", String(Math.round(placedPin.py)));
    }
    setPinMode(null);
    setPlacedPin(null);
    router.push(`/mobile/projects/${projectId}/records/${pinMode.recordType}/new?${params}`);
  }, [pinMode, placedPin, projectId, drawingId, router]);

  // ── Render ────────────────────────────────────────────────────────────────

  const { tx, ty, scale } = xform;
  const inPinMode = pinMode !== null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative" style={{ background: "#1b3a5c" }}>

      {/* ── Top bar — normal vs pin-placement ── */}
      <div
        className="flex-none flex items-center px-3 h-12 gap-2"
        style={{ background: "#1b3a5c" }}
      >
        {inPinMode ? (
          <>
            <button
              onClick={cancelPinMode}
              className="w-8 h-8 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>
            <span className="flex-1 text-sm font-semibold text-white tracking-wide truncate">
              {drawing.number} {drawing.name}
            </span>
            <button
              onClick={confirmPin}
              className="px-4 py-1.5 text-sm font-semibold text-white hover:text-white/80"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>
            <span className="flex-1 text-sm font-semibold text-white tracking-wide truncate">
              {drawing.number} {drawing.name}
            </span>
            <button
              onClick={() => setShowFilters(true)}
              className="relative w-8 h-8 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/10"
            >
              <SlidersHorizontal size={18} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-400 text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAddMenu(true)}
              className="w-8 h-8 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/10"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => setShowMoreMenu(true)}
              className="w-8 h-8 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/10"
            >
              <MoreVertical size={18} />
            </button>
          </>
        )}
      </div>

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{
          background: "#e5e7eb",
          cursor: inPinMode ? "crosshair" : "grab",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {/* Transformable layer */}
        <div
          className="absolute top-0 left-0"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          <Document file={DRAWING_PDF_URL} loading={<></>} error={<></>}>
            <Page
              pageNumber={1}
              width={PAGE_RENDER_PX}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              onLoadSuccess={onPageSuccess}
            />
          </Document>

          {/* Sample annotations */}
          {!annotationsHidden && ANNOTATIONS.map((ann) =>
            ann.kind === "cloud" ? (
              <CloudAnnotation
                key={ann.id}
                x={ann.pageX} y={ann.pageY}
                width={ann.width} height={ann.height}
                color={ann.color}
                selected={selectedAnnotation?.id === ann.id}
              />
            ) : ann.kind === "rect" ? (
              <RectAnnotation
                key={ann.id}
                x={ann.pageX} y={ann.pageY}
                width={ann.width} height={ann.height}
                color={ann.color}
                selected={selectedAnnotation?.id === ann.id}
              />
            ) : (
              <PunchPin
                key={ann.id}
                x={ann.pageX} y={ann.pageY}
                currentScale={scale}
                selected={selectedAnnotation?.id === ann.id}
              />
            )
          )}

          {/* Placed pin (new record flow) */}
          {placedPin && (
            <PunchPin x={placedPin.px} y={placedPin.py} currentScale={scale} selected={false} />
          )}
        </div>

        {/* Loading state */}
        {!pdfReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-10 h-10 rounded-full border-4 animate-spin"
                style={{ borderColor: "#1b3a5c", borderTopColor: "transparent" }}
              />
              <span className="text-xs text-gray-500 font-medium">Loading drawing…</span>
            </div>
          </div>
        )}

        {/* Revision chip — rendered inside canvas for positioning but pointer events handled via absolute sibling */}
        <div className="absolute top-3 right-3 pointer-events-none">
          <div
            className="flex items-center gap-1.5 px-4 py-2 rounded text-white text-sm font-semibold shadow-lg"
            style={{ background: "#22c55e" }}
          >
            {currentRevisionId === "rev01" ? "Current" : "Rev 00"}
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Pin mode hint */}
        {inPinMode && (
          <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
            <span className="bg-black/60 text-white text-xs px-4 py-2 rounded-full">
              Tap the drawing to place a {pinMode.label.toLowerCase()} pin
            </span>
          </div>
        )}

        {/* Reset-to-fit button */}
        {pdfReady && !inPinMode && (
          <button
            onClick={resetFit}
            className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow text-gray-600 hover:bg-white"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        )}

      </div>

      {/* ── Revision chip (outside canvas so pointer capture doesn't block it) ── */}
      {!inPinMode && !showRevisions && (
        <div className="absolute z-10 pointer-events-none" style={{ top: "calc(3rem + 0.75rem)", right: "0.75rem" }}>
          <button
            onClick={() => setShowRevisions(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-white text-sm font-semibold shadow-lg pointer-events-auto"
            style={{ background: "#22c55e" }}
          >
            {currentRevisionId === "rev01" ? "Current" : "Rev 00"}
            <ChevronDown size={14} />
          </button>
        </div>
      )}

      {/* ── Revision panel ── */}
      {showRevisions && (
        <DrawingRevisionPanel
          currentRevisionId={currentRevisionId}
          onSelect={(rev: DrawingRevision) => {
            setCurrentRevisionId(rev.id);
            setShowRevisions(false);
          }}
          onClose={() => setShowRevisions(false)}
        />
      )}

      {/* ── More menu ── */}
      {showMoreMenu && (
        <DrawingMoreMenu
          annotationsHidden={annotationsHidden}
          onToggleAnnotations={() => setAnnotationsHidden((v) => !v)}
          onShare={() => { setShowMoreMenu(false); setShowShareSheet(true); }}
          onClose={() => setShowMoreMenu(false)}
        />
      )}

      {/* ── Share sheet ── */}
      {showShareSheet && (
        <DrawingShareSheet
          drawingNumber={drawing.number}
          drawingName={drawing.name}
          onClose={() => setShowShareSheet(false)}
        />
      )}

      {/* ── Add record menu (outside canvas to avoid pointer capture) ── */}
      {showAddMenu && (
        <AddRecordMenu
          onSelect={onAddMenuSelect}
          onClose={() => setShowAddMenu(false)}
        />
      )}

      {/* ── Filter panel (outside canvas to avoid pointer capture) ── */}
      {showFilters && (
        <DrawingFilterPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* ── Annotation record card ── */}
      {selectedAnnotation && !inPinMode && (
        <div className="absolute inset-x-0 z-10" style={{ bottom: "3.5rem" }}>
          <AnnotationRecordCard
            record={selectedAnnotation.record}
            onOpen={() =>
              router.push(
                `/mobile/projects/${projectId}/records/${selectedAnnotation.record.recordType}/${selectedAnnotation.record.recordId}`
              )
            }
            onClose={() => setSelectedAnnotation(null)}
          />
        </div>
      )}

      {/* ── Bottom toolbar (hidden in pin mode) ── */}
      {!inPinMode && (
        <DrawingToolbar
          activeButton={activeToolbarBtn}
          onButtonPress={setActiveToolbarBtn}
        />
      )}
    </div>
  );
}

// ─── Cloud annotation ─────────────────────────────────────────────────────────

function CloudAnnotation({
  x, y, width, height, color, selected,
}: {
  x: number; y: number; width: number; height: number;
  color: string; selected: boolean;
}) {
  const sw = 6; // stroke width in page pixels
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, width, height }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        fill="none"
        overflow="visible"
      >
        {/* Filled tint */}
        <rect
          x={sw} y={sw} width={width - sw * 2} height={height - sw * 2}
          rx={12}
          fill={selected ? `${color}22` : `${color}12`}
        />
        {/* Bumpy cloud border — series of arcs along the perimeter */}
        <CloudPath width={width} height={height} color={color} strokeWidth={sw} selected={selected} />
      </svg>
    </div>
  );
}

function CloudPath({
  width, height, color, strokeWidth, selected,
}: {
  width: number; height: number; color: string; strokeWidth: number; selected: boolean;
}) {
  const r = 18; // bump radius
  const steps = 7;
  const top: string[] = [];
  const bottom: string[] = [];

  for (let i = 0; i < steps; i++) {
    const x1 = strokeWidth + (i * (width - strokeWidth * 2)) / steps;
    const x2 = strokeWidth + ((i + 1) * (width - strokeWidth * 2)) / steps;
    const mx = (x1 + x2) / 2;
    top.push(`M ${x1} ${strokeWidth} A ${r} ${r} 0 0 1 ${x2} ${strokeWidth}`);
    bottom.push(`M ${x1} ${height - strokeWidth} A ${r} ${r} 0 0 0 ${x2} ${height - strokeWidth}`);
    if (i === 0) {
      // left edge arcs
    }
  }
  const stepsV = 4;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i < stepsV; i++) {
    const y1 = strokeWidth + (i * (height - strokeWidth * 2)) / stepsV;
    const y2 = strokeWidth + ((i + 1) * (height - strokeWidth * 2)) / stepsV;
    left.push(`M ${strokeWidth} ${y1} A ${r} ${r} 0 0 0 ${strokeWidth} ${y2}`);
    right.push(`M ${width - strokeWidth} ${y1} A ${r} ${r} 0 0 1 ${width - strokeWidth} ${y2}`);
  }

  const d = [...top, ...bottom, ...left, ...right].join(" ");

  return (
    <path
      d={d}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={selected ? 1 : 0.85}
    />
  );
}

// ─── Rect annotation (transparent blue, Issue-linked) ────────────────────────

function RectAnnotation({
  x, y, width, height, color, selected,
}: {
  x: number; y: number; width: number; height: number;
  color: string; selected: boolean;
}) {
  const sw = 5;
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, width, height }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        fill="none"
        overflow="visible"
      >
        {/* Transparent fill */}
        <rect
          x={sw / 2} y={sw / 2}
          width={width - sw} height={height - sw}
          rx={8}
          fill={selected ? `${color}30` : `${color}18`}
        />
        {/* Solid border */}
        <rect
          x={sw / 2} y={sw / 2}
          width={width - sw} height={height - sw}
          rx={8}
          stroke={color}
          strokeWidth={sw}
          opacity={selected ? 1 : 0.82}
        />
        {/* Issue badge in top-left corner */}
        <rect x={sw / 2} y={sw / 2} width={90} height={28} rx={6} fill={color} opacity={selected ? 1 : 0.9} />
        <text
          x={sw / 2 + 45} y={sw / 2 + 19}
          textAnchor="middle"
          fontSize={16}
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          fill="white"
        >
          ISSUE
        </text>
      </svg>
    </div>
  );
}

// ─── Punch pin ────────────────────────────────────────────────────────────────

function PunchPin({
  x, y, currentScale, selected,
}: {
  x: number; y: number; currentScale: number; selected: boolean;
}) {
  const size = 36 / currentScale;
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x - size / 2, top: y - size, width: size, height: size }}
    >
      <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-md">
        <path
          d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 19 9 19s9-12.25 9-19C21 4.03 16.97 0 12 0z"
          fill="#dc2626"
          stroke={selected ? "white" : "white"}
          strokeWidth={selected ? 1.5 : 1}
          opacity={selected ? 1 : 0.9}
        />
        <circle cx="12" cy="9" r="3.5" fill="white" />
        {selected && <circle cx="12" cy="9" r="5.5" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />}
      </svg>
    </div>
  );
}

