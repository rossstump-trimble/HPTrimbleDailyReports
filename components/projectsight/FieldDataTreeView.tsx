"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderClosed,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  MapPinned,
  PlusCircle,
  MoreVertical,
  FileText,
  Folder,
  Aperture,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TbView360Number } from "react-icons/tb";

// Sample folder structure
const folders = [
  {
    id: "Photos",
    name: "Photos",
  },
  {
    id: "Site Captures",
    name: "Site Captures",
    // children: [
    //   {
    //     id: "A1-051-OVERALL-PLAN-LEVEL-1",
    //     name: "A1-051 OVERALL PLAN - LEVEL 1",
    //     children: [],
    //   },
    //   {
    //     id: "A1-051-OVERALL-PLAN-GROUND-LEVEL-1",
    //     name: "A1-051 OVERALL PLAN - GROUND LEVEL",
    //     children: [],
    //   },
    //   {
    //     id: "A1-051-OVERALL-PLAN-GROUND-LEVEL-2",
    //     name: "A1-051 OVERALL PLAN - GROUND LEVEL",
    //     children: [],
    //   },
    //   {
    //     id: "A1-051-OVERALL-PLAN-GROUND-LEVEL-3",
    //     name: "A1-051 OVERALL PLAN - GROUND LEVEL",
    //     children: [],
    //   },
    //   {
    //     id: "A1-051-OVERALL-PLAN-BASEMENT-1",
    //     name: "A1-051 OVERALL PLAN - BASEMENT",
    //     children: [],
    //   },
    //   {
    //     id: "A1-051-OVERALL-PLAN-BASEMENT-2",
    //     name: "A1-051 OVERALL PLAN -BASEMENT",
    //     children: [],
    //   },
    //   {
    //     id: "A1-051-OVERALL-PLAN-BASEMENT-3",
    //     name: "A1-051 OVERALL PLAN - BASEMENT",
    //     children: [],
    //   },
    //   {
    //     id: "A1-051-OVERALL-PLAN-BASEMENT-4",
    //     name: "A1-051 OVERALL PLAN - BASEMENT",
    //     children: [],
    //   },
    // ],
  },
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
  const paddingLeft = level === 0 ? 22 : level * 12 + 24;
  const [isHovering, setIsHovering] = useState(false);

  // Function to get the correct icon based on node name or type
  const getNodeIcon = () => {
    if (node.name === "Photos") {
      return <Aperture className="h-4 w-4 text-muted-foreground" />;
    } else if (node.name === "Site Captures") {
      return <TbView360Number className="h-4 w-4 text-muted-foreground" />;
    } else if (hasChildren) {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Folder className="h-4 w-4 text-muted-foreground" />
      );
    } else {
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div key={node.id}>
      <div
        className={cn(
          "flex items-center h-8 rounded-sm group relative cursor-pointer",
          isSelected ? "bg-accent" : "hover:bg-accent/50",
          level === 0 && "font-medium"
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
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
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        ) : (
          <span className="w-3.5 mr-1"></span>
        )}
        {getNodeIcon()}
        <span className="text-sm ml-1.5">{node.name}</span>

        {(isHovering || isSelected) && level > 0 && (
          <div className="flex gap-1 ml-auto mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                // Handle add functionality here
              }}
            >
              <PlusCircle className="h-3.5 w-3.5" />
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
              <MoreVertical className="h-3.5 w-3.5" />
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

interface FieldDataTreeViewProps {
  onSelectNode?: (id: string, type: "photos" | "drawings") => void;
  isVisible?: boolean;
  defaultSelectedNode?: string;
}

export default function FieldDataTreeView({
  onSelectNode,
  isVisible = true,
  defaultSelectedNode = "Photos",
}: FieldDataTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>(defaultSelectedNode);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialSidebarWidth, setInitialSidebarWidth] = useState(0);
  const defaultWidth = 300;
  const minWidth = 200;
  const maxWidth = 400;
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Call onSelectNode with initial values
  useEffect(() => {
    if (onSelectNode && defaultSelectedNode) {
      const type = defaultSelectedNode === "Photos" ? "photos" : "drawings";
      onSelectNode(defaultSelectedNode, type);
    }
  }, []);

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
    if (onSelectNode) {
      // Determine the type based on the selected node
      const type = id === "Photos" ? "photos" : "drawings";
      onSelectNode(id, type);
    }
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
    <div
      className={cn(
        "flex h-full transition-[width,opacity] duration-200 ease-out",
        !isVisible && "w-0 opacity-0 overflow-hidden"
      )}
    >
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
          <MapPinned className="h-5 w-5 mr-2" />
          <span>Field Data</span>
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
    </div>
  );
}
