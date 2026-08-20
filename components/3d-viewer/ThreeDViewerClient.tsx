"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Toolbar } from "@/components/3d-viewer/Toolbar";
import { VerticalToolbar } from "@/components/3d-viewer/VerticalToolbar";
import { LeftVerticalToolbar } from "@/components/3d-viewer/LeftVerticalToolbar";
import { HorizontalToolbar } from "@/components/3d-viewer/HorizontalToolbar";
import { SidePanel } from "@/components/3d-viewer/SidePanel";
import { MiniMap } from "@/components/3d-viewer/MiniMap";
import {
  GeospatialViewport,
  ViewportLayoutType,
  ViewportDataType,
} from "@/components/3d-viewer/GeospatialViewport";
import { ViewportDataDialog } from "@/components/3d-viewer/ViewportDataDialog";
import HeaderHome from "@/components/3d-viewer/3DHeader";
import { Box, GridIcon, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { HorizontalDataTablePane } from "@/components/3d-viewer/HorizontalDataTablePane";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Workspace type from the main file
export type WorkspaceType = "bim" | "geospatial" | "maya" | "quadri";

// Loading fallback component
function Loading() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center justify-center h-screen w-full bg-background dark:bg-gray-900"></div>
  );
}

export default function ThreeDViewerClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeParam = searchParams.get("mode");
  const fileId = searchParams.get("fileId");
  const filename = searchParams.get("filename");
  const fromParam = searchParams.get("from");

  // Log URL parameters on initial render to help debug
  console.log("3D Viewer URL Params:", {
    modeParam,
    fileId,
    filename,
    fromParam,
  });

  // Define workspace state first to prevent usage before declaration
  const [workspace, setWorkspace] = useState<WorkspaceType>("bim");

  // Flag to track if user manually changed workspace
  const [manualWorkspaceChange, setManualWorkspaceChange] = useState(false);

  // Flag to hide header when coming from 2D viewer
  const [hideHeader, setHideHeader] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string>("layers");
  const [showGrid, setShowGrid] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewportLayout, setViewportLayout] =
    useState<ViewportLayoutType>("single");
  const [isLoading, setIsLoading] = useState(true);
  const [areToolbarsVisible, setAreToolbarsVisible] = useState(true);
  const [showKeyboardNotification, setShowKeyboardNotification] =
    useState(false);
  const [showViewportResetNotification, setShowViewportResetNotification] =
    useState(false);
  const [showMiniMapNotification, setShowMiniMapNotification] = useState(false);
  const [isDividerLocked, setIsDividerLocked] = useState(false);
  const [isDatePickerEnabled, setIsDatePickerEnabled] = useState(false);

  // Reference to store 360 panorama data for Maya mode
  const session360PanoramaData = useRef<
    { type: string; label: string; id?: string }[]
  >([]);

  // This state tracks whether initial parameter processing has happened
  const [initialParamsProcessed, setInitialParamsProcessed] = useState(false);

  // Define file loading state
  const [loadedFile, setLoadedFile] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isMiniMapCollapsed, setIsMiniMapCollapsed] = useState(false);
  const [miniMapDataType, setMiniMapDataType] =
    useState<ViewportDataType>("2d-map");
  const [miniMapTitle, setMiniMapTitle] = useState("Mini Map");
  const [miniMapDialogOpen, setMiniMapDialogOpen] = useState(false);

  // State for horizontal data table pane visibility
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);

  // Ensure URL parameters aren't lost if they get cleared
  useEffect(() => {
    // Skip if browser not available
    if (typeof window === "undefined") return;

    // Skip restoration if user manually changed workspace
    if (manualWorkspaceChange) return;

    // Store original URL parameters when component mounts
    const originalMode = modeParam;
    const originalFileId = fileId;
    const originalFilename = filename;

    if (originalMode === "geospatial") {
      // Check every 500ms if our parameters are still in the URL
      const intervalId = setInterval(() => {
        // Don't restore if user manually changed workspace
        if (manualWorkspaceChange) {
          clearInterval(intervalId);
          return;
        }

        const currentUrl = new URL(window.location.href);
        const currentMode = currentUrl.searchParams.get("mode");

        // If the mode parameter was removed but we're still in the component
        if (!currentMode && originalMode === "geospatial") {
          console.log("Restoring lost URL parameters for 3D viewer");

          // Reconstruct the URL with the original parameters
          const newParams = new URLSearchParams();
          newParams.set("mode", originalMode);
          if (originalFileId) newParams.set("fileId", originalFileId);
          if (originalFilename) newParams.set("filename", originalFilename);

          // Update URL without causing a page reload
          const newUrl = `${window.location.pathname}?${newParams.toString()}`;
          window.history.replaceState({}, "", newUrl);
        }
      }, 500);

      return () => clearInterval(intervalId);
    }
  }, [modeParam, fileId, filename, manualWorkspaceChange]);

  // Effect to handle URL parameters and set initial mode
  useEffect(() => {
    // Skip if already processed or if in the process of manually changing workspace
    if (initialParamsProcessed || manualWorkspaceChange) return;

    // Check if we're coming from 2D viewer
    if (fromParam === "2dviewer") {
      setHideHeader(true);
      setAreToolbarsVisible(true); // Ensure toolbars are visible for content
    }

    if (modeParam) {
      if (modeParam === "geospatial") {
        setWorkspace("geospatial");
        setActivePanel("map");
        setShowMiniMap(false);
        setIsDatePickerEnabled(false);
        setViewportLayout("four");
        setAreToolbarsVisible(true);
      } else if (modeParam === "maya") {
        setWorkspace("maya");
        setActivePanel("layers");
        setShowMiniMap(true);
        setIsDatePickerEnabled(true);
        setViewportLayout("horizontal");
        setIsDividerLocked(true);
        setAreToolbarsVisible(false);

        // Set default 360 panorama data - this will be rendered using the 360test.jpg file
        session360PanoramaData.current = [
          { type: "360s", label: "Office 360° Panorama View" },
          { type: "360s", label: "Conference Room 360° View" },
        ];
      } else if (modeParam === "quadri") {
        setWorkspace("quadri");
        setActivePanel("map");
        setShowMiniMap(false);
        setIsDatePickerEnabled(false);
        setViewportLayout("top-wide");
        setAreToolbarsVisible(true);
      } else if (modeParam === "bim") {
        // BIM mode - now loading with ThreeModelViewer by default
        setWorkspace("bim");
        setActivePanel("layers");
        setViewportLayout("single");
        // Set default model data for BIM mode
        session360PanoramaData.current = [
          { type: "3dmodel", label: "BIM Model", id: "user-gltf-model" },
        ];
      } else {
        // Invalid mode, restore defaults
        setWorkspace("bim");
        setActivePanel("layers");
        setViewportLayout("single");
        // Set default model data for default mode
        session360PanoramaData.current = [
          { type: "3dmodel", label: "BIM Model", id: "user-gltf-model" },
        ];
      }
    } else {
      // No mode specified, default to BIM with 3D model
      setWorkspace("bim");
      setActivePanel("layers");
      setViewportLayout("single");
      // Set default model data when no mode is specified
      session360PanoramaData.current = [
        { type: "3dmodel", label: "BIM Model", id: "user-gltf-model" },
      ];
    }

    // If file parameters are present, handle file loading
    if (fileId && filename) {
      setLoadedFile({
        id: fileId,
        name: filename,
      });
    }

    setInitialParamsProcessed(true);
    setIsLoading(false);
  }, [
    modeParam,
    fileId,
    filename,
    fromParam,
    initialParamsProcessed,
    manualWorkspaceChange,
  ]);

  // Make sure UI reflects proper workspace mode before first render
  const isGeospatialMode =
    modeParam === "geospatial" ||
    workspace === "geospatial" ||
    workspace === "maya" ||
    modeParam === "quadri" ||
    workspace === "quadri";

  // Log any workspace changes to help debug
  useEffect(() => {
    console.log("Workspace changed to:", workspace);
    if (workspace === "geospatial" && loadedFile) {
      console.log(`Geospatial workspace loaded with file: ${loadedFile.name}`);
    }
  }, [workspace, loadedFile]);

  const handleToggleToolbarsVisibility = useCallback(() => {
    setAreToolbarsVisible((prev) => !prev);
    // Show notification when toggled
    setShowKeyboardNotification(true);

    // Hide notification after 1.5 seconds
    setTimeout(() => {
      setShowKeyboardNotification(false);
    }, 1500);
  }, []);

  const handleTogglePanel = () => {
    console.log("Toggle panel called, current state:", isPanelOpen);
    setIsPanelOpen((prev) => !prev);

    // Force a reflow to ensure the animation runs correctly
    document.body.offsetHeight;

    // When closing the panel, add a brief delay before any other updates
    // This ensures the animation completes properly
    if (isPanelOpen) {
      setTimeout(() => {
        console.log("Panel closing animation complete");
      }, 350);
    }
  };

  const handleSetActivePanel = (panel: string) => {
    setActivePanel(panel);
    // Open the panel when an active panel is selected
    setIsPanelOpen(true);
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
  };

  const handleResetModel = () => {
    console.log("Reset model view");
    // Reset viewport layout to single viewport
    setViewportLayout("single");

    // Show notification when viewport is reset
    setShowViewportResetNotification(true);

    // Hide notification after 1.5 seconds
    setTimeout(() => {
      setShowViewportResetNotification(false);
    }, 1500);
  };

  const handleToggleFullscreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleChangeWorkspace = (newWorkspace: WorkspaceType) => {
    // Set manual workspace change flag to true
    setManualWorkspaceChange(true);

    setWorkspace(newWorkspace);

    // Set appropriate default panel for each workspace
    if (newWorkspace === "bim") {
      setActivePanel("layers");
      // Reset to single view when switching to bim
      setViewportLayout("single");
      // Update URL to remove parameters when switching to BIM
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (newWorkspace === "maya") {
      setActivePanel("layers");
      setShowMiniMap(true);
      setIsDatePickerEnabled(true);
      setViewportLayout("horizontal");
      setIsDividerLocked(true);
      setAreToolbarsVisible(false);

      // Set 360 panorama data for Maya mode - this will be rendered using the 360test.jpg file
      session360PanoramaData.current = [
        { type: "360s", label: "Office 360° Panorama View" },
        { type: "360s", label: "Conference Room 360° View" },
      ];

      // Update URL for Maya mode
      const newUrl = `${window.location.pathname}?mode=maya`;
      if (loadedFile) {
        const newParams = new URLSearchParams();
        newParams.set("mode", "maya");
        newParams.set("fileId", loadedFile.id);
        newParams.set("filename", loadedFile.name);
        const paramUrl = `${window.location.pathname}?${newParams.toString()}`;
        window.history.replaceState({}, "", paramUrl);
      } else {
        window.history.replaceState({}, "", newUrl);
      }
    } else if (newWorkspace === "quadri") {
      // Quadri mode (duplicate of geospatial with its own URL param)
      setActivePanel("map");
      // Configure quadri-specific settings (same as geospatial)
      setShowMiniMap(false); // Disable mini map
      setIsDatePickerEnabled(false); // Disable calendar
      setViewportLayout("top-wide"); // Use "One Wide, Two Below" layout
      setAreToolbarsVisible(true); // Enable toolbars

      // If we have file info and are switching to quadri, keep it in the URL
      if (loadedFile) {
        const newParams = new URLSearchParams();
        newParams.set("mode", "quadri");
        newParams.set("fileId", loadedFile.id);
        newParams.set("filename", loadedFile.name);
        const newUrl = `${window.location.pathname}?${newParams.toString()}`;
        window.history.replaceState({}, "", newUrl);
      } else {
        // Just set quadri mode with no file info
        const newUrl = `${window.location.pathname}?mode=quadri`;
        window.history.replaceState({}, "", newUrl);
      }
    } else {
      // Geospatial mode
      setActivePanel("map");
      // Configure geospatial-specific settings
      setShowMiniMap(false); // Disable mini map
      setIsDatePickerEnabled(false); // Disable calendar
      setViewportLayout("four"); // Use four viewports
      setAreToolbarsVisible(true); // Enable toolbars

      // If we have file info and are switching to geospatial, keep it in the URL
      if (loadedFile) {
        const newParams = new URLSearchParams();
        newParams.set("mode", "geospatial");
        newParams.set("fileId", loadedFile.id);
        newParams.set("filename", loadedFile.name);
        const newUrl = `${window.location.pathname}?${newParams.toString()}`;
        window.history.replaceState({}, "", newUrl);
      } else {
        // Just set geospatial mode with no file info
        const newUrl = `${window.location.pathname}?mode=geospatial`;
        window.history.replaceState({}, "", newUrl);
      }
    }
  };

  const handleChangeViewportLayout = (layout: ViewportLayoutType) => {
    setViewportLayout(layout);
  };

  const handleBackNavigation = () => {
    // When coming from 2D viewer, go directly back to 2D viewer
    if (hideHeader) {
      router.push("/2dviewer");
    }
    // Otherwise use the browser's history API to go back
    else if (typeof window !== "undefined") {
      window.history.back();
    } else {
      // Fallback to router if window is not available (shouldn't happen in browser)
      router.push("/");
    }
  };

  const handleToggleMiniMap = useCallback(() => {
    setShowMiniMap((prev) => !prev);

    // Show notification when toggled
    setShowMiniMapNotification(true);

    // Hide notification after 1.5 seconds
    setTimeout(() => {
      setShowMiniMapNotification(false);
    }, 1500);
  }, []);

  const handleToggleMiniMapCollapse = useCallback(() => {
    setIsMiniMapCollapsed((prev) => !prev);
  }, []);

  const handleOpenMiniMapDataDialog = useCallback(() => {
    setMiniMapDialogOpen(true);
  }, []);

  const handleUpdateMiniMapData = useCallback(
    (viewportIndex: number, dataType: ViewportDataType, dataLabel: string) => {
      setMiniMapDataType(dataType);
      setMiniMapTitle(dataLabel);
      setMiniMapDialogOpen(false);
    },
    []
  );

  // Add keyboard shortcut (M key) to toggle minimap visibility
  useEffect(() => {
    // Skip if not in a browser environment
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key pressed is M and no modifier keys are pressed
      if (
        event.key === "m" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !event.metaKey
      ) {
        // Prevent default behavior
        event.preventDefault();

        // Toggle minimap visibility
        handleToggleMiniMap();
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleToggleMiniMap]);

  const handleToggleDividerLock = useCallback(() => {
    setIsDividerLocked((prev) => !prev);
  }, []);

  const handleToggleDatePicker = useCallback(() => {
    setIsDatePickerEnabled((prev) => !prev);
  }, []);

  // Add keyboard shortcut (TAB key) to toggle toolbars visibility
  useEffect(() => {
    // Skip if not in a browser environment
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key pressed is TAB and no modifier keys are pressed
      if (
        event.key === "Tab" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !event.metaKey
      ) {
        // Prevent default behavior (tabbing to next element)
        event.preventDefault();

        // Toggle toolbars visibility
        handleToggleToolbarsVisibility();
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleToggleToolbarsVisibility]);

  // Handler for toggling the horizontal data table
  const handleToggleDataTable = useCallback(() => {
    setIsDataTableOpen((prev) => !prev);
  }, []);

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex h-screen flex-col overflow-hidden">
          {/* Header with z-index to stay on top - Only show if not coming from 2D viewer */}
          {!hideHeader && (
            <div className="z-50 border-b dark:border-gray-800">
              <HeaderHome />
            </div>
          )}

          {/* Toolbar */}
          <div className="w-full border-b dark:border-gray-800">
            <Toolbar
              workspace={workspace}
              onChangeWorkspace={handleChangeWorkspace}
              onTogglePanel={handleTogglePanel}
              onToggleGrid={handleToggleGrid}
              onResetModel={handleResetModel}
              onToggleFullscreen={handleToggleFullscreen}
              viewportLayout={viewportLayout}
              onChangeViewportLayout={handleChangeViewportLayout}
              onBackButtonClick={handleBackNavigation}
              areToolbarsVisible={areToolbarsVisible}
              onToggleToolbarsVisibility={handleToggleToolbarsVisibility}
              isDividerLocked={isDividerLocked}
              onToggleDividerLock={handleToggleDividerLock}
              isDatePickerEnabled={isDatePickerEnabled}
              onToggleDatePicker={handleToggleDatePicker}
              hideToolbarControls={hideHeader}
            />
          </div>

          {/* Main content - Adjust top margin based on header visibility */}
          <div className="flex flex-1 relative">
            {/* Left Vertical Toolbar - fixed width */}
            {areToolbarsVisible && (
              <div className="w-[50px] flex-shrink-0 border-r bg-background dark:bg-gray-950 border-border dark:border-gray-800 z-[10]">
                <LeftVerticalToolbar
                  activePanel={activePanel}
                  onSetActivePanel={handleSetActivePanel}
                  onTogglePanel={handleTogglePanel}
                  workspace={workspace}
                  onToggleDataTable={handleToggleDataTable}
                  isPanelOpen={isPanelOpen}
                  viewMode={viewportLayout === "single" ? "single" : "multi"}
                />
              </div>
            )}

            {/* Content area that contains side panel and canvas */}
            <div className="flex-1 relative overflow-hidden">
              {/* Side Panel - absolute positioning so it doesn't affect layout */}
              <div
                className={`absolute top-0 left-0 h-full z-[20] transition-transform duration-300 ease-in-out transform ${
                  isPanelOpen ? "translate-x-0" : "-translate-x-[300px]"
                }`}
                style={{ width: "300px", willChange: "transform" }}
                aria-hidden={!isPanelOpen}
              >
                <SidePanel
                  isPanelOpen={isPanelOpen} // Pass correct state to ensure proper behavior
                  activePanel={activePanel}
                  onTogglePanel={handleTogglePanel}
                />
              </div>

              {/* 3D Canvas Area */}
              <div className="h-full w-full bg-muted dark:bg-gray-900">
                <GeospatialViewport
                  layout={viewportLayout}
                  fileId={loadedFile?.id}
                  fileName={loadedFile?.name}
                  isDividerLocked={isDividerLocked}
                  onToggleDividerLock={handleToggleDividerLock}
                  isDatePickerEnabled={isDatePickerEnabled}
                  initialViewportData={
                    workspace === "maya" || workspace === "bim"
                      ? session360PanoramaData.current
                      : undefined
                  }
                  workspace={workspace}
                />

                {/* Right Vertical Toolbar - only shown in geospatial workspace */}
                {isGeospatialMode && areToolbarsVisible && (
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[10]">
                    <VerticalToolbar
                      activePanel={activePanel}
                      onSetActivePanel={handleSetActivePanel}
                      onTogglePanel={handleTogglePanel}
                      workspace={workspace}
                    />
                  </div>
                )}

                {/* Horizontal Toolbar - only shown in geospatial workspace */}
                {isGeospatialMode && areToolbarsVisible && (
                  <HorizontalToolbar workspace={workspace} position="bottom" />
                )}

                {/* MiniMap - shown in geospatial workspace for all viewport layouts */}
                {isGeospatialMode && showMiniMap && (
                  <MiniMap
                    title={miniMapTitle}
                    dataType={miniMapDataType}
                    isCollapsed={isMiniMapCollapsed}
                    onToggleCollapse={handleToggleMiniMapCollapse}
                    onClose={handleToggleMiniMap}
                    onSelectData={handleOpenMiniMapDataDialog}
                    isPanelOpen={isPanelOpen}
                    areToolbarsVisible={areToolbarsVisible}
                    viewportLayout={viewportLayout}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Notifications Container - Centered at the top of the viewport */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
            {/* Keyboard shortcut notification */}
            {showKeyboardNotification && (
              <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 flex items-center gap-2">
                <span className="font-medium text-xs">
                  Toolbars {areToolbarsVisible ? "shown" : "hidden"}
                </span>
                <span className="bg-gray-700 px-2 py-0.5 rounded text-xs font-mono">
                  TAB
                </span>
              </div>
            )}

            {/* Viewport reset notification */}
            {showViewportResetNotification && (
              <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 flex items-center gap-2">
                <span className="font-medium text-xs">
                  View reset to single viewport
                </span>
              </div>
            )}

            {/* MiniMap notification */}
            {showMiniMapNotification && (
              <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 flex items-center gap-2">
                <span className="font-medium text-xs">
                  Mini Map {showMiniMap ? "shown" : "hidden"}
                </span>
                <span className="bg-gray-700 px-2 py-0.5 rounded text-xs font-mono">
                  M
                </span>
              </div>
            )}
          </div>

          {/* MiniMap Data Selection Dialog */}
          <ViewportDataDialog
            open={miniMapDialogOpen}
            onOpenChange={setMiniMapDialogOpen}
            viewportIndex={-1} // Special index for minimap
            currentData={{
              type: miniMapDataType,
              label: miniMapTitle,
            }}
            onSelectData={handleUpdateMiniMapData}
          />

          {/* Horizontal Data Table Pane */}
          <HorizontalDataTablePane
            isOpen={isDataTableOpen}
            onClose={handleToggleDataTable}
          />
        </div>
      )}
    </>
  );
}
