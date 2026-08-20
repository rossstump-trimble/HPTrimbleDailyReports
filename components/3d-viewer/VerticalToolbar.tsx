import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";

// Workspace type
type WorkspaceType = "bim" | "geospatial" | "maya" | "quadri";

interface VerticalToolbarProps {
  activePanel: string;
  onSetActivePanel: (panel: string) => void;
  onTogglePanel: () => void;
  workspace: WorkspaceType;
}

export function VerticalToolbar({
  activePanel,
  onSetActivePanel,
  onTogglePanel,
  workspace,
}: VerticalToolbarProps) {
  // State to track which submenu is active
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Track button positions
  const [activeButtonPosition, setActiveButtonPosition] = useState<
    number | null
  >(null);

  // Reference to the toolbar container
  const toolbarRef = useRef<HTMLDivElement>(null);

  // State for drag functionality
  const [position, setPosition] = useState({ x: -48, y: -200 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // State for collapsed view
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Ref to track double click
  const clickTimeoutRef = useRef<number | null>(null);

  // Toggle submenu function
  const toggleSubmenu = (
    submenu: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const toolbarRect = toolbarRef.current?.getBoundingClientRect();

    if (toolbarRect) {
      const topPosition =
        buttonRect.top - toolbarRect.top + buttonRect.height / 2;
      setActiveButtonPosition(topPosition);
    }

    if (activeSubmenu === submenu) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(submenu);
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
        posX: position.x,
        posY: position.y,
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

        setPosition({
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

  // Common button class for consistent styling
  const buttonClass = (isActive: boolean) =>
    cn(
      "mb-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
      "w-8 h-8",
      isActive
        ? "bg-blue-50 dark:bg-blue-900/20"
        : "hover:bg-slate-100 dark:hover:bg-slate-800"
    );

  // BIM workspace sidebar options
  const renderBIMOptions = () => (
    <>
      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "models")}
        onClick={() => onSetActivePanel("models")}
        title="Models"
        connectIcon="geometry-fill"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "layers")}
        onClick={() => onSetActivePanel("layers")}
        title="Layers"
        connectIcon="layers"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "attachments")}
        onClick={() => onSetActivePanel("attachments")}
        title="Attachments"
        connectIcon="link-alt"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "todos")}
        onClick={() => onSetActivePanel("todos")}
        title="ToDos"
        connectIcon="todo"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "views")}
        onClick={() => onSetActivePanel("views")}
        title="Views"
        connectIcon="views"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "organizer")}
        onClick={() => onSetActivePanel("organizer")}
        title="Organizer"
        connectIcon="folder-tree"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "datatable")}
        onClick={() => onSetActivePanel("datatable")}
        title="Data table"
        connectIcon="view-table"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "clashes")}
        onClick={() => onSetActivePanel("clashes")}
        title="Clash sets"
        connectIcon="clash-set"
      />
    </>
  );

  // Geospatial workspace sidebar options
  const renderGeospatialOptions = () => (
    <>
      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activeSubmenu === "map")}
        onClick={(e) => toggleSubmenu("map", e)}
        title="Map"
        connectIcon="map"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activeSubmenu === "layers")}
        onClick={(e) => toggleSubmenu("layers", e)}
        title="Layers"
        connectIcon="layers"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activeSubmenu === "terrain")}
        onClick={(e) => toggleSubmenu("terrain", e)}
        title="Terrain"
        connectIcon="public"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activeSubmenu === "pins")}
        onClick={(e) => toggleSubmenu("pins", e)}
        title="Map Pins"
        connectIcon="location"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activeSubmenu === "roads")}
        onClick={(e) => toggleSubmenu("roads", e)}
        title="Roads"
        connectIcon="markup-polyline"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activeSubmenu === "buildings")}
        onClick={(e) => toggleSubmenu("buildings", e)}
        title="Buildings"
        connectIcon="object-property"
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activeSubmenu === "measurements")}
        onClick={(e) => toggleSubmenu("measurements", e)}
        title="Measurements"
        connectIcon="measure"
      />
    </>
  );

  // Function to determine which options to render based on workspace
  const renderWorkspaceOptions = () => {
    switch (workspace) {
      case "bim":
        return renderBIMOptions();
      case "geospatial":
        return renderGeospatialOptions();
      case "maya":
        return renderBIMOptions();
      case "quadri":
        return renderGeospatialOptions();
      default:
        return null;
    }
  };

  // Render the appropriate submenu based on active selection
  const renderSubmenu = () => {
    if (!activeSubmenu || activeButtonPosition === null) return null;

    const menuStyle = {
      top: `${activeButtonPosition - 10}px`,
    };

    return (
      <div
        className="absolute right-full mr-2 bg-background backdrop-blur-sm dark:bg-gray-950/90 border border-border dark:border-gray-800 rounded-xl shadow-md p-2 min-w-[180px] z-[1001]"
        style={menuStyle}
      >
        <div className="absolute right-0 top-2.5 translate-x-[7px] rotate-45 w-2 h-2 bg-background dark:bg-gray-950 border-t-0 border-l-0 border-r border-b border-border dark:border-gray-800"></div>

        {activeSubmenu === "map" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              Map Options
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="public"
            >
              <span className="text-sm">Satellite View</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="map"
            >
              <span className="text-sm">Street Map</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="public"
            >
              <span className="text-sm">Hybrid View</span>
            </Button>
          </div>
        )}

        {activeSubmenu === "layers" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              Layer Management
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="layers"
            >
              <span className="text-sm">Layer Controls</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="eye-visibility"
            >
              <span className="text-sm">Toggle Visibility</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="save"
            >
              <span className="text-sm">Save Layer Set</span>
            </Button>
          </div>
        )}

        {activeSubmenu === "terrain" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              Terrain Controls
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="model-grid"
            >
              <span className="text-sm">Elevation Display</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="model-grid"
            >
              <span className="text-sm">Contour Lines</span>
            </Button>
          </div>
        )}

        {activeSubmenu === "pins" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              Map Pins
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="location"
            >
              <span className="text-sm">Add Pin</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="settings"
            >
              <span className="text-sm">Pin Settings</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="image"
            >
              <span className="text-sm">Attach Image</span>
            </Button>
          </div>
        )}

        {activeSubmenu === "roads" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              Roads & Routes
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="markup-polyline"
            >
              <span className="text-sm">Show Routes</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="settings"
            >
              <span className="text-sm">Road Options</span>
            </Button>
          </div>
        )}

        {activeSubmenu === "buildings" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              Buildings
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="object-property"
            >
              <span className="text-sm">3D Buildings</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="location"
            >
              <span className="text-sm">Landmarks</span>
            </Button>
          </div>
        )}

        {activeSubmenu === "measurements" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              Measurement Tools
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="measure"
            >
              <span className="text-sm">Distance</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="measure-area"
            >
              <span className="text-sm">Area</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="measure-area"
            >
              <span className="text-sm">Volume</span>
            </Button>
          </div>
        )}

        {activeSubmenu === "settings" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              Settings
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="settings"
            >
              <span className="text-sm">General Settings</span>
            </Button>
            <Button
              variant="whiteToolbar"
              size="sm"
              className="w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
              connectIcon="eye-visibility"
            >
              <span className="text-sm">View Options</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  const toolbarStyle = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: isDragging ? "grabbing" : "default",
    transition: isDragging ? "none" : "all 0.0s ease",
  };

  // Only render the top buttons when collapsed
  const getButtonsToRender = () => {
    if (isCollapsed) {
      // Get first two buttons from either BIM or Geospatial options
      const allButtons =
        workspace === "bim" || workspace === "maya"
          ? renderBIMOptions()
          : renderGeospatialOptions();

      // Extract the first two buttons from the array of children
      return React.Children.toArray(allButtons.props.children).slice(0, 2);
    } else {
      return renderWorkspaceOptions();
    }
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center bg-white dark:bg-gray-950 border border-border dark:border-gray-800 py-1 z-[1000] w-12 rounded-xl shadow-md"
      style={toolbarStyle}
    >
      {/* Drag handle and collapse toggle */}
      <div
        className="flex items-center justify-between w-full px-1.5 py-1 mb-2 cursor-grab border-b border-gray-200 dark:border-gray-800"
        onMouseDown={handleMouseDown}
        onClick={handleDragHandleClick}
      >
        <div
          className="flex-1 flex justify-center"
          title="Drag toolbar (double-click to collapse)"
        >
          <i className="icon-font tc-icon-drag-horiz" aria-hidden="true"></i>
        </div>
      </div>

      {/* Only render the number of buttons based on collapsed state */}
      <div
        className={`flex flex-col items-center ${
          isCollapsed ? "max-h-20 overflow-hidden" : "max-h-[500px]"
        }`}
      >
        {isCollapsed ? getButtonsToRender() : renderWorkspaceOptions()}

        {!isCollapsed && (
          <>
            <Separator className="my-2 w-3/4 dark:bg-gray-700" />

            <Button
              variant="whiteToolbar"
              size="icon"
              className={buttonClass(activeSubmenu === "settings")}
              onClick={(e) => toggleSubmenu("settings", e)}
              title="Settings"
              connectIcon="settings"
            />
          </>
        )}
      </div>

      {renderSubmenu()}
    </div>
  );
}
