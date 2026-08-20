import { ViewportContent } from "./ViewportContent";
import { ViewportDataType } from "./GeospatialViewport";
import { useState, useEffect } from "react";

interface DetachedViewportProps {
  contentType: ViewportDataType;
  dataId?: string;
}

export function DetachedViewport({
  contentType,
  dataId,
}: DetachedViewportProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  return (
    <div className="relative w-screen h-screen">
      {/* Main viewport content */}
      <ViewportContent
        contentType={contentType}
        viewportIndex={-1}
        isActive={true}
        dataId={dataId}
        hideControls={false}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}
