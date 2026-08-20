import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutGrid,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ImageDown,
  Link2,
  MapPinPlusInside,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Import the new dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ViewportDataDialog } from "./ViewportDataDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewportContent from "./ViewportContent";
import { ViewerToolbar } from "./SelectionToolbar";

// Import context menu components
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuCheckboxItem,
  ContextMenuGroup,
  ContextMenuLabel,
} from "@/components/ui/context-menu";

import { MayaFloatingToolbar } from "./MayaFloatingToolbar";
import { LoadingScreen } from "@/components/3d-viewer/LoadingScreen";

// Viewport layout types
export type ViewportLayoutType =
  | "single"
  | "horizontal"
  | "vertical"
  | "triple"
  | "top-wide"
  | "four";

// Define the types of data that can be displayed in a viewport
export type ViewportDataType =
  | "none"
  | "2d-map"
  | "pointcloud"
  | "ifc-model"
  | "terrain"
  | "alignment"
  | "gis-data"
  | "vector-data"
  | "imagery"
  | "buildings"
  | "360s"
  | "3dmodel";

// Data content for each viewport
interface ViewportData {
  type: ViewportDataType;
  label: string;
  description?: string;
  id?: string;
  fileSize?: string;
  lastModified?: string;
}

// Props for the GeospatialViewport component
export interface GeospatialViewportProps {
  layout: ViewportLayoutType;
  fileId?: string;
  fileName?: string;
  isDividerLocked?: boolean;
  onToggleDividerLock?: () => void;
  isDatePickerEnabled?: boolean;
  initialViewportData?: { type: string; label: string; id?: string }[];
  workspace?: "bim" | "geospatial" | "maya" | "quadri";
}

