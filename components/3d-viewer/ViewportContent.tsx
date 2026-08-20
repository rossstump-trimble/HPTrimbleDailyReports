"use client";

import React from "react";
import PanoramaViewer from "./PanoramaViewer";
import { ThreeModelViewer } from "./ThreeModelViewer";
import { ViewportDataType } from "./GeospatialViewport";
import { GoogleMapViewport } from "./GoogleMapViewport";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ShortcutsDialogContent } from "./ShortCuts";

interface ViewportControlsProps {
  onDetach?: () => void;
  onConfigure?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  hideControls?: boolean;
  showConfigureButton?: boolean;
  showDetachButton?: boolean;
  showFullscreenButton?: boolean;
  showShortcutsButton?: boolean;
  buttonPlacement?: {
    configure?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    detach?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    fullscreen?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    shortcuts?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  };
  className?: string;
}

// New component to handle all viewport controls
const ViewportControls: React.FC<ViewportControlsProps> = ({
  onDetach,
  onConfigure,
  onToggleFullscreen,
  isFullscreen,
  hideControls = false,
  showConfigureButton = true,
  showDetachButton = true,
  showFullscreenButton = true,
  showShortcutsButton = true,
  buttonPlacement = {
    configure: "top-left",
    detach: "top-left",
    fullscreen: "top-right",
    shortcuts: "bottom-left",
  },
  className,
}) => {
  if (hideControls) return null;

  // Group buttons by position
  const getButtonsForPosition = (
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  ) => {
    const buttons = [];

    if (showConfigureButton && buttonPlacement.configure === position) {
      buttons.push(
        <Button
          key="configure"
          variant="threeDViewport"
          size="threeDViewportSmall"
          onClick={onConfigure}
          title="Configure Viewport"
          connectIcon="cloud"
        />
      );
    }

    if (showDetachButton && buttonPlacement.detach === position) {
      buttons.push(
        <Button
          key="detach"
          variant="threeDViewport"
          size="threeDViewportSmall"
          onClick={onDetach}
          title="Detach Viewport"
          connectIcon="unfold-more"
        />
      );
    }

    if (showFullscreenButton && buttonPlacement.fullscreen === position) {
      buttons.push(
        <Button
          key="fullscreen"
          variant="threeDViewport"
          size="threeDViewportSmall"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Maximize"}
          connectIcon={isFullscreen ? "fullscreen-exit" : "fullscreen"}
        />
      );
    }

    if (showShortcutsButton && buttonPlacement.shortcuts === position) {
      buttons.push(
        <Dialog key="shortcuts">
          <DialogTrigger asChild>
            <Button
              variant="threeDViewport"
              size="threeDViewportSmall"
              title="Keyboard Shortcuts"
              connectIcon="help"
            />
          </DialogTrigger>
          <ShortcutsDialogContent />
        </Dialog>
      );
    }

    return buttons.length > 0 ? (
      <div
        className={`absolute ${getPositionClasses(position)} z-10 flex gap-2`}
      >
        {buttons}
      </div>
    ) : null;
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case "top-left":
        return "top-2 left-2";
      case "top-right":
        return "top-2 right-2";
      case "bottom-left":
        return "bottom-2 left-2";
      case "bottom-right":
        return "bottom-2 right-2";
      default:
        return "top-2 left-2";
    }
  };

  return (
    <div className={className}>
      {getButtonsForPosition("top-left")}
      {getButtonsForPosition("top-right")}
      {getButtonsForPosition("bottom-left")}
      {getButtonsForPosition("bottom-right")}
    </div>
  );
};

