import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
  Database,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ViewportDataType,
  ViewportLayoutType,
} from "@/components/3d-viewer/GeospatialViewport";

interface MiniMapProps {
  title?: string;
  dataType?: ViewportDataType;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  onSelectData?: () => void;
  isPanelOpen?: boolean;
  areToolbarsVisible?: boolean;
  viewportLayout?: ViewportLayoutType;
}

export function MiniMap({
  title = "Mini Map",
  dataType = "2d-map",
  isCollapsed = false,
  onToggleCollapse,
  onClose,
  onSelectData,
  isPanelOpen = false,
  areToolbarsVisible = true,
  viewportLayout = "single",
}: MiniMapProps) {
  // Refs for dragging
  const miniMapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const initialDragPosition = useRef({ left: 0, bottom: 0 });

  // State for custom position (when dragged)
  const [customPosition, setCustomPosition] = useState<{
    left: number | null;
    bottom: number | null;
  }>({
    left: null,
    bottom: null,
  });

  // Function to get background color based on data type
  const getBackgroundColor = () => {
    switch (dataType) {
      case "pointcloud":
        return "bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800";
      case "2d-map":
        return "bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-cyan-950 dark:to-blue-900";
      case "alignment":
        return "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-indigo-950 dark:to-blue-900";
      case "ifc-model":
        return "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-900";
      case "terrain":
        return "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900";
      case "gis-data":
        return "bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900";
      case "vector-data":
        return "bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950 dark:to-purple-900";
      case "imagery":
        return "bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-800";
      case "buildings":
        return "bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-900";
      case "360s":
        return "bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900";
      default:
        return "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800";
    }
  };

  // Calculate position based on panel and toolbar visibility
  const getPosition = () => {
    // If we have a custom position from dragging, use that
    if (customPosition.left !== null && customPosition.bottom !== null) {
      return {
        left: `${customPosition.left}px`,
        bottom: `${customPosition.bottom}px`,
      };
    }

    // Otherwise use the default positioning logic
    // Base position
    let left = "1rem"; // Default left position
    const bottom = "1rem"; // Fixed bottom position

    // Adjust for side panel
    if (isPanelOpen) {
      left = "calc(348px + 1rem)"; // 300px is the width of the side panel
    }
    // If toolbar is visible, move right to avoid overlap
    else if (areToolbarsVisible) {
      left = "calc(48px + 4rem)"; // Move right by 80px to avoid left toolbar
    }
    // If left toolbar is hidden, adjust position
    else if (!areToolbarsVisible && !isPanelOpen) {
      left = "4rem";
    }

    return {
      left,
      bottom,
    };
  };

  // Reset custom position when panel or toolbar visibility changes or collapse state changes
  useEffect(() => {
    setCustomPosition({ left: null, bottom: null });
  }, [isPanelOpen, areToolbarsVisible, isCollapsed]);

  // Set up event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      // Calculate new position based on the initial position and mouse movement
      const deltaX = e.clientX - dragOffset.current.x;
      const deltaY = e.clientY - dragOffset.current.y;

      const viewportHeight = window.innerHeight;
      const newLeft = initialDragPosition.current.left + deltaX;
      const newBottom = initialDragPosition.current.bottom - deltaY;

      // Update position with boundaries
      setCustomPosition({
        left: Math.max(0, Math.min(window.innerWidth - 240, newLeft)),
        bottom: Math.max(0, Math.min(viewportHeight - 40, newBottom)),
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.classList.remove("select-none");
    };

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Clean up
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Handler for starting drag
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start dragging if clicking on the header (not on buttons)
    if ((e.target as HTMLElement).closest("button")) return;

    if (miniMapRef.current) {
      // Prevent text selection during drag
      e.preventDefault();
      document.body.classList.add("select-none");

      const rect = miniMapRef.current.getBoundingClientRect();

      // Store the initial mouse position
      dragOffset.current = {
        x: e.clientX,
        y: e.clientY,
      };

      // Store the initial element position
      initialDragPosition.current = {
        left: rect.left,
        bottom: window.innerHeight - rect.bottom,
      };

      // Initialize custom position if not already set
      if (customPosition.left === null || customPosition.bottom === null) {
        setCustomPosition({
          left: rect.left,
          bottom: window.innerHeight - rect.bottom,
        });
      }

      isDragging.current = true;
      document.body.style.cursor = "grabbing";
    }
  };

  // Handler for double-click to toggle collapse
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle double-click if clicking on the header (not on buttons)
    if ((e.target as HTMLElement).closest("button")) return;

    // Toggle collapse state
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const position = getPosition();

  return (
    <div
      ref={miniMapRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
      style={{
        width: "240px",
        left: position.left,
        bottom: position.bottom,
        transition: isDragging.current
          ? "none"
          : "left 0.3s ease-in-out, bottom 0.3s ease-in-out",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-center gap-2">
          <i
            className="icon-font tc-icon-drag-vert i16 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
          />
          <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="whiteToolbar"
            size="smIcon"
            className="h-4 w-4"
            onClick={onSelectData}
            title="Select data source"
            connectIcon="settings"
            connectIconSize="16"
          />
          <Button
            variant="whiteToolbar"
            size="smIcon"
            className="h-4 w-4"
            onClick={onToggleCollapse}
            connectIcon={isCollapsed ? "unfold-more" : "unfold-less"}
            connectIconSize="16"
          />
          <Button
            variant="whiteToolbar"
            size="smIcon"
            className="h-4 w-4"
            onClick={onClose}
            connectIcon="content-close"
            connectIconSize="16"
          />
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div
          className={`relative ${getBackgroundColor()}`}
          style={{ height: "160px", width: "240px" }}
        >
          {/* Placeholder content based on data type */}
          <div className="absolute inset-0 flex items-center justify-center">
            {dataType === "none" ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                No data selected
              </span>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium mb-1">
                  {dataType.replace("-", " ").toUpperCase()}
                </span>
                {/* Grid lines for visual reference */}
                <div className="w-32 h-32 border border-gray-400 dark:border-gray-600 grid grid-cols-4 grid-rows-4">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className="border border-gray-400/30 dark:border-gray-600/30"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current location indicator */}
          <div className="absolute right-1/4 bottom-1/3">
            <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
}
