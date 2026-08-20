import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Workspace type (you might already have this defined)
type WorkspaceType = "bim" | "geospatial" | "maya" | "quadri";

// Interface for the new toolbar props
interface ViewerToolbarProps {
  workspace: WorkspaceType;
  position?: "top" | "bottom";
}

// Color Picker Component (Simplified for brevity - you can expand on this)
const ColorPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(value); // Local state

  // Update local state when the parent prop changes
  useEffect(() => {
    setSelectedColor(value);
  }, [value]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color); // Update local state
    onChange(color); // Call the parent's onChange
  };

  const predefinedColors = [
    "#ffffff",
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#808080",
    "#c0c0c0",
    "#800000",
    "#808000",
    "#008000",
    "#800080",
    "#008080",
    "#000080",
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 p-0 border border-border"
          style={{ backgroundColor: selectedColor }} // Use local state
          title="Change Color"
        >
          <span className="sr-only">Pick Color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 bg-background border border-border rounded-xl shadow-md"
        align="start"
      >
        <div className="grid grid-cols-8 gap-2 mb-4">
          {predefinedColors.map((color) => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded",
                "transition-colors duration-200",
                "hover:ring-2 hover:ring-ring",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                `bg-[${color}]`
              )}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
              aria-label={`Set color to ${color}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={selectedColor} // Use local state
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-16 h-8 p-1"
            aria-label="Custom color input"
          />
          <Input
            type="text"
            value={selectedColor} // Use local state
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#rrggbb"
            className="h-8 text-sm"
            aria-label="Hex color code"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Transparency Slider
const TransparencySlider = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Update local state when the parent prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSliderChange = (newValue: number[]) => {
    const actualValue = newValue[0];
    setLocalValue(actualValue); // Update local state
    onChange(actualValue); // Call the parent's onChange
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="transparency-slider" className="text-sm">
        Transparency
      </Label>
      <Slider
        id="transparency-slider"
        defaultValue={[localValue]}
        max={100}
        step={1}
        onValueChange={handleSliderChange}
        className="w-full"
        aria-label="Set transparency"
      />
      <p className="text-sm text-muted-foreground text-center">{localValue}%</p>
    </div>
  );
};

// Main Component
export function ViewerToolbar({
  workspace,
  position = "bottom",
}: ViewerToolbarProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState(1); // Initialize to 1, Example state
  const [selectedColor, setSelectedColor] = useState("#ffffff"); // Default color
  const [transparency, setTransparency] = useState(100);
  const [showProperties, setShowProperties] = useState(false); // Example state
  const [showAttachments, setShowAttachments] = useState(false); // Example
  const [hideSelection, setHideSelection] = useState(false); // Example
  const [showOnlySelected, setShowOnlySelected] = useState(false); // Example

  // Refs for dragging
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ x: -200, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const clickTimeoutRef = useRef<number | null>(null);

  // Submenu toggle
  const toggleSubmenu = (submenu: string) => {
    setActiveSubmenu(activeSubmenu === submenu ? null : submenu);
  };

  // Button click handler
  const handleButtonClick = (buttonId: string, hasSubmenu: boolean) => {
    if (hasSubmenu) {
      toggleSubmenu(buttonId);
    } else {
      setActiveButton(activeButton === buttonId ? null : buttonId);
      setActiveSubmenu(null); // Close any open submenu
    }
  };

  // --- Dragging Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (toolbarRef.current) {
      setIsDragging(true);
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

  const handleDragHandleClick = () => {
    if (clickTimeoutRef.current === null) {
      clickTimeoutRef.current = window.setTimeout(() => {
        clickTimeoutRef.current = null;
      }, 300);
    } else {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      setIsCollapsed(!isCollapsed);
    }
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

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

  // --- Button and Submenu Rendering ---
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
        } left-0 bg-background dark:bg-gray-950/90 border border-border dark:border-gray-800 rounded-2xl shadow-md p-4 min-w-[180px] z-50`}
      >
        {activeSubmenu === "more" && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium px-2 py-1 text-foreground">
              More Options
            </h3>
            <Separator className="my-1 dark:bg-gray-700" />
            <div className="px-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Custom</span>
                <Button
                  variant="whiteToolbar"
                  size="sm"
                  className="w-24 justify-end hover:bg-slate-100 dark:hover:bg-slate-800"
                  connectIcon="change-history"
                >
                  <span className="text-sm">Value</span>
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Reset</span>
                <Button
                  variant="whiteToolbar"
                  size="sm"
                  className="w-24 justify-end hover:bg-slate-100 dark:hover:bg-slate-800"
                  connectIcon="change-history"
                >
                  <span className="text-sm">Value</span>
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Change visibility</span>
                <Select onValueChange={() => {}} value={""}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue placeholder="Value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Collapsed State ---
  const getButtonsToRender = () => {
    if (isCollapsed) {
      return (
        <>
          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(false)}
            title="Selected Items"
            onClick={() => {}}
          >
            <span className="text-xs" data-cy="selection-count">
              {selectedItems} selected
            </span>
          </Button>
          <ColorPicker value={selectedColor} onChange={setSelectedColor} />
        </>
      );
    } else {
      return (
        <>
          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(showProperties)}
            title="View properties panel"
            data-cy="property-panel-visibility-toggle"
            onClick={() => setShowProperties(!showProperties)}
          >
            <i className="icon-font tc-icon-info" aria-hidden="true"></i>
          </Button>

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(showAttachments)}
            title="Add attachment"
            data-cy="add-attachment"
            onClick={() => setShowAttachments(!showAttachments)}
          >
            <i
              className="icon-font tc-icon-link-alt-add"
              aria-hidden="true"
            ></i>
          </Button>

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(false)}
            title="Zoom to selection"
            data-cy="zoom-to-selection"
            onClick={() => {
              /* Implement zoom to selection */
            }}
          >
            <i className="icon-font tc-icon-view-fit" aria-hidden="true"></i>
          </Button>

          <ColorPicker value={selectedColor} onChange={setSelectedColor} />

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(hideSelection)}
            title="Hide selection"
            data-cy="selected-object-visibility-toggle"
            onClick={() => setHideSelection(!hideSelection)}
          >
            <i
              className="icon-font tc-icon-eye-visibility-off"
              aria-hidden="true"
            ></i>
          </Button>

          <Button
            variant="whiteToolbar"
            size="icon"
            className={buttonClass(showOnlySelected)}
            title="Show only selected objects"
            data-cy="show-only-selected-toggle"
            onClick={() => setShowOnlySelected(!showOnlySelected)}
          >
            <i className="icon-font tc-icon-hide-others" aria-hidden="true"></i>
          </Button>
          <Separator
            orientation="vertical"
            className="h-6 mx-2 dark:bg-gray-700"
          />
          <Button
            variant="whiteToolbar"
            size="default"
            className={cn(
              "px-2 py-1 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              "flex items-center gap-1"
            )}
            onClick={() => handleButtonClick("more", true)}
            title="Change visibility"
            data-cy="change-selection"
          >
            <span>Change visibility</span>
            <i
              className="icon-font tc-icon-arrow-drop-up"
              aria-hidden="true"
            ></i>
          </Button>
        </>
      );
    }
  };

  // --- Main Render ---
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

      {/* Toolbar buttons */}
      <div
        className={`flex items-center ${
          isCollapsed ? "max-w-[120px] overflow-hidden" : "max-w-[500px]"
        }`}
      >
        {getButtonsToRender()}
      </div>

      {/* Using a Fragment instead of AnimatePresence */}
      {activeSubmenu && renderSubmenu()}
    </div>
  );
}
