"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MoreHorizontal,
  Grid3X3,
  List,
  Eye,
  LayoutGrid,
  FileText,
  Printer,
  AlertCircle,
  Upload,
  Download,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Share2,
  Bookmark,
  ZoomIn,
  ZoomOut,
  Users,
  Settings,
  X,
  Pencil,
  Minus,
  Type,
  Camera,
  Circle,
  ArrowUpRight,
  Square,
  Eraser,
  MousePointer,
  MessageSquare,
} from "lucide-react";

interface Drawing {
  id: number;
  number: string;
  title: string;
  drawingSet: string;
  drawingSetCount: number;
  discipline: string;
  revision: string;
  revDate: string;
  author: string;
  authorCompany: string;
  status: "current" | "superseded" | "revision";
  recentlyProcessed: boolean;
}

type SidePanelType = "search" | "info";

const mockDrawings: Drawing[] = [
  { id: 1, number: "A-001", title: "ARCHITECTURAL SITE PLAN", drawingSet: "Arch V3", drawingSetCount: 1, discipline: "Architectural", revision: "3", revDate: "2024-11-15", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 2, number: "A-104", title: "LEVEL 4 FLOOR PLAN", drawingSet: "New Arch Drawings 1", drawingSetCount: 2, discipline: "Architectural", revision: "2", revDate: "2024-12-01", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 3, number: "A-111A", title: "FLOOR PLAN FIRST FLOOR A...", drawingSet: "New Arch Drawings", drawingSetCount: 1, discipline: "Architectural", revision: "1", revDate: "2024-12-05", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: true },
  { id: 4, number: "A-120B", title: "Main Level 02   Area B", drawingSet: "New Arch Drawings", drawingSetCount: 1, discipline: "Architectural", revision: "1", revDate: "2024-12-05", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 5, number: "A-131", title: "31ST FLOOR PLAN +458'-6\"-5...", drawingSet: "New Arch Drawings", drawingSetCount: 1, discipline: "Architectural", revision: "1", revDate: "2024-11-20", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 6, number: "A2.01", title: "LEVEL 1 FLOOR PLAN", drawingSet: "Arch V3", drawingSetCount: 4, discipline: "Architectural", revision: "3", revDate: "2024-11-15", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 7, number: "A2.02", title: "LEVEL 2 FLOOR PLAN", drawingSet: "Arch V3", drawingSetCount: 4, discipline: "Architectural", revision: "3", revDate: "2024-11-15", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 8, number: "A2.03", title: "LEVEL 3 FLOOR PLAN", drawingSet: "Revision 01", drawingSetCount: 1, discipline: "Architectural", revision: "1", revDate: "2024-12-10", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "revision", recentlyProcessed: false },
  { id: 9, number: "A2.04", title: "LEVEL 4 FLOOR PLAN", drawingSet: "Revision 01", drawingSetCount: 1, discipline: "Architectural", revision: "1", revDate: "2024-12-10", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "revision", recentlyProcessed: false },
  { id: 10, number: "A2.05", title: "ROOF PLAN", drawingSet: "Arch V3", drawingSetCount: 4, discipline: "Architectural", revision: "3", revDate: "2024-11-15", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 11, number: "A3.01", title: "LEVEL 1 RCP", drawingSet: "Arch V3", drawingSetCount: 4, discipline: "Architectural", revision: "3", revDate: "2024-11-15", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 12, number: "A3.02", title: "LEVEL 2 RCP", drawingSet: "Arch V3", drawingSetCount: 4, discipline: "Architectural", revision: "3", revDate: "2024-11-15", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 13, number: "A4.01", title: "BUILDING SECTIONS", drawingSet: "Arch V3", drawingSetCount: 4, discipline: "Architectural", revision: "3", revDate: "2024-11-15", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 14, number: "A5.01", title: "EXTERIOR ELEVATIONS", drawingSet: "Arch V3", drawingSetCount: 4, discipline: "Architectural", revision: "3", revDate: "2024-11-15", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 15, number: "A6.01", title: "WALL SECTIONS", drawingSet: "New Arch Drawings 1", drawingSetCount: 2, discipline: "Architectural", revision: "2", revDate: "2024-12-01", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 16, number: "A7.01", title: "DOOR SCHEDULE", drawingSet: "Arch V3", drawingSetCount: 4, discipline: "Architectural", revision: "3", revDate: "2024-11-15", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 17, number: "A8.01", title: "ENLARGED PLANS - RESTROOMS", drawingSet: "Arch V3", drawingSetCount: 4, discipline: "Architectural", revision: "3", revDate: "2024-11-15", author: "Smith & Associates", authorCompany: "Smith & Associates", status: "current", recentlyProcessed: false },
  { id: 18, number: "S1.01", title: "GENERAL STRUCTURAL NOTES", drawingSet: "Structural Set 1", drawingSetCount: 3, discipline: "Structural", revision: "1", revDate: "2024-10-20", author: "Jones Engineering", authorCompany: "Jones Engineering", status: "current", recentlyProcessed: false },
  { id: 19, number: "S2.01", title: "FOUNDATION PLAN", drawingSet: "Structural Set 1", drawingSetCount: 3, discipline: "Structural", revision: "1", revDate: "2024-10-20", author: "Jones Engineering", authorCompany: "Jones Engineering", status: "current", recentlyProcessed: false },
  { id: 20, number: "S2.02", title: "LEVEL 1 FRAMING PLAN", drawingSet: "Structural Set 1", drawingSetCount: 3, discipline: "Structural", revision: "1", revDate: "2024-10-20", author: "Jones Engineering", authorCompany: "Jones Engineering", status: "current", recentlyProcessed: false },
  { id: 21, number: "M1.01", title: "MECHANICAL SCHEDULES", drawingSet: "MEP Set 2", drawingSetCount: 4, discipline: "Mechanical", revision: "2", revDate: "2024-11-01", author: "MEP Consultants", authorCompany: "MEP Consultants Inc.", status: "current", recentlyProcessed: false },
  { id: 22, number: "M2.01", title: "LEVEL 1 HVAC PLAN", drawingSet: "MEP Set 2", drawingSetCount: 4, discipline: "Mechanical", revision: "2", revDate: "2024-11-01", author: "MEP Consultants", authorCompany: "MEP Consultants Inc.", status: "current", recentlyProcessed: false },
  { id: 23, number: "M2.02", title: "LEVEL 2 HVAC PLAN", drawingSet: "MEP Set 2", drawingSetCount: 4, discipline: "Mechanical", revision: "2", revDate: "2024-11-01", author: "MEP Consultants", authorCompany: "MEP Consultants Inc.", status: "current", recentlyProcessed: false },
  { id: 24, number: "M2.03", title: "ROOF MECHANICAL PLAN", drawingSet: "MEP Set 2", drawingSetCount: 4, discipline: "Mechanical", revision: "2", revDate: "2024-11-01", author: "MEP Consultants", authorCompany: "MEP Consultants Inc.", status: "current", recentlyProcessed: false },
  { id: 25, number: "E1.01", title: "ELECTRICAL SITE PLAN", drawingSet: "Electrical V1", drawingSetCount: 3, discipline: "Electrical", revision: "1", revDate: "2024-10-15", author: "Spark Electric Design", authorCompany: "Spark Electric Design", status: "current", recentlyProcessed: false },
  { id: 26, number: "E2.01", title: "LEVEL 1 LIGHTING PLAN", drawingSet: "Electrical V1", drawingSetCount: 3, discipline: "Electrical", revision: "1", revDate: "2024-10-15", author: "Spark Electric Design", authorCompany: "Spark Electric Design", status: "current", recentlyProcessed: false },
  { id: 27, number: "E2.02", title: "LEVEL 1 POWER PLAN", drawingSet: "Electrical V1", drawingSetCount: 3, discipline: "Electrical", revision: "1", revDate: "2024-10-15", author: "Spark Electric Design", authorCompany: "Spark Electric Design", status: "current", recentlyProcessed: false },
  { id: 28, number: "P1.01", title: "PLUMBING GENERAL NOTES", drawingSet: "Plumbing V1", drawingSetCount: 2, discipline: "Plumbing", revision: "1", revDate: "2024-10-25", author: "MEP Consultants", authorCompany: "MEP Consultants Inc.", status: "current", recentlyProcessed: false },
  { id: 29, number: "P2.01", title: "LEVEL 1 PLUMBING PLAN", drawingSet: "Plumbing V1", drawingSetCount: 2, discipline: "Plumbing", revision: "1", revDate: "2024-10-25", author: "MEP Consultants", authorCompany: "MEP Consultants Inc.", status: "current", recentlyProcessed: false },
  { id: 30, number: "C1.01", title: "SITE GRADING PLAN", drawingSet: "Civil Set 1", drawingSetCount: 1, discipline: "Civil", revision: "1", revDate: "2024-09-15", author: "Civil Works LLC", authorCompany: "Civil Works LLC", status: "current", recentlyProcessed: false },
  { id: 31, number: "L1.01", title: "LANDSCAPE PLAN", drawingSet: "Landscape V1", drawingSetCount: 1, discipline: "Landscape", revision: "1", revDate: "2024-09-20", author: "Green Design Studio", authorCompany: "Green Design Studio", status: "current", recentlyProcessed: false },
];

