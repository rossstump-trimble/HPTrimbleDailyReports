"use client";

import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, RotateCw, Pencil, Eraser, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface TwoDViewportProps {
  imageUrl: string;
  className?: string;
  onZoomChange?: (scale: number) => void;
  onRotationChange?: (rotation: number) => void;
  scale?: number;
  rotation?: number;
}

interface TwoDViewportHandle {
  toggleDrawingMode: (mode: "pen" | "eraser" | "none") => void;
  clearDrawing: () => void;
}

const TwoDViewport = forwardRef<TwoDViewportHandle, TwoDViewportProps>(
  (
    {
      imageUrl,
      className = "",
      onZoomChange,
      onRotationChange,
      scale: propScale,
      rotation: propRotation,
    },
    ref
  ) => {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const drawingLayerRef = useRef<HTMLCanvasElement>(null);
    const [internalScale, setInternalScale] = useState<number>(1.0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [internalRotation, setInternalRotation] = useState<number>(0);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isErasing, setIsErasing] = useState(false);
    const [prevPoint, setPrevPoint] = useState<{ x: number; y: number } | null>(
      null
    );
    const [drawingMode, setDrawingMode] = useState<"pen" | "eraser" | "none">(
      "none"
    );
    const [mouseDownTime, setMouseDownTime] = useState<number | null>(null);
    const [hasMovedDuringClick, setHasMovedDuringClick] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
      toggleDrawingMode: (mode: "pen" | "eraser" | "none") => {
        setDrawingMode((current) => (current === mode ? "none" : mode));
      },
      clearDrawing: () => {
        clearDrawing();
      },
    }));

    // Use prop values if provided, otherwise use internal state
    const scale = propScale !== undefined ? propScale : internalScale;
    const rotation =
      propRotation !== undefined ? propRotation : internalRotation;

    // Toggle drawing mode
    const handleToggleDrawingMode = (mode: "pen" | "eraser" | "none") => {
      setDrawingMode((current) => (current === mode ? "none" : mode));
    };

    // Handle image loading
    useEffect(() => {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        imageRef.current = img;
        renderImage();
      };
    }, [imageUrl]);

    // Render the image to the canvas
    const renderImage = () => {
      if (!canvasRef.current || !imageRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = imageRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Set up drawing layer
      if (drawingLayerRef.current) {
        const drawingCanvas = drawingLayerRef.current;
        drawingCanvas.width = img.width;
        drawingCanvas.height = img.height;
      }
    };

    // Handle zooming with mouse wheel
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(0.5, scale + delta), 3);
      if (propScale === undefined) {
        setInternalScale(newScale);
      }
      onZoomChange?.(newScale);
    };

    // Zoom in
    const zoomIn = () => {
      const newScale = Math.min(scale + 0.1, 3);
      if (propScale === undefined) {
        setInternalScale(newScale);
      }
      onZoomChange?.(newScale);
    };

    // Zoom out
    const zoomOut = () => {
      const newScale = Math.max(scale - 0.1, 0.5);
      if (propScale === undefined) {
        setInternalScale(newScale);
      }
      onZoomChange?.(newScale);
    };

    // Rotate the document
    const rotateDocument = (
      direction: "clockwise" | "counterclockwise" = "clockwise"
    ) => {
      const newRotation =
        direction === "clockwise"
          ? (rotation + 90) % 360
          : (rotation - 90 + 360) % 360;
      if (propRotation === undefined) {
        setInternalRotation(newRotation);
      }
      onRotationChange?.(newRotation);
    };

    // Handle image click to navigate to 3D viewer
    const handleImageClick = () => {
      router.push("/3dviewer?mode=maya&from=2dviewer");
    };

    // Handle pan/draw start
    const handleMouseDown = (e: React.MouseEvent) => {
      const rect = drawingLayerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMouseDownTime(Date.now());
      setHasMovedDuringClick(false);

      // Get position relative to the image
      const x = (e.clientX - rect.left - position.x) / scale;
      const y = (e.clientY - rect.top - position.y) / scale;

      if (drawingMode === "none") {
        // Pan mode
        if (e.button === 0) {
          // Left click only
          setIsDragging(true);
          setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
          });
        }
      } else {
        // Drawing mode
        setIsDrawing(true);
        setPrevPoint({ x, y });
        drawPoint(x, y);
      }
    };

    // Handle pan/draw
    const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging && drawingMode === "none") {
        // Pan mode
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
        setHasMovedDuringClick(true);
      } else if (isDrawing && drawingMode !== "none") {
        // Drawing mode
        const rect = drawingLayerRef.current?.getBoundingClientRect();
        if (!rect || !prevPoint) return;

        const x = (e.clientX - rect.left - position.x) / scale;
        const y = (e.clientY - rect.top - position.y) / scale;

        drawLine(prevPoint.x, prevPoint.y, x, y);
        setPrevPoint({ x, y });
        setHasMovedDuringClick(true);
      }
    };

    // Handle pan/draw end
    const handleMouseUp = (e: React.MouseEvent) => {
      setIsDragging(false);
      setIsDrawing(false);
      setPrevPoint(null);

      // Check if this was a click (not a drag or drawing action)
      if (
        mouseDownTime &&
        Date.now() - mouseDownTime < 200 && // Short duration indicates a click
        !hasMovedDuringClick &&
        drawingMode === "none" // Only navigate when not in drawing mode
      ) {
        handleImageClick();
      }

      setMouseDownTime(null);
    };

    // Draw point
    const drawPoint = (x: number, y: number) => {
      if (!drawingLayerRef.current) return;

      const ctx = drawingLayerRef.current.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();

      if (drawingMode === "pen") {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "red";
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (drawingMode === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Draw line
    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      if (!drawingLayerRef.current) return;

      const ctx = drawingLayerRef.current.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();

      if (drawingMode === "pen") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "red";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else if (drawingMode === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 20;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    // Reset view
    const resetView = () => {
      const newScale = 1.0;
      const newRotation = 0;
      setPosition({ x: 0, y: 0 });
      if (propScale === undefined) {
        setInternalScale(newScale);
      }
      if (propRotation === undefined) {
        setInternalRotation(newRotation);
      }
      onZoomChange?.(newScale);
      onRotationChange?.(newRotation);
    };

    // Clear drawing
    const clearDrawing = () => {
      if (!drawingLayerRef.current) return;
      const ctx = drawingLayerRef.current.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(
        0,
        0,
        drawingLayerRef.current.width,
        drawingLayerRef.current.height
      );
    };

    // Handle Mouse Enter for hover effects
    const handleMouseEnter = () => {
      if (drawingMode === "none") {
        setIsHovering(true);
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      setIsDragging(false);
      setIsDrawing(false);
      setPrevPoint(null);
    };

    // Additional styling classes based on state
    const canvasWrapperClasses = cn(
      "w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900 relative",
      className,
      drawingMode === "none" && isHovering && "cursor-pointer"
    );

    // Add event listeners for mouse leave
    useEffect(() => {
      const container = containerRef.current;

      if (container) {
        container.addEventListener("mouseleave", handleMouseLeave);
      }

      return () => {
        if (container) {
          container.removeEventListener("mouseleave", handleMouseLeave);
        }
      };
    }, []);

    // Add display name
    TwoDViewport.displayName = "TwoDViewport";

    return (
      <div className="relative h-full w-full">
        <div
          ref={containerRef}
          className={canvasWrapperClasses}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              cursor: isDragging
                ? "grabbing"
                : drawingMode !== "none"
                ? drawingMode === "pen"
                  ? "crosshair"
                  : "cell"
                : "grab",
              transition:
                isDragging || isDrawing ? "none" : "transform 0.1s ease",
              position: "relative",
            }}
          >
            <canvas ref={canvasRef} className="max-w-none" />
            <canvas
              ref={drawingLayerRef}
              className="absolute top-0 left-0 max-w-none pointer-events-none"
            />
          </div>

          {/* Overlay to indicate clickable state */}
          {drawingMode === "none" && isHovering && (
            <div className="absolute inset-0 bg-primary/5 flex items-center justify-center pointer-events-none">
              <div className="bg-background/90 text-foreground font-medium px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <Box className="h-5 w-5" />
                <span>Click to view 360°</span>
              </div>
            </div>
          )}
        </div>

        {/* Scale indicator */}
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded-md shadow-md">
          <p className="text-xs">{Math.round(scale * 100)}%</p>
        </div>
      </div>
    );
  }
);

export default TwoDViewport;
