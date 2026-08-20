import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

interface Point {
  x: number;
  y: number;
}

interface RegionSelection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
}

interface Props {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export function ScreenCaptureOverlay({ onCapture, onCancel }: Props) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selection, setSelection] = useState<RegionSelection>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    width: 0,
    height: 0,
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [paths, setPaths] = useState<Point[][]>([]);

  const updateSelectionBox = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const left = Math.min(x1, x2);
      const top = Math.min(y1, y2);
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);

      setSelection({
        startX: left,
        startY: top,
        endX: left + width,
        endY: top + height,
        width,
        height,
      });

      if (selectionBoxRef.current) {
        selectionBoxRef.current.style.left = `${left}px`;
        selectionBoxRef.current.style.top = `${top}px`;
        selectionBoxRef.current.style.width = `${width}px`;
        selectionBoxRef.current.style.height = `${height}px`;
        selectionBoxRef.current.style.display = "block";
      }
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting) {
        setIsSelecting(true);
        updateSelectionBox(e.clientX, e.clientY, e.clientX, e.clientY);
      }
    },
    [isSelecting, updateSelectionBox]
  );

  const drawPath = useCallback(
    (path: Point[]) => {
      if (!ctxRef.current || path.length < 2) return;

      ctxRef.current.beginPath();
      ctxRef.current.moveTo(
        path[0].x - selection.startX,
        path[0].y - selection.startY
      );

      for (let i = 1; i < path.length; i++) {
        ctxRef.current.lineTo(
          path[i].x - selection.startX,
          path[i].y - selection.startY
        );
      }
      ctxRef.current.stroke();
    },
    [selection.startX, selection.startY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isSelecting) {
        updateSelectionBox(
          selection.startX,
          selection.startY,
          e.clientX,
          e.clientY
        );
      } else if (isDrawing) {
        const newPoint = { x: e.clientX, y: e.clientY };
        setCurrentPath((prev) => [...prev, newPoint]);
        drawPath([...currentPath, newPoint]);
      }
    },
    [
      isSelecting,
      isDrawing,
      selection.startX,
      selection.startY,
      currentPath,
      updateSelectionBox,
      drawPath,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
    }
    if (isDrawing) {
      setIsDrawing(false);
      if (currentPath.length > 0) {
        setPaths((prev) => [...prev, currentPath]);
        setCurrentPath([]);
      }
    }
  }, [isSelecting, isDrawing, currentPath]);

  const handleStartAnnotation = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.style.display = "block";
    canvasRef.current.width = selection.width;
    canvasRef.current.height = selection.height;
    canvasRef.current.style.left = `${selection.startX}px`;
    canvasRef.current.style.top = `${selection.startY}px`;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;
    }

    // Don't set isDrawing here anymore, wait for canvas click
  }, [selection.width, selection.height, selection.startX, selection.startY]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDrawing(true);
    const newPoint = { x: e.clientX, y: e.clientY };
    setCurrentPath([newPoint]);
  }, []);

  const handleCapture = useCallback(async () => {
    try {
      const screenshot = await html2canvas(document.documentElement, {
        x: window.scrollX + selection.startX,
        y: window.scrollY + selection.startY,
        width: selection.width,
        height: selection.height,
        useCORS: true,
        allowTaint: true,
      });

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = selection.width;
      finalCanvas.height = selection.height;
      const finalCtx = finalCanvas.getContext("2d");

      if (finalCtx) {
        finalCtx.drawImage(screenshot, 0, 0);
        if (canvasRef.current) {
          finalCtx.drawImage(canvasRef.current, 0, 0);
        }
        onCapture(finalCanvas.toDataURL("image/png"));
      }
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      onCancel();
    }
  }, [selection, onCapture, onCancel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (
        e.key === "Enter" &&
        canvasRef.current?.style.display === "block"
      ) {
        handleCapture();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCapture, onCancel]);

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-blue-500/5 cursor-crosshair z-[10000]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-black/70 text-white px-5 py-2.5 rounded-lg font-mono text-sm z-[10001]">
          Click and drag to select an area. Press ESC to cancel.
        </div>
      </div>

      <div
        ref={selectionBoxRef}
        className="fixed border border-dashed border-foreground bg-primary/5 z-[10001]"
        style={{ display: "none" }}
      />

      <canvas
        ref={canvasRef}
        className="fixed cursor-crosshair z-[10002]"
        style={{ display: "none" }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {selection.width > 0 && selection.height > 0 && !isSelecting && (
        <div
          className="fixed z-[10003] bg-background p-2.5 rounded-lg flex gap-2 shadow-sm"
          style={{
            left: `${selection.startX}px`,
            top: `${selection.endY + 10}px`,
          }}
        >
          {" "}
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartAnnotation}
            title="Annotate"
          >
            <Pencil className="h-4 w-4 mr-2" /> Annotate
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleCapture}
            title="Capture"
          >
            <Check className="h-4 w-4 mr-2" /> Capture
          </Button>
          <div className="ml-12">
            <Button size="sm" variant="ghost" onClick={onCancel} title="Cancel">
              <X className="h-4 w-4 " />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