interface ViewportContentProps {
  contentType: ViewportDataType;
  viewportIndex: number;
  isActive: boolean;
  dataId?: string;
  hideControls?: boolean;
  onConfigure?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

/**
 * A component that renders different types of content in a viewport based on the contentType
 * Currently supports 360° panorama images and 3D models
 */
export const ViewportContent: React.FC<ViewportContentProps> = ({
  contentType,
  viewportIndex,
  isActive,
  dataId,
  hideControls = false,
  onConfigure,
  onMaximize,
  isMaximized = false,
  onToggleFullscreen,
  isFullscreen = false,
}) => {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = React.useState(false);

  // Function to determine which model URL to use based on dataId
  const getModelUrl = (id: string | undefined): string | undefined => {
    if (!id) return undefined;

    switch (id) {
      case "user-gltf-model":
        return "/models/result.gltf";
      case "manhattan-model":
        return "/models/man/uploads_files_2711294_manhattan.gltf";
      case "residential-buildings":
        return "/models/00 Residential Buildings Set Array.gltf";
      // Add more model mappings as needed
      default:
        return undefined;
    }
  };

  // Determine if the model already has a grid
  const hasBuiltInGrid = (id: string | undefined): boolean => {
    if (!id) return false;

    // Models known to have built-in grids
    const modelsWithGrid = ["user-gltf-model", "manhattan-model"];
    return modelsWithGrid.includes(id);
  };

  // For cubes, we don't need the grid from ThreeModelViewer
  const needsGrid = (id: string | undefined): boolean => {
    // If no dataId, this means we'll be showing the sample cube
    if (!id) return false;

    // If the model has a built-in grid, we don't need another one
    if (hasBuiltInGrid(id)) return false;

    // Disable grid for manhattan model
    if (id === "manhattan-model") return false;

    return true;
  };

  const handleDetachViewport = () => {
    const width = 800;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Create URL with viewport data as query parameters
    const url = new URL("/detached-viewport", window.location.origin);
    url.searchParams.set("contentType", contentType);
    if (dataId) {
      url.searchParams.set("dataId", dataId);
    }

    // Open the detached viewport in a popup window
    window.open(
      url.toString(),
      "DetachedViewport",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const handleToggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else if (onMaximize) {
      onMaximize();
    }
  };

  // Render the appropriate content based on the type
  const renderContent = () => {
    switch (contentType) {
      case "360s":
        // For 360° panoramas, we use our PanoramaViewer component
        // The image URL should be configurable in a real application
        return (
          <PanoramaViewer
            imageUrl="/360test.jpg"
            className={isActive ? "active-viewport" : ""}
          />
        );
      case "3dmodel":
        // For 3D models, we use our ThreeModelViewer component
        // Pass the model URL if one exists for the selected dataId
        // Don't show the grid if the model already has one
        return (
          <ThreeModelViewer
            modelUrl={getModelUrl(dataId)}
            className={isActive ? "active-viewport" : ""}
            showGrid={needsGrid(dataId)}
          />
        );
      case "2d-map":
        // For 2D maps, we use our GoogleMapViewport component
        return (
          <GoogleMapViewport
            mapId={dataId}
            className={isActive ? "active-viewport" : ""}
            isActive={isActive}
          />
        );
      case "pointcloud":
        // Placeholder for point cloud rendering
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-center">Point Cloud Visualization</p>
          </div>
        );
      case "ifc-model":
        // Placeholder for IFC model rendering
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-center">IFC Model Visualization</p>
          </div>
        );
      // Add more cases for other viewport types as needed
      default:
        // Default placeholder
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-center">Content type: {contentType}</p>
          </div>
        );
    }
  };

  return (
    <div
      ref={viewportRef}
      className={`relative w-full h-full group transition-all duration-300 ${
        isActive
          ? "ring-2 ring-orange-500 before:absolute before:inset-0 before:z-10 before:pointer-events-none before:border before:border-orange-500"
          : "ring-1 ring-border/5 hover:ring-border/10"
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Viewport Controls with hover effect */}
      <ViewportControls
        onDetach={handleDetachViewport}
        onConfigure={onConfigure}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen || isMaximized}
        hideControls={hideControls}
        showConfigureButton={viewportIndex !== -1}
        showDetachButton={viewportIndex !== -1}
        showFullscreenButton={true}
        showShortcutsButton={true}
        buttonPlacement={{
          configure: "top-left",
          detach: "top-left",
          fullscreen: "top-right",
          shortcuts: "bottom-left",
        }}
        className={`transition-opacity duration-200 ${
          isHovering ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Viewport content */}
      <div className="w-full h-full">{renderContent()}</div>
    </div>
  );
};

export default ViewportContent;
