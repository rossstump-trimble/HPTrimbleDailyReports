"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Pencil,
  Square,
  Type,
  Link2,
  Camera,
  Circle,
  Minus,
  TextSelect,
  Ruler,
  Maximize2,
  Grid,
  ArrowUpDown,
  Wallpaper,
  DoorOpen,
  Box,
  SquareArrowRight,
  Pipette,
  Eraser,
  MousePointer,
  LayoutGrid,
  Layers,
  Table2,
} from "lucide-react";

interface TwoDToolBarProps {
  position?: "left" | "right";
  onToolSelect?: (tool: string, subTool?: string) => void;
}

export default function TwoDToolBar({
  position = "right",
  onToolSelect,
}: TwoDToolBarProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Toggle submenu function
  const toggleSubmenu = (submenu: string) => {
    if (activeSubmenu === submenu) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(submenu);
    }
  };

  // Handle tool selection
  const handleToolSelect = (tool: string, subTool?: string) => {
    setActiveTool(tool);
    setActiveSubmenu(null);
    if (onToolSelect) {
      onToolSelect(tool, subTool);
    }
  };

  // Render submenu based on active selection
  const renderSubmenu = () => {
    if (!activeSubmenu) return null;

    return (
      <div
        className={cn(
          "absolute bg-gray-900/90 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-lg p-2 min-w-[48px]",
          position === "right" ? "right-full mr-2" : "left-full ml-2"
        )}
        style={{ top: "0" }}
      >
        {activeSubmenu === "draw" && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("draw", "pencil")}
            >
              <Pencil className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("draw", "rectangle")}
            >
              <Square className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("draw", "circle")}
            >
              <Circle className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("draw", "line")}
            >
              <Minus className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("draw", "eraser")}
            >
              <Eraser className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
          </div>
        )}

        {activeSubmenu === "text" && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("text", "text")}
            >
              <Type className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("text", "annotate")}
            >
              <TextSelect className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
          </div>
        )}

        {activeSubmenu === "measure" && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("measure", "ruler")}
            >
              <Ruler className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("measure", "area")}
            >
              <Maximize2 className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
          </div>
        )}

        {activeSubmenu === "walls" && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("walls", "wall")}
            >
              <Wallpaper className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("walls", "door")}
            >
              <DoorOpen className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("walls", "window")}
            >
              <SquareArrowRight className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
          </div>
        )}

        {activeSubmenu === "furniture" && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("furniture", "couch")}
            >
              <Box className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("furniture", "table")}
            >
              <Table2 className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
          </div>
        )}

        {activeSubmenu === "grid" && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("grid", "toggle")}
            >
              <Grid className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("grid", "snap")}
            >
              <LayoutGrid className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
          </div>
        )}

        {activeSubmenu === "layers" && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
              )}
              onClick={() => handleToolSelect("layers", "manage")}
            >
              <Layers className="h-5 w-5 text-white group-hover:text-white/90" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "fixed flex flex-col items-center bg-gray-900/90 backdrop-blur-md border border-gray-700/50 p-2 rounded-xl shadow-lg gap-2",
        position === "right" ? "right-6" : "left-6"
      )}
      style={{ top: "50%", transform: "translateY(-50%)" }}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
        )}
        onClick={() => handleToolSelect("select")}
      >
        <MousePointer className="h-5 w-5 text-white group-hover:text-white/90" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
        )}
        onClick={() => toggleSubmenu("draw")}
      >
        <Pencil
          className={cn(
            "h-5 w-5 group-hover:text-white/90",
            activeSubmenu === "draw" ? "text-blue-400" : "text-white"
          )}
        />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
        )}
        onClick={() => toggleSubmenu("text")}
      >
        <Type
          className={cn(
            "h-5 w-5 group-hover:text-white/90",
            activeSubmenu === "text" ? "text-blue-400" : "text-white"
          )}
        />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
        )}
        onClick={() => toggleSubmenu("measure")}
      >
        <Ruler
          className={cn(
            "h-5 w-5 group-hover:text-white/90",
            activeSubmenu === "measure" ? "text-blue-400" : "text-white"
          )}
        />
      </Button>

      <Separator className="my-1 bg-gray-700/50" />

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
        )}
        onClick={() => toggleSubmenu("walls")}
      >
        <Wallpaper className="h-5 w-5 text-white group-hover:text-white/90" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
        )}
        onClick={() => toggleSubmenu("furniture")}
      >
        <Box className="h-5 w-5 text-white group-hover:text-white/90" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
        )}
        onClick={() => toggleSubmenu("grid")}
      >
        <Grid className="h-5 w-5 text-white group-hover:text-white/90" />
      </Button>

      <Separator className="my-1 bg-gray-700/50" />

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
        )}
        onClick={() => toggleSubmenu("layers")}
      >
        <Layers className="h-5 w-5 text-white group-hover:text-white/90" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
        onClick={() => handleToolSelect("color")}
      >
        <Pipette className="h-5 w-5 text-white group-hover:text-white/90" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 hover:bg-gray-800/80 transition-colors duration-200 group"
      >
        <Camera className="h-5 w-5 text-white group-hover:text-white/90" />
      </Button>

      {renderSubmenu()}
    </div>
  );
}