function DrawingThumbnail({ drawing }: { drawing: Drawing }) {
  const seed = drawing.id;
  const hue = (seed * 47) % 360;
  const saturation = 15 + (seed % 20);
  const bgColor = `hsl(${hue}, ${saturation}%, 92%)`;
  const lineColor = `hsl(${hue}, ${saturation + 10}%, 70%)`;
  const accentColor = drawing.discipline === "Architectural"
    ? `hsl(210, 60%, 75%)`
    : drawing.discipline === "Structural"
    ? `hsl(30, 50%, 75%)`
    : drawing.discipline === "Mechanical"
    ? `hsl(120, 40%, 75%)`
    : drawing.discipline === "Electrical"
    ? `hsl(50, 60%, 75%)`
    : `hsl(${hue}, 30%, 78%)`;

  return (
    <div
      className="w-full aspect-[4/3] rounded-sm overflow-hidden relative border border-border/40"
      style={{ backgroundColor: bgColor }}
    >
      <svg viewBox="0 0 200 150" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="8" width="180" height="134" fill="none" stroke={lineColor} strokeWidth="0.5" />
        <rect x="15" y="12" width="170" height="126" fill="none" stroke={lineColor} strokeWidth="0.3" />

        {drawing.discipline === "Architectural" && (
          <>
            <rect x="30" y="30" width="60" height="80" fill="none" stroke={accentColor} strokeWidth="0.8" />
            <rect x="100" y="30" width="80" height="50" fill="none" stroke={accentColor} strokeWidth="0.8" />
            <rect x="100" y="85" width="40" height="25" fill="none" stroke={accentColor} strokeWidth="0.8" />
            <rect x="145" y="85" width="35" height="25" fill="none" stroke={accentColor} strokeWidth="0.8" />
            <line x1="60" y1="30" x2="60" y2="110" stroke={lineColor} strokeWidth="0.4" />
            <line x1="30" y1="70" x2="90" y2="70" stroke={lineColor} strokeWidth="0.4" />
            <rect x="42" y="95" width="8" height="15" fill="none" stroke={lineColor} strokeWidth="0.5" />
            {[35, 50, 65, 75].map((x) => (
              <line key={x} x1={x} y1="115" x2={x} y2="120" stroke={lineColor} strokeWidth="0.3" />
            ))}
          </>
        )}

        {drawing.discipline === "Structural" && (
          <>
            {[40, 70, 100, 130, 160].map((x) => (
              <React.Fragment key={x}>
                <line x1={x} y1="25" x2={x} y2="125" stroke={accentColor} strokeWidth="0.6" />
                {[40, 65, 90, 115].map((y) => (
                  <circle key={y} cx={x} cy={y} r="2" fill="none" stroke={accentColor} strokeWidth="0.5" />
                ))}
              </React.Fragment>
            ))}
            {[40, 65, 90, 115].map((y) => (
              <line key={y} x1="30" y1={y} x2="170" y2={y} stroke={lineColor} strokeWidth="0.4" />
            ))}
          </>
        )}

        {drawing.discipline === "Mechanical" && (
          <>
            <path d="M 30 60 L 80 60 L 80 40 L 130 40 L 130 80 L 170 80" fill="none" stroke={accentColor} strokeWidth="0.8" />
            <path d="M 30 90 L 60 90 L 60 110 L 120 110 L 120 70 L 170 70" fill="none" stroke={accentColor} strokeWidth="0.6" strokeDasharray="4,2" />
            <rect x="75" y="35" width="12" height="12" fill="none" stroke={lineColor} strokeWidth="0.6" />
            <rect x="125" y="75" width="12" height="12" fill="none" stroke={lineColor} strokeWidth="0.6" />
          </>
        )}

        {drawing.discipline === "Electrical" && (
          <>
            <circle cx="60" cy="60" r="15" fill="none" stroke={accentColor} strokeWidth="0.6" />
            <circle cx="140" cy="60" r="15" fill="none" stroke={accentColor} strokeWidth="0.6" />
            <circle cx="100" cy="100" r="15" fill="none" stroke={accentColor} strokeWidth="0.6" />
            <line x1="75" y1="60" x2="125" y2="60" stroke={lineColor} strokeWidth="0.5" />
            <line x1="60" y1="75" x2="100" y2="85" stroke={lineColor} strokeWidth="0.5" />
            <line x1="140" y1="75" x2="100" y2="85" stroke={lineColor} strokeWidth="0.5" />
          </>
        )}

        {!["Architectural", "Structural", "Mechanical", "Electrical"].includes(drawing.discipline) && (
          <>
            <path d="M 25 120 Q 60 30 100 80 Q 140 130 175 40" fill="none" stroke={accentColor} strokeWidth="0.7" />
            <rect x="40" y="40" width="120" height="70" fill="none" stroke={lineColor} strokeWidth="0.4" />
            {[60, 80, 100, 120, 140].map((x) => (
              <line key={x} x1={x} y1="40" x2={x} y2="110" stroke={lineColor} strokeWidth="0.2" />
            ))}
          </>
        )}

        <rect x="140" y="120" width="50" height="18" fill="white" fillOpacity="0.8" stroke={lineColor} strokeWidth="0.3" />
        <text x="165" y="131" textAnchor="middle" fontSize="5" fill={lineColor} fontFamily="sans-serif">{drawing.number}</text>
      </svg>

      {drawing.recentlyProcessed && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  );
}

function DrawingViewer({
  drawing,
  allDrawings,
  onClose,
  onNavigate,
}: {
  drawing: Drawing;
  allDrawings: Drawing[];
  onClose: () => void;
  onNavigate: (id: number) => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [zoom, setZoom] = useState(100);

  const currentIndex = allDrawings.findIndex((d) => d.id === drawing.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allDrawings.length - 1;

  const filteredList = sidebarSearch
    ? allDrawings.filter(
        (d) =>
          d.number.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
          d.title.toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    : allDrawings;

  const markupTools = [
    { icon: MousePointer, label: "Select" },
    { icon: Pencil, label: "Draw" },
    { icon: Minus, label: "Line" },
    { icon: Type, label: "Text" },
    { icon: Camera, label: "Snapshot" },
    { icon: Circle, label: "Circle", className: "text-red-500" },
    { icon: ArrowUpRight, label: "Arrow" },
    { icon: Square, label: "Rectangle" },
    { icon: Eraser, label: "Eraser" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top toolbar */}
      <div className="h-11 border-b bg-background flex items-center px-3 gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-sm gap-1 h-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Done
        </Button>

        <div className="flex items-center gap-1 ml-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!hasPrev}
            onClick={() => hasPrev && onNavigate(allDrawings[currentIndex - 1].id)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!hasNext}
            onClick={() => hasNext && onNavigate(allDrawings[currentIndex + 1].id)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium mx-2 max-w-xs truncate">
            {drawing.number} - {drawing.title}
          </span>

          <Select defaultValue="current">
            <SelectTrigger className="h-7 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">
                Rev. {drawing.revision.padStart(2, "0")} Current
              </SelectItem>
              <SelectItem value="previous">
                Rev. {String(Math.max(0, Number(drawing.revision) - 1)).padStart(2, "0")} Previous
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Users className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - drawing list */}
        {sidebarOpen && (
          <div className="w-56 border-r bg-background flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-sm font-semibold">
                Drawings ({allDrawings.length})
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSidebarSearch(sidebarSearch ? "" : " ")}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {sidebarSearch !== "" && (
              <div className="px-2 py-1.5 border-b">
                <input
                  autoFocus
                  placeholder="Search drawings..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {filteredList.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onNavigate(d.id)}
                  className={`w-full flex items-start gap-2 px-2 py-2 text-left hover:bg-accent/50 border-l-3 transition-colors ${
                    d.id === drawing.id
                      ? "bg-blue-50 dark:bg-blue-950/30 border-l-blue-600"
                      : "border-l-transparent"
                  }`}
                >
                  <div className="w-10 h-8 flex-shrink-0 bg-muted rounded-sm overflow-hidden border border-border/50">
                    <svg
                      viewBox="0 0 40 30"
                      className="w-full h-full"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="36"
                        height="26"
                        fill="none"
                        stroke="#ccc"
                        strokeWidth="0.5"
                      />
                      <line
                        x1="5"
                        y1="8"
                        x2="35"
                        y2="8"
                        stroke="#ddd"
                        strokeWidth="0.3"
                      />
                      <line
                        x1="20"
                        y1="5"
                        x2="20"
                        y2="25"
                        stroke="#ddd"
                        strokeWidth="0.3"
                      />
                      <rect
                        x="8"
                        y="10"
                        width="10"
                        height="12"
                        fill="none"
                        stroke="#bbb"
                        strokeWidth="0.4"
                      />
                      <rect
                        x="22"
                        y="10"
                        width="12"
                        height="8"
                        fill="none"
                        stroke="#bbb"
                        strokeWidth="0.4"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">
                      {d.number}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate leading-tight">
                      {d.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main drawing area */}
        <div className="flex-1 bg-neutral-800 relative flex items-center justify-center overflow-hidden">
          {!sidebarOpen && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-2 z-10 h-8 w-8 bg-background/80 backdrop-blur"
              onClick={() => setSidebarOpen(true)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          <iframe
            src={`/A2.01.pdf#zoom=${zoom}&toolbar=0&navpanes=0`}
            className="w-full h-full border-0"
            title={`${drawing.number} - ${drawing.title}`}
          />

          {/* Zoom controls overlay */}
          <div className="absolute bottom-4 right-16 flex items-center gap-1 bg-background/90 backdrop-blur rounded-lg shadow-lg px-2 py-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.max(25, z - 25))}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium w-10 text-center">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.min(400, z + 25))}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Right toolbar - markup tools */}
        <div className="w-11 border-l bg-background flex flex-col items-center py-2 gap-1 flex-shrink-0">
          {markupTools.map((tool) => (
            <Button
              key={tool.label}
              variant="ghost"
              size="icon"
              className={`h-9 w-9 ${tool.className || ""}`}
              title={tool.label}
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DrawingsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedView, setSelectedView] = useState("Default view");
  const [selectedGroup, setSelectedGroup] = useState("Group");
  const [selectedSort, setSelectedSort] = useState("Number (semantically)");
  const [selectedPanel, setSelectedPanel] = useState<SidePanelType>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrawingId, setSelectedDrawingId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    recentlyProcessed: false,
    location: "",
    revDateFrom: "",
    revDateTo: "",
    linkedSpecifications: "",
    group: "",
    drawingSet: "Current set",
    discipline: "",
    author: "",
    authorCompany: "",
  });

  const handleFilterChange = (key: string, value: boolean | string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetSearch = () => {
    setSearchQuery("");
    setFilters({
      recentlyProcessed: false,
      location: "",
      revDateFrom: "",
      revDateTo: "",
      linkedSpecifications: "",
      group: "",
      drawingSet: "Current set",
      discipline: "",
      author: "",
      authorCompany: "",
    });
  };

  const filteredDrawings = mockDrawings.filter((d) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!d.number.toLowerCase().includes(q) && !d.title.toLowerCase().includes(q)) return false;
    }
    if (filters.recentlyProcessed && !d.recentlyProcessed) return false;
    if (filters.discipline && d.discipline !== filters.discipline) return false;
    if (filters.author && d.author !== filters.author) return false;
    if (filters.authorCompany && d.authorCompany !== filters.authorCompany) return false;
    return true;
  });

  const getGroupedDrawings = () => {
    if (selectedGroup === "Group" || selectedGroup === "None") return null;

    const grouped = filteredDrawings.reduce((acc, drawing) => {
      let key: string;
      if (selectedGroup === "Drawing set") key = drawing.drawingSet;
      else if (selectedGroup === "Discipline") key = drawing.discipline;
      else if (selectedGroup === "Author") key = drawing.author;
      else return acc;

      if (!acc[key]) acc[key] = [];
      acc[key].push(drawing);
      return acc;
    }, {} as Record<string, Drawing[]>);

    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as Record<string, Drawing[]>);
  };

  const groupedDrawings = getGroupedDrawings();

  const uniqueDrawingSets = Array.from(new Set(mockDrawings.map((d) => d.drawingSet)));
  const uniqueDisciplines = Array.from(new Set(mockDrawings.map((d) => d.discipline)));
  const uniqueAuthors = Array.from(new Set(mockDrawings.map((d) => d.author)));
  const uniqueAuthorCompanies = Array.from(new Set(mockDrawings.map((d) => d.authorCompany)));

  const selectedDrawing = selectedDrawingId
    ? mockDrawings.find((d) => d.id === selectedDrawingId) ?? null
    : null;

  if (selectedDrawing) {
    return (
      <DrawingViewer
        drawing={selectedDrawing}
        allDrawings={mockDrawings}
        onClose={() => setSelectedDrawingId(null)}
        onNavigate={(id) => setSelectedDrawingId(id)}
      />
    );
  }

  const renderDrawingCard = (drawing: Drawing) => (
    <Card
      key={drawing.id}
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => setSelectedDrawingId(drawing.id)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="rounded"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="font-semibold text-sm">{drawing.number}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mb-2 truncate">{drawing.title}</p>

        <DrawingThumbnail drawing={drawing} />

        <div className="mt-2 text-xs text-muted-foreground">
          {drawing.drawingSet} ({drawing.drawingSetCount})
        </div>
      </CardContent>
    </Card>
  );

  const renderDrawingListItem = (drawing: Drawing) => (
    <Card
      key={drawing.id}
      className="hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => setSelectedDrawingId(drawing.id)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <input
              type="checkbox"
              className="rounded flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="font-semibold text-sm w-20 flex-shrink-0">{drawing.number}</span>
            <span className="text-sm truncate">{drawing.title}</span>
            <Badge variant="outline" className="flex-shrink-0 text-xs">
              {drawing.discipline}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 flex-shrink-0">
            <span className="text-xs text-muted-foreground">Rev {drawing.revision}</span>
            <span className="text-xs text-muted-foreground">{drawing.revDate}</span>
            <span className="text-xs text-muted-foreground">{drawing.drawingSet}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Top toolbar */}
        <div className="flex justify-end items-center gap-2 p-2 border-b bg-background">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <AlertCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main toolbar */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-blue-600">
                Viewing {filteredDrawings.length} Drawings
              </h1>

              <Button className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 text-sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>

              <Select value={selectedView} onValueChange={setSelectedView}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-3.5 w-3.5" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default view">Default view</SelectItem>
                  <SelectItem value="All Drawings">All Drawings</SelectItem>
                  <SelectItem value="Current Set">Current Set</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Group">Group</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Drawing set">Drawing set</SelectItem>
                  <SelectItem value="Discipline">Discipline</SelectItem>
                  <SelectItem value="Author">Author</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="w-52 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Number (semantically)">Number (semantically)</SelectItem>
                  <SelectItem value="Number (alphabetically)">Number (alphabetically)</SelectItem>
                  <SelectItem value="Title">Title</SelectItem>
                  <SelectItem value="Revision date">Revision date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Drawing cards */}
        <div className="flex-1 p-6 overflow-auto">
          {viewMode === "grid" ? (
            groupedDrawings ? (
              <div className="space-y-8">
                {Object.entries(groupedDrawings).map(([group, drawings]) => (
                  <div key={group} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-muted-foreground">{group}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {drawings.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {drawings.map(renderDrawingCard)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredDrawings.map(renderDrawingCard)}
              </div>
            )
          ) : groupedDrawings ? (
            <div className="space-y-6">
              {Object.entries(groupedDrawings).map(([group, drawings]) => (
                <div key={group} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-muted-foreground">{group}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {drawings.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {drawings.map(renderDrawingListItem)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDrawings.map(renderDrawingListItem)}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-72 border-l bg-muted/30 flex flex-col">
        <div className="flex justify-end items-center p-2 border-b bg-background">
          <div className="flex items-center gap-1">
            <Button
              variant={selectedPanel === "search" ? "default" : "ghost"}
              size="icon"
              onClick={() => setSelectedPanel("search")}
              className="h-8 w-8"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedPanel === "info" ? "default" : "ghost"}
              size="icon"
              onClick={() => setSelectedPanel("info")}
              className="h-8 w-8"
              title="Info"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-5 overflow-y-auto">
          {selectedPanel === "search" && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-sm">Location</h3>
                <Select value={filters.location} onValueChange={(v) => handleFilterChange("location", v)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="level-1">Level 1</SelectItem>
                    <SelectItem value="level-2">Level 2</SelectItem>
                    <SelectItem value="level-3">Level 3</SelectItem>
                    <SelectItem value="level-4">Level 4</SelectItem>
                    <SelectItem value="roof">Roof</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-sm">Rev. date</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.revDateFrom}
                    onChange={(e) => handleFilterChange("revDateFrom", e.target.value)}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <input
                    type="date"
                    value={filters.revDateTo}
                    onChange={(e) => handleFilterChange("revDateTo", e.target.value)}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recently processed</span>
                <Switch
                  checked={filters.recentlyProcessed}
                  onCheckedChange={(checked) => handleFilterChange("recentlyProcessed", checked)}
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-sm text-blue-600">Linked Specifications</h3>
                <Select value={filters.linkedSpecifications} onValueChange={(v) => handleFilterChange("linkedSpecifications", v)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Linked Specifications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm text-blue-600">By</h3>

                <div className="space-y-2">
                  <Select value={filters.group} onValueChange={(v) => handleFilterChange("group", v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="drawing-set">Drawing set</SelectItem>
                      <SelectItem value="discipline">Discipline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Select value={filters.drawingSet} onValueChange={(v) => handleFilterChange("drawingSet", v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Drawing set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Current set">Current set</SelectItem>
                      {uniqueDrawingSets.map((ds) => (
                        <SelectItem key={ds} value={ds}>{ds}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Select value={filters.discipline} onValueChange={(v) => handleFilterChange("discipline", v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueDisciplines.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Select value={filters.author} onValueChange={(v) => handleFilterChange("author", v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Author" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueAuthors.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Select value={filters.authorCompany} onValueChange={(v) => handleFilterChange("authorCompany", v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Author company" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueAuthorCompanies.map((ac) => (
                        <SelectItem key={ac} value={ac}>{ac}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button variant="outline" onClick={resetSearch} className="w-full text-sm">
                Reset search
              </Button>
            </>
          )}

          {selectedPanel === "info" && (
            <div className="text-center text-muted-foreground py-8">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a drawing to view its information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
