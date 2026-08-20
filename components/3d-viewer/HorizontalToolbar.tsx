import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";

// Workspace type
type WorkspaceType = "bim" | "geospatial" | "maya" | "quadri";

interface HorizontalToolbarProps {
  workspace: WorkspaceType;
  position?: "top" | "bottom";
}

export function HorizontalToolbar({
  workspace,
  position = "bottom",
}: HorizontalToolbarProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  // Reference to the toolbar container
  const toolbarRef = useRef<HTMLDivElement>(null);

  // State for drag functionality
  const [toolbarPosition, setToolbarPosition] = useState({ x: -200, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // State for collapsed view
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Ref to track double click
  const clickTimeoutRef = useRef<number | null>(null);

  const toggleSubmenu = (submenu: string) => {
    if (activeSubmenu === submenu) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(submenu);
    }
  };

  const handleButtonClick = (buttonId: string, hasSubmenu: boolean) => {
    if (hasSubmenu) {
      toggleSubmenu(buttonId);
    } else {
      setActiveButton(activeButton === buttonId ? null : buttonId);
    }
  };

  // Handle mouse down for drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (toolbarRef.current) {
      setIsDragging(true);
      // Store the initial mouse position and current toolbar position
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: toolbarPosition.x,
        posY: toolbarPosition.y,
      };
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handle double click on drag handle
  const handleDragHandleClick = () => {
    if (clickTimeoutRef.current === null) {
      // First click
      clickTimeoutRef.current = window.setTimeout(() => {
        // Single click - do nothing
        clickTimeoutRef.current = null;
      }, 300);
    } else {
      // Double click detected
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      setIsCollapsed(!isCollapsed);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Handle drag movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;

        setToolbarPosition({
          x: dragStartRef.current.posX + deltaX,
          y: dragStartRef.current.posY + deltaY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const buttonClass = (isActive: boolean) =>
    cn(
      "mx-1 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
      "w-8 h-8",
      isActive
        ? "bg-blue-50 dark:bg-blue-900/20"
        : "hover:bg-slate-100 dark:hover:bg-slate-800"
    );

  const renderSubmenu = () => {
    if (!activeSubmenu) return null;

    return (
      <div
        className={`absolute ${
          position === "bottom" ? "bottom-full mb-2" : "top-full mt-2"
        } left-0 bg-background dark:bg-gray-950/90 border border-border dark:border-gray-800 rounded-2xl shadow-md p-4 min-w-[180px]`}
      >
        {activeSubmenu === "navigation" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              Navigation Options
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="change-history"
            >
              <span className="text-sm">Reset Orientation</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="change-history"
            >
              <span className="text-sm">Navigation Mode</span>
            </Button>
          </div>
        )}

        {activeSubmenu === "view" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              View Options
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="change-history"
            >
              <span className="text-sm">Lighting</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="layers"
            >
              <span className="text-sm">Sections</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="change-history"
            >
              <span className="text-sm">Perspective</span>
            </Button>
          </div>
        )}

        {activeSubmenu === "share" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              Share Options
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="file-copy"
            >
              <span className="text-sm">Share View</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="file-copy"
            >
              <span className="text-sm">Copy Link</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  // For horizontal toolbar, we collapse by showing fewer buttons
  const getButtonsToRender = () => {
    if (isCollapsed) {
      return (
        <>
          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(activeButton === "locate")}
            title="Locate"
            connectIcon="location"
            onClick={() => handleButtonClick("locate", false)}
          />

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(activeButton === "home")}
            title="Home"
            connectIcon="walk"
            onClick={() => handleButtonClick("home", false)}
          />
        </>
      );
    } else {
      return (
        <>
          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(activeButton === "locate")}
            title="Locate"
            connectIcon="location"
            onClick={() => handleButtonClick("locate", false)}
          />

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(activeSubmenu === "navigation")}
            onClick={() => handleButtonClick("navigation", true)}
            title="Navigation"
            connectIcon="map"
          />

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(activeButton === "home")}
            title="Home"
            connectIcon="walk"
            onClick={() => handleButtonClick("home", false)}
          />

          <Separator
            orientation="vertical"
            className="h-6 mx-2 dark:bg-gray-700"
          />

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(activeButton === "zoom-in")}
            title="Zoom In"
            connectIcon="zoom-in"
            onClick={() => handleButtonClick("zoom-in", false)}
          />

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(activeButton === "zoom-out")}
            title="Zoom Out"
            connectIcon="zoom-out"
            onClick={() => handleButtonClick("zoom-out", false)}
          />

          <Separator
            orientation="vertical"
            className="h-6 mx-2 dark:bg-gray-700"
          />

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(activeSubmenu === "view")}
            onClick={() => handleButtonClick("view", true)}
            title="View Options"
            connectIcon="eye-visibility"
          />

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(activeSubmenu === "share")}
            onClick={() => handleButtonClick("share", true)}
            title="Share"
            connectIcon="link"
          />
        </>
      );
    }
  };

  const toolbarStyle = {
    transform: `translate(${toolbarPosition.x}px, ${toolbarPosition.y}px)`,
    cursor: isDragging ? "grabbing" : "default",
    transition: isDragging ? "none" : "all 0.0s ease",
    width: isCollapsed ? "auto" : "auto",
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute flex flex-row items-center bg-white dark:bg-gray-950 border border-border dark:border-gray-800 px-2 py-1 z-50 rounded-xl shadow-md left-1/2 -translate-x-1/2"
      style={{
        ...toolbarStyle,
        [position]: "24px",
      }}
    >
      {/* Drag handle and collapse toggle */}
      <div
        className="flex items-center px-1 py-1 mr-2 cursor-grab border-r border-gray-200 dark:border-gray-800"
        onMouseDown={handleMouseDown}
        onClick={handleDragHandleClick}
      >
        <div
          className="flex justify-center"
          title="Drag toolbar (double-click to collapse)"
        >
          <i className="icon-font tc-icon-drag-vert" aria-hidden="true"></i>
        </div>
      </div>

      {/* Toolbar buttons with conditional rendering based on collapsed state */}
      <div
        className={`flex items-center ${
          isCollapsed ? "max-w-[120px] overflow-hidden" : "max-w-[500px]"
        }`}
      >
        {getButtonsToRender()}
      </div>

      {renderSubmenu()}
    </div>
  );
}
