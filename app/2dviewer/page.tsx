"use client";

import React, { useState, useRef } from "react";
import TwoDHeader from "@/components/2d-viewer/2DHeader";
import TwoDToolBar from "@/components/2d-viewer/2DToolBar";
import TwoDViewport from "@/components/2d-viewer/2DVieweport";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, RotateCw, Pencil, Eraser } from "lucide-react";

export default function TwoDViewerPage() {
  const [toolbarPosition, setToolbarPosition] = useState<"left" | "right">(
    "right"
  );
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [drawingMode, setDrawingMode] = useState<"pen" | "eraser" | "none">(
    "none"
  );
  const viewportRef = useRef<any>(null);

  const handleClose = () => {
    // Handle close functionality - could be navigation back to previous page
    console.log("Close button clicked");
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleRotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCounterClockwise = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const toggleDrawingMode = (mode: "pen" | "eraser" | "none") => {
    setDrawingMode((current) => (current === mode ? "none" : mode));

    // Access viewport methods if needed
    if (viewportRef.current && viewportRef.current.toggleDrawingMode) {
      viewportRef.current.toggleDrawingMode(mode);
    }
  };

  const clearDrawing = () => {
    // Access viewport methods if needed
    if (viewportRef.current && viewportRef.current.clearDrawing) {
      viewportRef.current.clearDrawing();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TwoDHeader onClose={handleClose} />
      </div>

      {/* Main Content with Viewport - Adjusted for fixed header */}
      <div className="flex-1 relative mt-[41px] mb-[60px] ">
        <TwoDViewport
          ref={viewportRef}
          imageUrl="/pdfs/sample3_new.jpg"
          className="h-full w-full "
          onZoomChange={setScale}
          onRotationChange={setRotation}
          scale={scale}
          rotation={rotation}
        />

        {/* Side Toolbar */}
        <TwoDToolBar position={toolbarPosition} />

        {/* Bottom Fixed Controls */}
        <div className="fixed bottom-0 left-0 right-0 h-[60px] bg-background/90 backdrop-blur-sm border-t flex items-center justify-center gap-4 px-4 z-50">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <span className="text-lg">-</span>
            </Button>
            <span>{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <span className="text-lg">+</span>
            </Button>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRotateCounterClockwise}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRotateClockwise}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
