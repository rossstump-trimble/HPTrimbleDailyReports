"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Upload,
  MoreVertical,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  List,
  Info,
  Filter,
} from "lucide-react";
import { PiBlueprint } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/DataTable";
import { formatFileSize } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

// Sample drawing data using folder names from FieldDataTreeView
const drawings = [
  {
    id: 1,
    name: "A1-051 OVERALL PLAN - LEVEL 1",
    date: "March 5, 2025",
    time: "10:25 AM",
    filename: "drawing0.png",
  },
  {
    id: 2,
    name: "A1-051 OVERALL PLAN - GROUND LEVEL",
    date: "March 5, 2025",
    time: "10:25 AM",
    filename: "drawing1.png",
  },
  {
    id: 3,
    name: "A1-051 OVERALL PLAN - BASEMENT",
    date: "March 5, 2025",
    time: "10:25 AM",
    filename: "drawing2.png",
  },
  {
    id: 4,
    name: "A1-051 OVERALL PLAN - BASEMENT",
    date: "March 5, 2025",
    time: "10:25 AM",
    filename: "drawing3.png",
  },
  {
    id: 5,
    name: "A1-051 OVERALL PLAN - BASEMENT",
    date: "March 5, 2025",
    time: "10:25 AM",
    filename: "drawing4.png",
  },
  {
    id: 6,
    name: "A1-051 OVERALL PLAN - BASEMENT",
    date: "March 5, 2025",
    time: "10:25 AM",
    filename: "drawing5.png",
  },
  {
    id: 7,
    name: "A1-051 OVERALL PLAN - GROUND LEVEL",
    date: "March 5, 2025",
    time: "10:25 AM",
    filename: "drawing5.png",
  },
  {
    id: 8,
    name: "A1-051 OVERALL PLAN - GROUND LEVEL",
    date: "March 5, 2025",
    time: "10:25 AM",
    filename: "drawing5.png",
  },
];

interface FieldDataDrawingGridProps {
  selectedNode?: string;
  isSidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

export default function FieldDataDrawingGrid({
  selectedNode,
  isSidebarVisible = true,
  onToggleSidebar,
}: FieldDataDrawingGridProps) {
  const [selectedView, setSelectedView] = useState<string>("week");
  const [selectedDate, setSelectedDate] = useState<string>(
    "Mar 01, 2025 - Mar 07, 2025"
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const router = useRouter();

  // Check for dark mode on component mount and when theme changes
  useEffect(() => {
    // Check if document has .dark class or prefers-color-scheme is dark
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    };

    // Check initially
    checkDarkMode();

    // Set up event listener for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Check for preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => checkDarkMode();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const columns = [
    {
      key: "name",
      header: "Name",
      width: "600px",
      render: (drawing: any) => (
        <span className="font-medium">{drawing.name}</span>
      ),
    },
    {
      key: "modifiedBy",
      header: "Modified By",
      render: () => "John Doe", // Example static data
    },
    {
      key: "modifiedOn",
      header: "Modified On",
      render: () => formatDistanceToNow(new Date(), { addSuffix: true }),
    },
    {
      key: "size",
      header: "Size",
      render: () => formatFileSize(1024 * 1024 * 2), // Example 2MB size
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Toolbar */}
      <div className="flex justify-between items-center gap-2 p-2 bg-background sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", !isSidebarVisible && "bg-accent/30")}
          onClick={() => onToggleSidebar && onToggleSidebar()}
        >
          {isSidebarVisible ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex gap-2 mr-2">
            <Button
              variant={viewType === "grid" ? "default2" : "default3"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewType("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === "list" ? "default2" : "default3"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewType("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Toolbar */}
      <div
        className={cn(
          "flex justify-end items-center p-2 border-y",
          isDarkMode ? "bg-background/80" : "bg-background/20"
        )}
      >
        <Button className="bg-primary text-primary-foreground">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Drawing Grid/List */}
      <ScrollArea className="flex-1 p-2">
        {viewType === "list" ? (
          <DataTable
            data={drawings}
            columns={columns}
            selectedItems={[]}
            hoveredItem={null}
            getItemId={(drawing) => drawing.id.toString()}
            onRowClick={() => {}}
            onCheckboxChange={() => {}}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
            getItemType={() => "blueprint"}
            className="dark:[&_tr:hover]:bg-slate-900"
          />
        ) : (
          <div className="flex flex-wrap gap-4 p-2">
            {drawings.map((drawing) => (
              <div
                key={drawing.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 w-[300px] cursor-pointer",
                  isDarkMode ? "border-accent/30" : "border-border"
                )}
                onClick={() =>
                  router.push(`/2dviewer?drawing=${drawing.filename}`)
                }
              >
                <div className="relative aspect-[16/9] w-[300px] overflow-hidden bg-muted">
                  <Image
                    src={`/drawings/${drawing.filename}`}
                    alt={drawing.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-all hover:scale-105"
                    onError={(e) => {
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.srcset = "";
                      imgElement.src = `https://source.unsplash.com/random/800x450/?blueprint`;
                    }}
                  />
                </div>
                <div
                  className={cn(
                    "p-2",
                    isDarkMode ? "bg-card" : "bg-background"
                  )}
                >
                  <div className="flex items-start gap-1.5 mb-1">
                    <PiBlueprint className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-foreground line-clamp-2">
                      {drawing.name}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {drawing.date} {drawing.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