export function GeospatialViewport({
  layout,
  fileId,
  fileName,
  isDividerLocked = false,
  onToggleDividerLock,
  isDatePickerEnabled = false,
  initialViewportData = [],
  workspace,
}: GeospatialViewportProps) {
  // State for resizable dividers
  const [horizontalRatio, setHorizontalRatio] = useState(0.5); // 50/50 split for side-by-side
  const [verticalRatio, setVerticalRatio] = useState(0.5); // 50/50 split for top-bottom
  const [tripleHorizontalRatio, setTripleHorizontalRatio] = useState(0.5); // Left/right ratio for triple layout
  const [tripleVerticalRatio, setTripleVerticalRatio] = useState(0.6); // Top/bottom ratio for triple layout
  const [topWideVerticalRatio, setTopWideVerticalRatio] = useState(0.6); // Top/bottom ratio for top-wide layout
  const [topWideHorizontalRatio, setTopWideHorizontalRatio] = useState(0.5); // Bottom left/right ratio for top-wide layout
  const [fourHorizontalRatio, setFourHorizontalRatio] = useState(0.5); // Left/right ratio for four viewports layout
  const [fourVerticalRatioTop, setFourVerticalRatioTop] = useState(0.5); // Top row vertical split ratio
  const [fourVerticalRatioBottom, setFourVerticalRatioBottom] = useState(0.5); // Bottom row vertical split ratio

  // Track the active viewport
  const [activeViewport, setActiveViewport] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Refs for tracking resize operations
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingHorizontal = useRef(false);
  const isDraggingVertical = useRef(false);
  const isDraggingTripleHorizontal = useRef(false);
  const isDraggingTripleVertical = useRef(false);
  const isDraggingTopWideVertical = useRef(false);
  const isDraggingTopWideHorizontal = useRef(false);
  const isDraggingFourHorizontal = useRef(false);
  const isDraggingFourVerticalTop = useRef(false);
  const isDraggingFourVerticalBottom = useRef(false);

  // State for the maximized viewport in different layouts
  const [maximizedViewport, setMaximizedViewport] = useState<number | null>(
    null
  );

  // State for date pickers
  const [viewportDates, setViewportDates] = useState<Date[]>([
    new Date(),
    new Date(),
    new Date(),
    new Date(),
  ]);

  // More comprehensive viewport data using similar structure to ViewportDataDialog
  const mockDataItems: ViewportData[] = [
    {
      id: "lidar-scan-1",
      type: "pointcloud",
      label: "LiDAR Scan - Project Area",
      description: "Complete LiDAR point cloud of project area",
      fileSize: "1.2 GB",
      lastModified: "2023-06-22",
    },
    {
      id: "road-alignment-1",
      type: "alignment",
      label: "Highway Alignment A24",
      description: "3D alignment of planned highway route",
      fileSize: "1.8 MB",
      lastModified: "2023-07-08",
    },
    {
      id: "street-map-1",
      type: "2d-map",
      label: "Street Map - Downtown",
      description: "Street map of downtown area with addresses",
      fileSize: "4.2 MB",
      lastModified: "2023-05-18",
    },
    {
      id: "gis-landuse",
      type: "gis-data",
      label: "Land Use Zoning",
      description: "GIS data of land use zoning regulations",
      fileSize: "3.2 MB",
      lastModified: "2023-04-18",
    },
    {
      id: "building-models",
      type: "buildings",
      label: "3D Building Models",
      description: "Detailed 3D models of buildings in the project area",
      fileSize: "850 MB",
      lastModified: "2023-07-15",
    },
  ];

  // State for viewport data content - using the more comprehensive data
  const [viewportsData, setViewportsData] = useState<ViewportData[]>([
    {
      type: "3dmodel",
      label: "Custom GLTF Model",
      description: "User-provided GLTF model from the models directory",
      id: "user-gltf-model",
    },
    {
      type: "360s",
      label: "360° Panorama",
      description: "360 degree panoramic photo",
      id: "panorama-1",
    },
    {
      type: "2d-map",
      label: "Google Maps",
      description: "Interactive Google Maps with satellite and street view",
      id: "google-maps",
    },
    mockDataItems[3], // Keep the 4th viewport as GIS Data
  ]);

  // Data dialog state
  const [viewportDataDialogOpen, setViewportDataDialogOpen] = useState(false);
  const [viewportDataDialogIndex, setViewportDataDialogIndex] = useState(0);

  // Determine if we're in Maya mode based on workspace prop or initialViewportData
  const isMayaMode =
    workspace === "maya" ||
    (initialViewportData.length > 0 && initialViewportData[0]?.type === "360s");

  // Log when file info is provided
  useEffect(() => {
    if (fileId && fileName) {
      console.log(
        `GeospatialViewport loading file: ${fileName} (ID: ${fileId})`
      );
      // Here you would typically load the file content
    }
  }, [fileId, fileName]);

  // Use initialViewportData if provided
  useEffect(() => {
    if (initialViewportData && initialViewportData.length > 0) {
      // Convert the initialViewportData to the expected format
      const viewportDataItems = initialViewportData.map((item) => ({
        type: item.type as ViewportDataType,
        label: item.label,
        description: "",
        id: item.id || `data-${Math.random().toString(36).substr(2, 9)}`,
      }));

      // Update the viewportsData state with the provided data
      setViewportsData(viewportDataItems);
    }
  }, [initialViewportData]);

  // Event handlers for resizable dividers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      // Handle horizontal divider dragging (side-by-side)
      if (
        isDraggingHorizontal.current &&
        layout === "horizontal" &&
        !isDividerLocked
      ) {
        const newRatio = (e.clientX - containerRect.left) / containerRect.width;
        setHorizontalRatio(Math.max(0.2, Math.min(0.8, newRatio))); // Limit between 20% and 80%
      }

      // Handle vertical divider dragging (top/bottom)
      if (isDraggingVertical.current && layout === "vertical") {
        const newRatio = (e.clientY - containerRect.top) / containerRect.height;
        setVerticalRatio(Math.max(0.2, Math.min(0.8, newRatio))); // Limit between 20% and 80%
      }

      // Handle triple layout dividers
      if (layout === "triple") {
        // Handle horizontal divider
        if (isDraggingTripleHorizontal.current) {
          const newRatio =
            (e.clientX - containerRect.left) / containerRect.width;
          setTripleHorizontalRatio(Math.max(0.2, Math.min(0.8, newRatio)));
        }

        // Handle vertical divider
        if (isDraggingTripleVertical.current) {
          const newRatio =
            (e.clientY - containerRect.top) / containerRect.height;
          setTripleVerticalRatio(Math.max(0.3, Math.min(0.7, newRatio)));
        }
      }

      // Handle top-wide layout dividers
      if (layout === "top-wide") {
        // Handle vertical divider (for top/bottom separation)
        if (isDraggingTopWideVertical.current) {
          const newRatio =
            (e.clientY - containerRect.top) / containerRect.height;
          setTopWideVerticalRatio(Math.max(0.3, Math.min(0.8, newRatio)));
        }

        // Handle horizontal divider (for bottom left/right separation)
        if (isDraggingTopWideHorizontal.current) {
          const newRatio =
            (e.clientX - containerRect.left) / containerRect.width;
          setTopWideHorizontalRatio(Math.max(0.2, Math.min(0.8, newRatio)));
        }
      }

      // Handle four viewports layout dividers
      if (layout === "four") {
        // Handle main horizontal divider (left/right separation)
        if (isDraggingFourHorizontal.current) {
          const newRatio =
            (e.clientX - containerRect.left) / containerRect.width;
          setFourHorizontalRatio(Math.max(0.2, Math.min(0.8, newRatio)));
        }

        // Handle top row vertical divider
        if (isDraggingFourVerticalTop.current) {
          const newRatio =
            (e.clientY - containerRect.top) / containerRect.height;
          setFourVerticalRatioTop(Math.max(0.2, Math.min(0.8, newRatio)));
        }

        // Handle bottom row vertical divider
        if (isDraggingFourVerticalBottom.current) {
          const newRatio =
            (e.clientY - containerRect.top) / containerRect.height;
          setFourVerticalRatioBottom(Math.max(0.2, Math.min(0.8, newRatio)));
        }
      }
    };

    const handleMouseUp = () => {
      isDraggingHorizontal.current = false;
      isDraggingVertical.current = false;
      isDraggingTripleHorizontal.current = false;
      isDraggingTripleVertical.current = false;
      isDraggingTopWideVertical.current = false;
      isDraggingTopWideHorizontal.current = false;
      isDraggingFourHorizontal.current = false;
      isDraggingFourVerticalTop.current = false;
      isDraggingFourVerticalBottom.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [layout, isDividerLocked]);

  // Function to toggle maximize/restore viewport in any layout
  const toggleMaximizeViewport = (viewportIndex: number) => {
    if (maximizedViewport === viewportIndex) {
      setMaximizedViewport(null); // Restore all viewports
    } else {
      setMaximizedViewport(viewportIndex); // Maximize the selected viewport
    }
  };

  // Function to update the data type for a specific viewport
  const updateViewportData = (
    viewportIndex: number,
    dataType: ViewportDataType,
    dataLabel: string,
    dataId?: string
  ) => {
    const updatedData = [...viewportsData];
    if (viewportIndex >= updatedData.length) {
      // Add new entries if needed
      while (viewportIndex >= updatedData.length) {
        updatedData.push({ type: "none", label: "No Data Selected" });
      }
    }
    updatedData[viewportIndex] = {
      type: dataType,
      label: dataLabel,
      id: dataId,
    };
    setViewportsData(updatedData);
    setViewportDataDialogOpen(false); // Close the dialog after selection
  };

  // Function to update the date for a specific viewport
  const updateViewportDate = (viewportIndex: number, date: Date) => {
    const updatedDates = [...viewportDates];
    updatedDates[viewportIndex] = date;
    setViewportDates(updatedDates);

    // Here you would typically fetch data for the selected date
    console.log(
      `Updated viewport ${viewportIndex + 1} to date: ${format(date, "PP")}`
    );
  };

  // Helper function to navigate to the previous day for a viewport
  const navigateToPreviousDay = (viewportIndex: number) => {
    const currentDate = viewportDates[viewportIndex];
    const previousDay = new Date(currentDate);
    previousDay.setDate(previousDay.getDate() - 1);
    updateViewportDate(viewportIndex, previousDay);
  };

  // Helper function to navigate to the next day for a viewport
  const navigateToNextDay = (viewportIndex: number) => {
    const currentDate = viewportDates[viewportIndex];
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    updateViewportDate(viewportIndex, nextDay);
  };

  const handleViewportActivation = (
    viewportIndex: number,
    event: React.MouseEvent
  ) => {
    // Set this viewport as active
    setActiveViewport(viewportIndex);

    // Prevent opening the context menu when clicking on controls
    if (
      (event.target as HTMLElement).closest(
        ".viewport-controls, .viewport-date-picker"
      )
    ) {
      return;
    }
  };

  // Helper function to render a placeholder viewport
  const renderViewport = (viewportIndex: number) => {
    const viewportData = viewportsData[viewportIndex] || {
      type: "none",
      label: "No Data Selected",
    };

    // Determine if this viewport is the active one
    const isActive = viewportIndex === activeViewport;

    // Get background color based on data type for visual differentiation
    const getBgColorClass = () => {
      switch (viewportData.type) {
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
        case "3dmodel":
          return "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800";
        default:
          return "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800";
      }
    };

    // Content type selector button for a viewport
    const renderContentSelector = (viewportIndex: number) => {
      return null; // Remove this since it's handled by ViewportContent
    };

    // Handle context menu actions
    const handleOpenInNumark = () => {
      console.log("Opening in Numark:", viewportData);
      // Add implementation for opening in Numark
    };

    const handleIsolateElements = () => {
      console.log("Isolating selected elements");
      // Add implementation for isolating elements
    };

    const handleHideElements = () => {
      console.log("Hiding selected elements");
      // Add implementation for hiding elements
    };

    const handleExportSelection = () => {
      console.log("Exporting selected elements");
      // Add implementation for exporting selection
    };

    const handleMeasureDistance = () => {
      console.log("Measuring distance");
      // Add implementation for measuring distance
    };

    const handleTakeSnapshot = () => {
      console.log("Taking snapshot");
      // Add implementation for taking a snapshot
    };

    // Determine if this is the left viewport
    const isLeftViewport =
      (layout === "horizontal" && viewportIndex === 0) ||
      (layout === "vertical" && viewportIndex === 0) ||
      (layout === "triple" && viewportIndex === 0) ||
      (layout === "top-wide" && (viewportIndex === 0 || viewportIndex === 1)) ||
      (layout === "four" && (viewportIndex === 0 || viewportIndex === 2));

    // Determine if this viewport is a right-side viewport
    const isRightViewport =
      (layout === "horizontal" && viewportIndex === 1) ||
      (layout === "vertical" && viewportIndex === 1) ||
      (layout === "triple" && viewportIndex === 1) ||
      (layout === "top-wide" && viewportIndex === 2) ||
      (layout === "four" && (viewportIndex === 1 || viewportIndex === 3));

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`relative h-full w-full ${getBgColorClass()} transition-colors duration-300 ease-in-out overflow-hidden ${
              activeViewport === viewportIndex
                ? "ring-1 ring-primary ring-inset"
                : ""
            }`}
            onClick={(e) => handleViewportActivation(viewportIndex, e)}
          >
            {/* Maya Mode Floating Toolbar - only in the active viewport */}
            {isMayaMode && activeViewport === viewportIndex && (
              <MayaFloatingToolbar
                position={isRightViewport ? "right" : "left"}
                viewportIndex={viewportIndex}
              />
            )}

            {/* Render the appropriate content based on the viewport data type */}
            <ViewportContent
              contentType={viewportData.type}
              viewportIndex={viewportIndex}
              isActive={activeViewport === viewportIndex}
              dataId={viewportData.id}
              onConfigure={() => {
                setActiveViewport(viewportIndex);
                setViewportDataDialogIndex(viewportIndex);
                setViewportDataDialogOpen(true);
              }}
              onMaximize={() => toggleMaximizeViewport(viewportIndex)}
              isMaximized={maximizedViewport === viewportIndex}
            />

            {/* Small active indicator */}
            {isActive && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-orange-500 py-1 px-4 text-xs font-bold font-mono text-center text-primary-foreground rounded-b-2xl">
                Active
              </div>
            )}

            {/* Date picker at the bottom of the viewport */}
            {isDatePickerEnabled && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mr-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-white dark:hover:bg-gray-800 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToPreviousDay(viewportIndex);
                  }}
                  title="Previous day"
                >
                  <div className="h-3 w-3 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <span className="tc-icon-chevron-left"></span>
                  </div>
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-white dark:hover:bg-gray-800 rounded-full hover:shadow-md transition-all duration-200"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2 text-slate-600 dark:text-slate-300" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {format(viewportDates[viewportIndex], "PPP")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={viewportDates[viewportIndex]}
                      onSelect={(date) =>
                        date && updateViewportDate(viewportIndex, date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-white dark:hover:bg-gray-800 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToNextDay(viewportIndex);
                  }}
                  title="Next day"
                >
                  <div className="h-3 w-3 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <span className="tc-icon-chevron-right"></span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuLabel>3D Viewport Actions</ContextMenuLabel>

          {/* Display different options based on data type */}
          {(viewportData.type === "ifc-model" ||
            viewportData.type === "pointcloud") && (
            <>
              <ContextMenuItem onClick={handleOpenInNumark}>
                Open in Numark
                <ContextMenuShortcut>⌘N</ContextMenuShortcut>
              </ContextMenuItem>

              <ContextMenuSeparator />

              <ContextMenuGroup>
                <ContextMenuItem onClick={handleIsolateElements}>
                  Isolate Selected Elements
                </ContextMenuItem>
                <ContextMenuItem onClick={handleHideElements}>
                  Hide Selected Elements
                </ContextMenuItem>
              </ContextMenuGroup>

              <ContextMenuSeparator />
            </>
          )}

          {/* Options specific to IFC models */}
          {viewportData.type === "ifc-model" && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Selection Options</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem
                  onClick={() => console.log("Select by property")}
                >
                  Select by Property
                </ContextMenuItem>
                <ContextMenuItem onClick={() => console.log("Select by level")}>
                  Select by Level
                </ContextMenuItem>
                <ContextMenuItem onClick={() => console.log("Select by type")}>
                  Select by Type
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}

          {/* Options specific to point clouds */}
          {viewportData.type === "pointcloud" && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Point Cloud Options</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuCheckboxItem
                  onClick={() => console.log("Toggle classification colors")}
                >
                  Show Classification Colors
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                  onClick={() => console.log("Toggle intensity coloring")}
                >
                  Show Intensity
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                  onClick={() => console.log("Toggle elevation coloring")}
                >
                  Show Elevation Colors
                </ContextMenuCheckboxItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}

          {/* Common options for all viewport types */}
          <ContextMenuItem onClick={handleMeasureDistance}>
            Measure Distance
          </ContextMenuItem>

          <ContextMenuItem onClick={handleTakeSnapshot}>
            Take Snapshot
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleExportSelection}>
            Export Selection
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            onClick={() => toggleMaximizeViewport(viewportIndex)}
          >
            {maximizedViewport === viewportIndex ? "Restore" : "Maximize"}
            <ContextMenuShortcut>⌘M</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  // Render the appropriate layout
  const renderLayout = () => {
    // For horizontal layout (side-by-side)
    if (layout === "horizontal") {
      // If a viewport is maximized, only show that one
      if (maximizedViewport !== null) {
        return renderViewport(maximizedViewport);
      }

      return (
        <>
          {/* Left viewport */}
          <div
            className="h-full overflow-hidden"
            style={{ width: `${horizontalRatio * 100}%` }}
          >
            {renderViewport(0)}
          </div>

          {/* Divider */}
          <div
            className={`h-full w-1 relative transition-colors ${
              isDividerLocked
                ? "bg-blue-500 dark:bg-blue-600"
                : "bg-gray-300 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-500"
            }`}
            onMouseDown={() => {
              if (!isDividerLocked) {
                isDraggingHorizontal.current = true;
              }
            }}
          >
            {/* Lock button in the middle of the divider */}
            <button
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-md flex items-center justify-center z-10 border-2 transition-colors duration-200 ${
                isDividerLocked
                  ? "bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-600"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleDividerLock) {
                  onToggleDividerLock();
                }
              }}
              title={isDividerLocked ? "Unlock divider" : "Lock divider"}
            >
              {isDividerLocked ? (
                <div className="h-3 w-3 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <span className="tc-icon-lock"></span>
                </div>
              ) : (
                <div className="h-3 w-3 flex items-center justify-center text-gray-600 dark:text-gray-400">
                  <span className="tc-icon-lock-open"></span>
                </div>
              )}
            </button>
          </div>

          {/* Right viewport */}
          <div
            className="h-full overflow-hidden"
            style={{ width: `calc(${(1 - horizontalRatio) * 100}% - 2px)` }}
          >
            {renderViewport(1)}
          </div>
        </>
      );
    }

    // For vertical layout (top/bottom)
    if (layout === "vertical") {
      // If a viewport is maximized, only show that one
      if (maximizedViewport !== null) {
        return renderViewport(maximizedViewport);
      }

      return (
        <>
          {/* Top viewport */}
          <div
            className="w-full overflow-hidden"
            style={{ height: `${verticalRatio * 100}%` }}
          >
            {renderViewport(0)}
          </div>

          {/* Divider */}
          <div
            className="w-full h-1 bg-gray-300 dark:bg-gray-700 cursor-row-resize hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors"
            onMouseDown={() => {
              isDraggingVertical.current = true;
            }}
          />

          {/* Bottom viewport */}
          <div
            className="w-full overflow-hidden"
            style={{ height: `calc(${(1 - verticalRatio) * 100}% - 1px)` }}
          >
            {renderViewport(1)}
          </div>
        </>
      );
    }

    // For top-wide layout (one wide at top, two at bottom)
    if (layout === "top-wide") {
      // If a viewport is maximized, only show that one
      if (maximizedViewport !== null) {
        return renderViewport(maximizedViewport);
      }

      return (
        <div className="h-full w-full flex flex-col">
          {/* Top viewport (wide) */}
          <div
            className="w-full overflow-hidden"
            style={{ height: `${topWideVerticalRatio * 100}%` }}
          >
            {renderViewport(0)}
          </div>

          {/* Horizontal divider between top and bottom sections */}
          <div
            className="w-full h-1 bg-gray-300 dark:bg-gray-700 cursor-row-resize hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors"
            onMouseDown={() => {
              isDraggingTopWideVertical.current = true;
            }}
          />

          {/* Bottom section with two viewports */}
          <div
            className="w-full flex"
            style={{
              height: `calc(${(1 - topWideVerticalRatio) * 100}% - 1px)`,
            }}
          >
            {/* Bottom-left viewport */}
            <div
              className="h-full overflow-hidden"
              style={{ width: `${topWideHorizontalRatio * 100}%` }}
            >
              {renderViewport(1)}
            </div>

            {/* Vertical divider between bottom viewports */}
            <div
              className="h-full w-1 bg-gray-300 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors"
              onMouseDown={() => {
                isDraggingTopWideHorizontal.current = true;
              }}
            />

            {/* Bottom-right viewport */}
            <div
              className="h-full overflow-hidden"
              style={{
                width: `calc(${(1 - topWideHorizontalRatio) * 100}% - 1px)`,
              }}
            >
              {renderViewport(2)}
            </div>
          </div>
        </div>
      );
    }

    // For triple layout
    if (layout === "triple") {
      // If a viewport is maximized, only show that one
      if (maximizedViewport !== null) {
        return renderViewport(maximizedViewport);
      }

      return (
        <>
          {/* Left viewport */}
          <div
            className="h-full overflow-hidden"
            style={{ width: `${tripleHorizontalRatio * 100}%` }}
          >
            {renderViewport(0)}
          </div>

          {/* Vertical divider */}
          <div
            className="h-full w-1 bg-gray-300 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors"
            onMouseDown={() => {
              isDraggingTripleHorizontal.current = true;
            }}
          />

          {/* Right column (contains top and bottom viewports) */}
          <div
            className="h-full overflow-hidden flex flex-col"
            style={{
              width: `calc(${(1 - tripleHorizontalRatio) * 100}% - 1px)`,
            }}
          >
            {/* Top-right viewport */}
            <div
              className="w-full overflow-hidden"
              style={{ height: `${tripleVerticalRatio * 100}%` }}
            >
              {renderViewport(1)}
            </div>

            {/* Horizontal divider */}
            <div
              className="w-full h-1 bg-gray-300 dark:bg-gray-700 cursor-row-resize hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors"
              onMouseDown={() => {
                isDraggingTripleVertical.current = true;
              }}
            />

            {/* Bottom-right viewport */}
            <div
              className="w-full overflow-hidden"
              style={{
                height: `calc(${(1 - tripleVerticalRatio) * 100}% - 1px)`,
              }}
            >
              {renderViewport(2)}
            </div>
          </div>
        </>
      );
    }

    // For four viewports layout
    if (layout === "four") {
      // If a viewport is maximized, only show that one
      if (maximizedViewport !== null) {
        return renderViewport(maximizedViewport);
      }

      return (
        <div className="h-full w-full flex">
          {/* Left column (contains top-left and bottom-left viewports) */}
          <div
            className="h-full overflow-hidden flex flex-col"
            style={{ width: `${fourHorizontalRatio * 100}%` }}
          >
            {/* Top-left viewport */}
            <div
              className="w-full overflow-hidden"
              style={{ height: `${fourVerticalRatioTop * 100}%` }}
            >
              {renderViewport(0)}
            </div>

            {/* Horizontal divider for left column */}
            <div
              className="w-full h-1 bg-gray-300 dark:bg-gray-700 cursor-row-resize hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors"
              onMouseDown={() => {
                isDraggingFourVerticalTop.current = true;
              }}
            />

            {/* Bottom-left viewport */}
            <div
              className="w-full overflow-hidden"
              style={{
                height: `calc(${(1 - fourVerticalRatioTop) * 100}% - 1px)`,
              }}
            >
              {renderViewport(1)}
            </div>
          </div>

          {/* Vertical divider between left and right columns */}
          <div
            className="h-full w-1 bg-gray-300 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors"
            onMouseDown={() => {
              isDraggingFourHorizontal.current = true;
            }}
          />

          {/* Right column (contains top-right and bottom-right viewports) */}
          <div
            className="h-full overflow-hidden flex flex-col"
            style={{
              width: `calc(${(1 - fourHorizontalRatio) * 100}% - 1px)`,
            }}
          >
            {/* Top-right viewport */}
            <div
              className="w-full overflow-hidden"
              style={{ height: `${fourVerticalRatioBottom * 100}%` }}
            >
              {renderViewport(2)}
            </div>

            {/* Horizontal divider for right column */}
            <div
              className="w-full h-1 bg-gray-300 dark:bg-gray-700 cursor-row-resize hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors"
              onMouseDown={() => {
                isDraggingFourVerticalBottom.current = true;
              }}
            />

            {/* Bottom-right viewport */}
            <div
              className="w-full overflow-hidden"
              style={{
                height: `calc(${(1 - fourVerticalRatioBottom) * 100}% - 1px)`,
              }}
            >
              {renderViewport(3)}
            </div>
          </div>
        </div>
      );
    }

    // Default: "single"
    return renderViewport(0);
  };

  useEffect(() => {
    // Keep loading state true to let LoadingScreen handle the timing
    const timer = setTimeout(() => {
      // Deliberately leave this commented - we want LoadingScreen to control timing
      // setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-muted dark:bg-gray-900"
    >
      {loading && <LoadingScreen />}

      {/* Main viewport container */}
      <div className="h-full w-full flex flex-col">
        {layout === "vertical" || layout === "top-wide" ? (
          // For vertical and top-wide layouts, we need flex-col
          <div className="h-full w-full flex flex-col">{renderLayout()}</div>
        ) : (
          // For horizontal, triple, and four layouts, we need flex-row
          <div className="h-full w-full flex">{renderLayout()}</div>
        )}

        {/* Style for the padlock button overlay */}
        <style jsx global>{`
          .fixed-center-divider {
            position: absolute;
            z-index: 40;
            height: 100%;
            width: 100%;
            pointer-events: none;
          }

          .fixed-center-divider button {
            pointer-events: auto;
          }
        `}</style>
      </div>

      {/* Add SelectionToolbar for BIM mode */}
      {workspace === "bim" && (
        <ViewerToolbar workspace="bim" position="bottom" />
      )}

      {/* Existing dialogs and other UI elements */}
      <ViewportDataDialog
        open={viewportDataDialogOpen}
        onOpenChange={setViewportDataDialogOpen}
        viewportIndex={viewportDataDialogIndex}
        currentData={
          viewportsData[viewportDataDialogIndex] || {
            type: "none",
            label: "No Data Selected",
          }
        }
        onSelectData={updateViewportData}
      />
    </div>
  );
}
