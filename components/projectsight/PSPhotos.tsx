"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  FolderClosed,
  FolderOpen,
  Search,
  Upload,
  MoreVertical,
  Image as ImageIcon,
  Calendar,
  Info,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Aperture,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Sample folder structure
const folders = [
  {
    id: "library",
    name: "Library",
    children: [
      {
        id: "albums",
        name: "Albums",
        children: [
          {
            id: "RFI-1",
            name: "RFI-1",
            children: [
              {
                id: "RFI-1-1",
                name: "RFI-1-1",
                children: [],
              },
              {
                id: "RFI-1-2",
                name: "RFI-1-2",
                children: [],
              },
            ],
          },
          {
            id: "RFI-2",
            name: "RFI-2",
            children: [
              {
                id: "RFI-2-1",
                name: "RFI-2-1",
                children: [],
              },
            ],
          },
          {
            id: "RFI-3",
            name: "RFI-3",
            children: [
              {
                id: "RFI-3-1",
                name: "RFI-3-1",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "Site Captures",
    name: "Site Captures",
    children: [
      {
        id: "A1-051-OVERALL-PLAN-LEVEL-1",
        name: "A1-051 OVERALL PLAN - LEVEL 1",
        children: [],
      },
      {
        id: "A1-051-OVERALL-PLAN-GROUND-LEVEL-1",
        name: "A1-051 OVERALL PLAN - GROUND LEVEL",
        children: [],
      },
      {
        id: "A1-051-OVERALL-PLAN-GROUND-LEVEL-2",
        name: "A1-051 OVERALL PLAN - GROUND LEVEL",
        children: [],
      },
      {
        id: "A1-051-OVERALL-PLAN-GROUND-LEVEL-3",
        name: "A1-051 OVERALL PLAN - GROUND LEVEL",
        children: [],
      },
      {
        id: "A1-051-OVERALL-PLAN-BASEMENT-1",
        name: "A1-051 OVERALL PLAN - BASEMENT",
        children: [],
      },
      {
        id: "A1-051-OVERALL-PLAN-BASEMENT-2",
        name: "A1-051 OVERALL PLAN -BASEMENT",
        children: [],
      },
      {
        id: "A1-051-OVERALL-PLAN-BASEMENT-3",
        name: "A1-051 OVERALL PLAN - BASEMENT",
        children: [],
      },
      {
        id: "A1-051-OVERALL-PLAN-BASEMENT-4",
        name: "A1-051 OVERALL PLAN - BASEMENT",
        children: [],
      },
    ],
  },
];

// Sample photo data using existing images from public folder
const photos = [
  { id: 1, filename: "project1.jpg", date: "March 5, 2025", time: "10:25 AM" },
  { id: 2, filename: "project2.jpg", date: "March 5, 2025", time: "10:25 AM" },
  { id: 3, filename: "project3.jpg", date: "March 5, 2025", time: "10:25 AM" },
  { id: 4, filename: "project4.jpg", date: "March 5, 2025", time: "10:25 AM" },
  { id: 5, filename: "project5.jpg", date: "March 5, 2025", time: "10:25 AM" },
  {
    id: 6,
    filename: "australia1.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 7,
    filename: "australia2.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 8,
    filename: "australia3.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 9,
    filename: "australia4.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  { id: 10, filename: "asia1.jpg", date: "March 5, 2025", time: "10:25 AM" },
  { id: 11, filename: "asia2.jpg", date: "March 5, 2025", time: "10:25 AM" },
  { id: 12, filename: "asia3.jpg", date: "March 5, 2025", time: "10:25 AM" },
  { id: 13, filename: "europe1.jpg", date: "March 5, 2025", time: "10:25 AM" },
];

type TreeNodeProps = {
  node: any;
  level: number;
  expandedNodes: string[];
  selectedNode?: string;
  onNodeToggle: (id: string) => void;
  onNodeSelect: (id: string) => void;
};

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  expandedNodes,
  selectedNode,
  onNodeToggle,
  onNodeSelect,
}) => {
  const isExpanded = expandedNodes.includes(node.id);
  const isSelected = selectedNode === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div key={node.id}>
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-sm group relative",
          isSelected ? "bg-accent" : "hover:bg-accent/50",
          level === 0 && "font-medium"
        )}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
        onClick={() => onNodeSelect(node.id)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {hasChildren ? (
          <span
            className="mr-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onNodeToggle(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        ) : (
          <span className="w-4 mr-1"></span>
        )}
        {level > 0 && (
          <span className="mr-1">
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FolderClosed className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
        )}
        <span className="text-sm flex-1">{node.name}</span>

        {(isHovering || isSelected) && level > 0 && (
          <div className="flex gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                // Handle add functionality here
              }}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                // Handle more options here
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      {isExpanded &&
        hasChildren &&
        node.children.map((child: any) => (
          <TreeNode
            key={child.id}
            node={child}
            level={level + 1}
            expandedNodes={expandedNodes}
            selectedNode={selectedNode}
            onNodeToggle={onNodeToggle}
            onNodeSelect={onNodeSelect}
          />
        ))}
    </div>
  );
};

export default function PSPhotos() {
  const [expandedNodes, setExpandedNodes] = useState<string[]>([
    "library",
    "test-folder",
  ]);
  const [selectedNode, setSelectedNode] = useState<string>("test-folder");
  const [selectedView, setSelectedView] = useState<string>("week");
  const [selectedDate, setSelectedDate] = useState<string>(
    "Mar 01, 2025 - Mar 07, 2025"
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialSidebarWidth, setInitialSidebarWidth] = useState(0);
  const defaultWidth = 250;
  const minWidth = 200;
  const maxWidth = 500;
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  const toggleNode = (id: string) => {
    setExpandedNodes((prevExpanded) =>
      prevExpanded.includes(id)
        ? prevExpanded.filter((nodeId) => nodeId !== id)
        : [...prevExpanded, id]
    );
  };

  const selectNode = (id: string) => {
    setSelectedNode(id);
  };

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - initialMouseX;
        const newWidth = Math.max(
          minWidth,
          Math.min(maxWidth, initialSidebarWidth + deltaX)
        );
        setSidebarWidth(newWidth);
        if (sidebarRef.current) {
          sidebarRef.current.style.width = `${newWidth}px`;
        }
      }
    },
    [isResizing, initialMouseX, initialSidebarWidth, minWidth, maxWidth]
  );

  const stopResize = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResize);
  }, [handleResize]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleResize, stopResize]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setInitialMouseX(e.clientX);
    setInitialSidebarWidth(sidebarWidth);
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar with Tree View */}
      <div
        ref={sidebarRef}
        className={cn(
          "border-r border-border flex flex-col relative",
          isDarkMode ? "bg-background/80" : "bg-background",
          isSidebarExpanded ? "" : "w-0 overflow-hidden"
        )}
        style={{
          width: isSidebarExpanded ? `${sidebarWidth}px` : 0,
          transition: isResizing
            ? "none"
            : "width 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      >
        <div className="p-3 flex items-center font-medium">
          <Aperture className="h-5 w-5 mr-2" />
          <span>Photos</span>
        </div>
        <ScrollArea className="flex-1">
          {folders.map((folder) => (
            <TreeNode
              key={folder.id}
              node={folder}
              level={0}
              expandedNodes={expandedNodes}
              selectedNode={selectedNode}
              onNodeToggle={toggleNode}
              onNodeSelect={selectNode}
            />
          ))}
        </ScrollArea>
      </div>

      {/* Resize handle - moved outside the sidebar for better interaction */}
      {isSidebarExpanded && (
        <div
          className={cn(
            "w-2 h-full cursor-ew-resize z-10 flex items-center justify-center",
            isResizing ? "bg-primary/20" : "hover:bg-primary/10"
          )}
          onMouseDown={startResize}
        >
          <div
            className={cn(
              "w-[2px] h-8",
              isResizing ? "bg-primary" : "bg-muted-foreground/50"
            )}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="flex justify-between items-center gap-2 p-2 bg-background sticky top-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            {isSidebarExpanded ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <HelpCircle className="h-4 w-4" />
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
            "flex justify-between items-center p-2 border-y",
            isDarkMode ? "bg-background/80" : "bg-background"
          )}
        >
          <div className="flex items-center gap-2">
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center ml-2">
              <Checkbox id="date-range" className="mr-2" />
              <label htmlFor="date-range" className="text-sm">
                {selectedDate}
              </label>
            </div>
          </div>

          <Button className="bg-primary text-primary-foreground">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>

        {/* Photo Grid */}
        <ScrollArea className="flex-1 p-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-2 ">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-all duration-300",
                  isDarkMode ? "border-accent/30" : "border-border"
                )}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={`/${photo.filename}`}
                    alt={photo.filename}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover transition-all hover:scale-105"
                    onError={(e) => {
                      // Fallback image if the actual image is not found
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.srcset = "";
                      imgElement.src = `https://source.unsplash.com/random/300x300/?construction`;
                    }}
                  />
                </div>
                <div
                  className={cn(
                    "p-2 text-center",
                    isDarkMode ? "bg-card" : "bg-background"
                  )}
                >
                  <div className="text-xs text-foreground">{photo.date}</div>
                  <div className="text-xs text-muted-foreground">
                    {photo.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
