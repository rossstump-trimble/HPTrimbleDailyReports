import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import {
  ArrowLeft,
  Undo,
  Redo,
  MousePointer,
  Square,
  Grid,
  Camera,
  Move,
  Eye,
  RotateCcw,
  Box,
  Map,
  Building,
  Layers,
  Ruler,
  Compass,
  MapPin,
  GalleryVertical,
  Mountain,
  RouteOff,
  MountainSnow,
  Check,
  ChevronDown,
  Lock,
  Unlock,
  CalendarIcon,
  Construction,
  Aperture,
  GripHorizontal,
  X,
  Pin,
  PinOff,
  Package,
  Crop,
  Menu,
} from "lucide-react";
import {
  GiInvertedDice1,
  GiInvertedDice2,
  GiInvertedDice3,
  GiInvertedDice4,
} from "react-icons/gi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ThreeDViewerSettings } from "./3DViewerSettings";

// Types
export type WorkspaceType = "bim" | "geospatial" | "maya" | "quadri";
export type ViewportLayoutType =
  | "single"
  | "horizontal"
  | "vertical"
  | "triple"
  | "top-wide"
  | "four";

// Viewport layout menu item component
interface ViewportLayoutMenuItemProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const ViewportLayoutMenuItem = ({
  icon: Icon,
  label,
  isActive,
  onClick,
}: ViewportLayoutMenuItemProps) => (
  <DropdownMenuItem
    onClick={onClick}
    className={cn(
      "cursor-pointer flex items-center px-3 py-2 dark:text-slate-200",
      isActive && "bg-slate-100 dark:bg-slate-700"
    )}
  >
    <Icon className="h-5 w-5 mr-2" />
    <span>{label}</span>
    {isActive && (
      <i
        className="icon-font tc-icon-check ml-auto text-green-500"
        aria-hidden="true"
      ></i>
    )}
  </DropdownMenuItem>
);

export interface ThreeDViewerTopToolbarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Function to toggle the side panel visibility
   */
  onTogglePanel?: () => void;

  /**
   * Function to toggle the grid visibility
   */
  onToggleGrid?: () => void;

  /**
   * Function to reset the model view
   */
  onResetModel?: () => void;

  /**
   * Function to toggle fullscreen mode
   */
  onToggleFullscreen?: () => void;

  /**
   * Current workspace type
   */
  workspace?: WorkspaceType;

  /**
   * Function to change the workspace type
   */
  onChangeWorkspace?: (workspace: WorkspaceType) => void;

  /**
   * Current viewport layout configuration
   */
  viewportLayout?: ViewportLayoutType;

  /**
   * Function to change the viewport layout
   */
  onChangeViewportLayout?: (layout: ViewportLayoutType) => void;

  /**
   * Function for back button click
   */
  onBackButtonClick?: () => void;

  /**
   * Whether toolbars are currently visible
   */
  areToolbarsVisible?: boolean;

  /**
   * Function to toggle toolbars visibility
   */
  onToggleToolbarsVisibility?: () => void;

  /**
   * Whether the divider is locked (for horizontal layout)
   */
  isDividerLocked?: boolean;

  /**
   * Function to toggle divider lock
   */
  onToggleDividerLock?: () => void;

  /**
   * Whether date picker is enabled
   */
  isDatePickerEnabled?: boolean;

  /**
   * Function to toggle date picker
   */
  onToggleDatePicker?: () => void;

  /**
   * Whether to hide toolbar controls
   */
  hideToolbarControls?: boolean;
}

/**
 * Top toolbar component for 3D viewer with various tools and options.
 * Supports different workspaces, floating mode, and viewport configurations.
 */
export function ThreeDViewerTopToolbar({
  onTogglePanel,
  onToggleGrid,
  onResetModel,
  onToggleFullscreen,
  workspace = "bim",
  onChangeWorkspace,
  viewportLayout = "single",
  onChangeViewportLayout,
  onBackButtonClick,
  areToolbarsVisible = true,
  onToggleToolbarsVisibility,
  isDividerLocked = false,
  onToggleDividerLock,
  isDatePickerEnabled = false,
  onToggleDatePicker,
  hideToolbarControls = false,
  className,
  ...props
}: ThreeDViewerTopToolbarProps) {
  // State for active submenu
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Theme context
  const { resolvedTheme } = useTheme();
  const logoSrc =
    resolvedTheme === "dark"
      ? "/trimbleconnect_header_dark.svg"
      : "/trimbleconnect_header.svg";

  // Floating toolbar state
  const [isFloating, setIsFloating] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Group tools by category for mobile menu
  const toolGroups = {
    selection: {
      label: "Selection Tools",
      tools: [
        { icon: "select-single", title: "Single selection mode" },
        { icon: "select-area", title: "Area selection mode" },
        { icon: "select-assembly", title: "Assembly selection" },
        { icon: "multiselect", title: "Multi-select mode" },
      ],
    },
    measurement: {
      label: "Measurement & Markup",
      tools: [
        { icon: "measure", title: "Perpendicular measure" },
        { icon: "markup-cloud", title: "Cloud markup" },
        { icon: "content-cut", title: "Clip plane" },
        { icon: "views-add", title: "Add view" },
        { icon: "todo-add", title: "Add ToDo" },
      ],
    },
    view: {
      label: "View Controls",
      tools: [
        { icon: "axon-default", title: "Axon view" },
        { icon: "perspective", title: "Toggle orthogonal/perspective mode" },
        { icon: "show-all", title: "Show all objects" },
        { icon: "ghost", title: "Toggle ghost mode" },
      ],
    },
    visibility: {
      label: "Visibility",
      tools: [
        { icon: "eye-visibility", title: "Visibility Controls" },
        { icon: "transparency", title: "Model transparency" },
      ],
    },
  };

  // Mobile menu component
  const MobileMenu = () => (
    <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="whiteToolbar"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 bg-white dark:bg-slate-800 p-2"
        align="end"
      >
        <DropdownMenuLabel>Tools</DropdownMenuLabel>
        {Object.entries(toolGroups).map(([key, group]) => (
          <DropdownMenuGroup key={key}>
            <DropdownMenuLabel className="text-sm font-medium text-muted-foreground px-2 py-1.5">
              {group.label}
            </DropdownMenuLabel>
            {group.tools.map((tool) => (
              <DropdownMenuItem
                key={tool.title}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
              >
                <i className={`icon-font tc-icon-${tool.icon}`} />
                <span>{tool.title}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
        ))}

        {/* Workspace selector in mobile menu */}
        <DropdownMenuLabel className="text-sm font-medium text-muted-foreground px-2 py-1.5">
          Workspace
        </DropdownMenuLabel>
        <WorkspaceSelector />

        {/* Layout selector in mobile menu */}
        <DropdownMenuLabel className="text-sm font-medium text-muted-foreground px-2 py-1.5">
          Layout
        </DropdownMenuLabel>
        <ViewportLayoutSelector />
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Toggle submenu function
  const toggleSubmenu = (submenu: string) => {
    setActiveSubmenu(activeSubmenu === submenu ? null : submenu);
  };

  // Handle drag start for floating toolbar
  const handleDragStart = (e: React.MouseEvent) => {
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  // Handle drag movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
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
  }, [isDragging, dragOffset]);

  // Toggle floating mode
  const toggleFloatingMode = () => {
    setIsFloating(!isFloating);
    if (!isFloating) {
      setIsCollapsed(false);
    }
  };

  // Helper components for cleaner code
  interface ToolButtonProps {
    connectIcon: string;
    title?: string;
    onClick?: () => void;
    isActive?: boolean;
    className?: string;
    active?: boolean;
  }

  const ToolButton = ({
    connectIcon,
    title,
    onClick,
    isActive,
    className,
    active,
  }: ToolButtonProps) => (
    <Button
      variant="whiteToolbar"
      size="icon"
      className={cn("mx-0.5", className)}
      onClick={onClick}
      title={title}
      connectIcon={connectIcon}
      active={active || isActive}
    />
  );

  // Section with separator
  interface ToolSectionProps {
    children: React.ReactNode;
  }

  const ToolSection = ({ children }: ToolSectionProps) => (
    <div className="flex items-center gap-1 mx-0.5">{children}</div>
  );

  // Render common tools section (navigation, undo/redo)
  const renderCommonTools = () => (
    <>
      {/* Back button */}
      <ToolSection>
        <Button
          variant="whiteToolbar"
          className="flex items-center gap-1"
          onClick={onBackButtonClick}
          title="Back"
        >
          <i className="icon-font tc-icon-arrow-line-back"></i>
          Back
        </Button>
      </ToolSection>
      <Separator orientation="vertical" className="h-12" />

      {/* Camera controls */}
      <ToolSection>
        <Button
          variant="whiteToolbar"
          size="icon"
          title="Camera controls"
          connectIcon="orbit"
        />
      </ToolSection>
      <Separator orientation="vertical" className="h-12" />
    </>
  );

  // Render BIM workspace tools
  const renderBIMTools = () => (
    <>
      {/* Selection tools */}
      <ToolSection>
        <ToolButton
          connectIcon="select-single"
          isActive
          title="Single selection mode"
        />
        <ToolButton connectIcon="select-area" title="Area selection mode" />
        <ToolButton connectIcon="select-assembly" title="Assembly selection" />
      </ToolSection>
      <Separator orientation="vertical" className="h-12" />

      {/* Multi-select */}
      <ToolSection>
        <ToolButton connectIcon="multiselect" title="Multi-select mode" />
      </ToolSection>
      <Separator orientation="vertical" className="h-12" />

      {/* Measurement and Markup tools */}
      <ToolSection>
        <ToolButton connectIcon="measure" title="Perpendicular measure" />
        <ToolButton connectIcon="markup-cloud" title="Cloud markup" />
        <ToolButton connectIcon="content-cut" title="Clip plane" />
        <ToolButton connectIcon="views-add" title="Add view" />
        <ToolButton connectIcon="todo-add" title="Add ToDo" />
      </ToolSection>
      <Separator orientation="vertical" className="h-12" />

      {/* View tools */}
      <ToolSection>
        <ToolButton connectIcon="axon-default" title="Axon view" />
        <ToolButton
          connectIcon="perspective"
          title="Toggle orthogonal/perspective mode"
        />
      </ToolSection>
      <Separator orientation="vertical" className="h-12" />

      {/* Visibility tools */}
      <ToolSection>
        <ToolButton connectIcon="show-all" title="Show all objects" />
        <ToolButton connectIcon="ghost" title="Toggle ghost mode" />
      </ToolSection>
      <Separator orientation="vertical" className="h-12" />

      {/* Eye visibility and transparency */}
      <ToolSection>
        <ToolButton
          connectIcon="eye-visibility"
          title="Visibility Controls"
          isActive
        />
        <ToolButton connectIcon="transparency" title="Model transparency" />
      </ToolSection>
      <Separator orientation="vertical" className="h-12" />

      {/* Reset model */}
      <ToolSection>
        <Button
          variant="link"
          onClick={onResetModel}
          title="Reset model"
          className="text-blue-600"
        >
          Reset model
        </Button>
      </ToolSection>
      <Separator orientation="vertical" className="h-12" />

      {/* Settings and fullscreen */}
      <ToolSection>
        <Button
          variant="whiteToolbar"
          size="icon"
          onClick={() => setShowInstructions(true)}
          title="Show Instructions"
        >
          <i className="icon-font tc-icon-support" />
        </Button>
        <Button
          variant="whiteToolbar"
          size="icon"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <i className="icon-font tc-icon-settings" />
        </Button>
        <Button
          variant="whiteToolbar"
          size="icon"
          onClick={onToggleFullscreen}
          title="Enter Fullscreen"
        >
          <i className="icon-font tc-icon-fullscreen" />
        </Button>
      </ToolSection>
    </>
  );

  // Render Maya workspace tools
  const renderMayaTools = () => {
    const { icon: LayoutIcon, label: layoutLabel } = getViewportLayoutInfo();

    return (
      <>
        {/* Selection tools */}
        <ToolSection>
          <ToolButton
            connectIcon="select-single"
            isActive
            title="Single selection mode"
          />
          <ToolButton connectIcon="select-area" title="Area selection mode" />
          <ToolButton
            connectIcon="select-assembly"
            title="Assembly selection"
          />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Multi-select */}
        <ToolSection>
          <ToolButton connectIcon="multiselect" title="Multi-select mode" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Measurement and Markup tools */}
        <ToolSection>
          <ToolButton connectIcon="measure" title="Perpendicular measure" />
          <ToolButton connectIcon="markup-cloud" title="Cloud markup" />
          <ToolButton connectIcon="content-cut" title="Clip plane" />
          <ToolButton connectIcon="views-add" title="Add view" />
          <ToolButton connectIcon="todo-add" title="Add ToDo" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* View tools */}
        <ToolSection>
          <ToolButton connectIcon="axon-default" title="Axon view" />
          <ToolButton
            connectIcon="perspective"
            title="Toggle orthogonal/perspective mode"
          />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Visibility tools */}
        <ToolSection>
          <ToolButton connectIcon="show-all" title="Show all objects" />
          <ToolButton connectIcon="ghost" title="Toggle ghost mode" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Eye visibility and transparency */}
        <ToolSection>
          <ToolButton
            connectIcon="eye-visibility"
            title="Visibility Controls"
            isActive
          />
          <ToolButton connectIcon="transparency" title="Model transparency" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Calendar and Layout Controls */}
        <ToolSection>
          {/* Date picker toggle */}
          <ToolButton
            connectIcon="calendar"
            isActive={isDatePickerEnabled}
            title={
              isDatePickerEnabled ? "Disable Date Picker" : "Enable Date Picker"
            }
            onClick={onToggleDatePicker}
            active={isDatePickerEnabled}
          />
          <Separator orientation="vertical" className="h-12" />
          {/* Viewport layout dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="whiteToolbar"
                className="flex items-center gap-1"
              >
                <LayoutIcon className="h-5 w-5" />
                <span className="ml-1">{layoutLabel}</span>
                <i
                  className="icon-font tc-icon-arrow-drop-down ml-1"
                  aria-hidden="true"
                ></i>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <ViewportLayoutMenuItem
                icon={GiInvertedDice1}
                label="Single View"
                isActive={viewportLayout === "single"}
                onClick={() => onChangeViewportLayout?.("single")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice2}
                label="Side by Side"
                isActive={viewportLayout === "horizontal"}
                onClick={() => onChangeViewportLayout?.("horizontal")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice2}
                label="Top and Bottom"
                isActive={viewportLayout === "vertical"}
                onClick={() => onChangeViewportLayout?.("vertical")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice3}
                label="Three Viewports"
                isActive={viewportLayout === "triple"}
                onClick={() => onChangeViewportLayout?.("triple")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice3}
                label="One Wide, Two Below"
                isActive={viewportLayout === "top-wide"}
                onClick={() => onChangeViewportLayout?.("top-wide")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice4}
                label="Four Viewports"
                isActive={viewportLayout === "four"}
                onClick={() => onChangeViewportLayout?.("four")}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Reset model */}
        <ToolSection>
          <Button
            variant="link"
            onClick={onResetModel}
            title="Reset model"
            className="text-blue-600"
          >
            Reset model
          </Button>
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Settings and fullscreen */}
        <ToolSection>
          <Button
            variant="whiteToolbar"
            size="icon"
            onClick={() => setShowInstructions(true)}
            title="Show Instructions"
          >
            <i className="icon-font tc-icon-support" />
          </Button>
          <Button
            variant="whiteToolbar"
            size="icon"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <i className="icon-font tc-icon-settings" />
          </Button>
          <Button
            variant="whiteToolbar"
            size="icon"
            onClick={onToggleFullscreen}
            title="Enter Fullscreen"
          >
            <i className="icon-font tc-icon-fullscreen" />
          </Button>
        </ToolSection>
      </>
    );
  };

  // Render geospatial workspace tools
  const renderGeospatialTools = () => {
    const { icon: LayoutIcon, label: layoutLabel } = getViewportLayoutInfo();

    return (
      <>
        {/* Selection tools */}
        <ToolSection>
          <ToolButton
            connectIcon="select-single"
            isActive
            title="Single selection mode"
          />
          <ToolButton connectIcon="select-area" title="Area selection mode" />
          <ToolButton
            connectIcon="select-assembly"
            title="Assembly selection"
          />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Multi-select */}
        <ToolSection>
          <ToolButton connectIcon="multiselect" title="Multi-select mode" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Measurement and Markup tools */}
        <ToolSection>
          <ToolButton connectIcon="measure" title="Perpendicular measure" />
          <ToolButton connectIcon="markup-cloud" title="Cloud markup" />
          <ToolButton connectIcon="content-cut" title="Clip plane" />
          <ToolButton connectIcon="views-add" title="Add view" />
          <ToolButton connectIcon="todo-add" title="Add ToDo" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* View tools */}
        <ToolSection>
          <ToolButton connectIcon="axon-default" title="Axon view" />
          <ToolButton
            connectIcon="perspective"
            title="Toggle orthogonal/perspective mode"
          />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Visibility tools */}
        <ToolSection>
          <ToolButton connectIcon="show-all" title="Show all objects" />
          <ToolButton connectIcon="ghost" title="Toggle ghost mode" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Eye visibility and transparency */}
        <ToolSection>
          <ToolButton
            connectIcon="eye-visibility"
            title="Visibility Controls"
            isActive
          />
          <ToolButton connectIcon="transparency" title="Model transparency" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Calendar and Layout Controls */}
        <ToolSection>
          {/* Date picker toggle */}
          <ToolButton
            connectIcon="calendar"
            isActive={isDatePickerEnabled}
            title={
              isDatePickerEnabled ? "Disable Date Picker" : "Enable Date Picker"
            }
            onClick={onToggleDatePicker}
            active={isDatePickerEnabled}
          />
          <Separator orientation="vertical" className="h-12" />
          {/* Viewport layout dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="whiteToolbar"
                className="flex items-center gap-1"
              >
                <LayoutIcon className="h-5 w-5" />
                <span className="ml-1">{layoutLabel}</span>
                <i
                  className="icon-font tc-icon-arrow-drop-down ml-1"
                  aria-hidden="true"
                ></i>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <ViewportLayoutMenuItem
                icon={GiInvertedDice1}
                label="Single View"
                isActive={viewportLayout === "single"}
                onClick={() => onChangeViewportLayout?.("single")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice2}
                label="Side by Side"
                isActive={viewportLayout === "horizontal"}
                onClick={() => onChangeViewportLayout?.("horizontal")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice2}
                label="Top and Bottom"
                isActive={viewportLayout === "vertical"}
                onClick={() => onChangeViewportLayout?.("vertical")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice3}
                label="Three Viewports"
                isActive={viewportLayout === "triple"}
                onClick={() => onChangeViewportLayout?.("triple")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice3}
                label="One Wide, Two Below"
                isActive={viewportLayout === "top-wide"}
                onClick={() => onChangeViewportLayout?.("top-wide")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice4}
                label="Four Viewports"
                isActive={viewportLayout === "four"}
                onClick={() => onChangeViewportLayout?.("four")}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Reset model */}
        <ToolSection>
          <Button
            variant="link"
            onClick={onResetModel}
            title="Reset model"
            className="text-blue-600"
          >
            Reset model
          </Button>
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Settings and fullscreen */}
        <ToolSection>
          <Button
            variant="whiteToolbar"
            size="icon"
            onClick={() => setShowInstructions(true)}
            title="Show Instructions"
          >
            <i className="icon-font tc-icon-support" />
          </Button>
          <Button
            variant="whiteToolbar"
            size="icon"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <i className="icon-font tc-icon-settings" />
          </Button>
          <Button
            variant="whiteToolbar"
            size="icon"
            onClick={onToggleFullscreen}
            title="Enter Fullscreen"
          >
            <i className="icon-font tc-icon-fullscreen" />
          </Button>
        </ToolSection>
      </>
    );
  };

  // Render Quadri workspace tools
  const renderQuadriTools = () => {
    const { icon: LayoutIcon, label: layoutLabel } = getViewportLayoutInfo();

    return (
      <>
        {/* Selection tools */}
        <ToolSection>
          <ToolButton
            connectIcon="select-single"
            isActive
            title="Single selection mode"
          />
          <ToolButton connectIcon="select-area" title="Area selection mode" />
          <ToolButton
            connectIcon="select-assembly"
            title="Assembly selection"
          />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Multi-select */}
        <ToolSection>
          <ToolButton connectIcon="multiselect" title="Multi-select mode" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Measurement and Markup tools */}
        <ToolSection>
          <ToolButton connectIcon="measure" title="Perpendicular measure" />
          <ToolButton connectIcon="markup-cloud" title="Cloud markup" />
          <ToolButton connectIcon="content-cut" title="Clip plane" />
          <ToolButton connectIcon="views-add" title="Add view" />
          <ToolButton connectIcon="todo-add" title="Add ToDo" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* View tools */}
        <ToolSection>
          <ToolButton connectIcon="axon-default" title="Axon view" />
          <ToolButton
            connectIcon="perspective"
            title="Toggle orthogonal/perspective mode"
          />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Visibility tools */}
        <ToolSection>
          <ToolButton connectIcon="show-all" title="Show all objects" />
          <ToolButton connectIcon="ghost" title="Toggle ghost mode" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Eye visibility and transparency */}
        <ToolSection>
          <ToolButton
            connectIcon="eye-visibility"
            title="Visibility Controls"
            isActive
          />
          <ToolButton connectIcon="transparency" title="Model transparency" />
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Calendar and Layout Controls */}
        <ToolSection>
          {/* Date picker toggle */}
          <ToolButton
            connectIcon="calendar"
            isActive={isDatePickerEnabled}
            title={
              isDatePickerEnabled ? "Disable Date Picker" : "Enable Date Picker"
            }
            onClick={onToggleDatePicker}
            active={isDatePickerEnabled}
          />
          <Separator orientation="vertical" className="h-12" />
          {/* Viewport layout dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="whiteToolbar"
                className="flex items-center gap-1"
              >
                <LayoutIcon className="h-5 w-5" />
                <span className="ml-1">{layoutLabel}</span>
                <i
                  className="icon-font tc-icon-arrow-drop-down ml-1"
                  aria-hidden="true"
                ></i>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <ViewportLayoutMenuItem
                icon={GiInvertedDice1}
                label="Single View"
                isActive={viewportLayout === "single"}
                onClick={() => onChangeViewportLayout?.("single")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice2}
                label="Side by Side"
                isActive={viewportLayout === "horizontal"}
                onClick={() => onChangeViewportLayout?.("horizontal")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice2}
                label="Top and Bottom"
                isActive={viewportLayout === "vertical"}
                onClick={() => onChangeViewportLayout?.("vertical")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice3}
                label="Three Viewports"
                isActive={viewportLayout === "triple"}
                onClick={() => onChangeViewportLayout?.("triple")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice3}
                label="One Wide, Two Below"
                isActive={viewportLayout === "top-wide"}
                onClick={() => onChangeViewportLayout?.("top-wide")}
              />
              <ViewportLayoutMenuItem
                icon={GiInvertedDice4}
                label="Four Viewports"
                isActive={viewportLayout === "four"}
                onClick={() => onChangeViewportLayout?.("four")}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Reset model */}
        <ToolSection>
          <Button
            variant="link"
            onClick={onResetModel}
            title="Reset model"
            className="text-blue-600"
          >
            Reset model
          </Button>
        </ToolSection>
        <Separator orientation="vertical" className="h-12" />

        {/* Settings and fullscreen */}
        <ToolSection>
          <Button
            variant="whiteToolbar"
            size="icon"
            onClick={() => setShowInstructions(true)}
            title="Show Instructions"
          >
            <i className="icon-font tc-icon-support" />
          </Button>
          <Button
            variant="whiteToolbar"
            size="icon"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <i className="icon-font tc-icon-settings" />
          </Button>
          <Button
            variant="whiteToolbar"
            size="icon"
            onClick={onToggleFullscreen}
            title="Enter Fullscreen"
          >
            <i className="icon-font tc-icon-fullscreen" />
          </Button>
        </ToolSection>
      </>
    );
  };

  // Workspace selector component
  const WorkspaceSelector = () => (
    <div className="px-2">
      <DropdownMenuItem
        onClick={() => onChangeWorkspace?.("bim")}
        className={cn(
          "cursor-pointer flex items-center",
          workspace === "bim" && "bg-slate-100 dark:bg-slate-700"
        )}
      >
        <i className="icon-font tc-icon-axon-default mr-2"></i>
        <span>Simple</span>
        {workspace === "bim" && (
          <i className="icon-font tc-icon-check ml-auto text-green-500"></i>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onChangeWorkspace?.("geospatial")}
        className={cn(
          "cursor-pointer flex items-center",
          workspace === "geospatial" && "bg-slate-100 dark:bg-slate-700"
        )}
      >
        <i className="icon-font tc-icon-map mr-2"></i>
        <span>Advanced</span>
        {workspace === "geospatial" && (
          <i className="icon-font tc-icon-check ml-auto text-green-500"></i>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onChangeWorkspace?.("maya")}
        className={cn(
          "cursor-pointer flex items-center",
          workspace === "maya" && "bg-slate-100 dark:bg-slate-700"
        )}
      >
        <i className="icon-font tc-icon-camera-alt mr-2"></i>
        <span>Maya</span>
        {workspace === "maya" && (
          <i className="icon-font tc-icon-check ml-auto text-green-500"></i>
        )}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onChangeWorkspace?.("quadri")}
        className={cn(
          "cursor-pointer flex items-center",
          workspace === "quadri" && "bg-slate-100 dark:bg-slate-700"
        )}
      >
        <i className="icon-font tc-icon-3D-group mr-2"></i>
        <span>Quadri</span>
        {workspace === "quadri" && (
          <i className="icon-font tc-icon-check ml-auto text-green-500"></i>
        )}
      </DropdownMenuItem>
    </div>
  );

  // Viewport layout selector component
  const ViewportLayoutSelector = () => {
    const { icon: LayoutIcon, label: layoutLabel } = getViewportLayoutInfo();

    return (
      <div className="px-2">
        <ViewportLayoutMenuItem
          icon={GiInvertedDice1}
          label="Single View"
          isActive={viewportLayout === "single"}
          onClick={() => onChangeViewportLayout?.("single")}
        />
        <ViewportLayoutMenuItem
          icon={GiInvertedDice2}
          label="Side by Side"
          isActive={viewportLayout === "horizontal"}
          onClick={() => onChangeViewportLayout?.("horizontal")}
        />
        <ViewportLayoutMenuItem
          icon={GiInvertedDice2}
          label="Top and Bottom"
          isActive={viewportLayout === "vertical"}
          onClick={() => onChangeViewportLayout?.("vertical")}
        />
        <ViewportLayoutMenuItem
          icon={GiInvertedDice3}
          label="Three Viewports"
          isActive={viewportLayout === "triple"}
          onClick={() => onChangeViewportLayout?.("triple")}
        />
        <ViewportLayoutMenuItem
          icon={GiInvertedDice3}
          label="One Wide, Two Below"
          isActive={viewportLayout === "top-wide"}
          onClick={() => onChangeViewportLayout?.("top-wide")}
        />
        <ViewportLayoutMenuItem
          icon={GiInvertedDice4}
          label="Four Viewports"
          isActive={viewportLayout === "four"}
          onClick={() => onChangeViewportLayout?.("four")}
        />
      </div>
    );
  };

  // Determine viewport layout info
  const getViewportLayoutInfo = () => {
    switch (viewportLayout) {
      case "horizontal":
        return { icon: GiInvertedDice2, label: "Side by Side" };
      case "vertical":
        return { icon: GiInvertedDice2, label: "Top and Bottom" };
      case "triple":
        return { icon: GiInvertedDice3, label: "Three Viewports" };
      case "top-wide":
        return { icon: GiInvertedDice3, label: "One Wide, Two Below" };
      case "four":
        return { icon: GiInvertedDice4, label: "Four Viewports" };
      default:
        return { icon: GiInvertedDice1, label: "Single View" };
    }
  };

  // Determine which workspace tools to render
  const renderWorkspaceTools = () => {
    switch (workspace) {
      case "bim":
        return renderBIMTools();
      case "maya":
        return renderMayaTools();
      case "geospatial":
        return renderGeospatialTools();
      case "quadri":
        return renderQuadriTools();
      default:
        return null;
    }
  };

  // Floating toolbar position style
  const floatingStyle = isFloating
    ? {
        position: "absolute" as const,
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50,
        transition: isDragging ? "none" : "all 0.2s ease",
      }
    : {};

  // Render the toolbar content
  const renderToolbarContent = () => (
    <div className="flex items-center gap-1 px-0.5 h-[41px] w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      {isFloating && (
        <div
          className="cursor-grab flex items-center"
          onMouseDown={handleDragStart}
        >
          <Button
            variant="whiteToolbar"
            size="icon"
            connectIcon="drag-vert"
            aria-label="Drag toolbar"
          />
        </div>
      )}

      {/* Back button - always visible */}
      <Button
        variant="whiteToolbar"
        className="flex items-center gap-1"
        onClick={onBackButtonClick}
        title="Back"
      >
        <i className="icon-font tc-icon-arrow-line-back"></i>
        <span className="hidden sm:inline">Back</span>
      </Button>

      <Separator orientation="vertical" className="h-12" />

      {/* Mobile menu */}
      <div className="md:hidden">
        <MobileMenu />
      </div>

      {/* Desktop tools */}
      <div className="hidden md:flex items-center flex-1 overflow-x-auto">
        {renderWorkspaceTools()}
      </div>

      {/* Right side controls */}
      <div className="flex items-center ml-auto">
        {!hideToolbarControls && (
          <>
            {/* Settings dialog with toolbar visibility */}
            <ThreeDViewerSettings
              areToolbarsVisible={areToolbarsVisible}
              onToggleToolbarsVisibility={onToggleToolbarsVisibility}
            />

            {/* Float/Pin button */}
            <ToolButton
              connectIcon={isFloating ? "lock" : "lock-open"}
              title={isFloating ? "Pin toolbar" : "Float toolbar"}
              onClick={toggleFloatingMode}
              className="hidden sm:flex"
            />

            {/* Workspace selector - desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="whiteToolbar"
                    className="flex items-center gap-1 w-42 text-sm font-normal border-l-2 border-r-2 border-slate-200 dark:border-slate-700"
                  >
                    {workspace === "bim" ? (
                      <>
                        <i
                          className="icon-font tc-icon-axon-default"
                          aria-hidden="true"
                          style={{ fontSize: "1.25rem" }}
                        >
                          {" "}
                        </i>
                        <span className="ml-1">Simple</span>
                      </>
                    ) : workspace === "geospatial" ? (
                      <>
                        <i
                          className="icon-font tc-icon-map"
                          aria-hidden="true"
                          style={{ fontSize: "1.25rem" }}
                        >
                          {" "}
                        </i>
                        <span className="ml-1">Advanced</span>
                      </>
                    ) : workspace === "maya" ? (
                      <>
                        <i
                          className="icon-font tc-icon-camera-alt"
                          aria-hidden="true"
                          style={{ fontSize: "1.25rem" }}
                        >
                          {" "}
                        </i>
                        <span className="ml-1">Maya</span>
                      </>
                    ) : (
                      <>
                        <i
                          className="icon-font tc-icon-3D-group"
                          aria-hidden="true"
                          style={{ fontSize: "1.25rem" }}
                        >
                          {" "}
                        </i>
                        <span className="ml-1">Quadri</span>
                      </>
                    )}
                    <i
                      className="icon-font tc-icon-arrow-drop-down ml-1"
                      aria-hidden="true"
                    ></i>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-normal text-slate-600 dark:text-slate-200"
                >
                  <WorkspaceSelector />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}

        {/* Logo for smaller screens */}
        {hideToolbarControls && (
          <div className="flex justify-end items-center gap-2 pr-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Powered by:
              </span>
              <Image
                src={logoSrc}
                alt="Trimble Connect"
                width={120}
                height={20}
                className="ml-2 opacity-80 hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
        )}
      </div>
    </div>
  );

  // Render the toolbar - either floating or fixed
  return (
    <div
      ref={toolbarRef}
      className={cn(
        "border border-slate-200 dark:border-slate-700 overflow-hidden",
        isFloating ? "rounded-lg shadow-lg" : "w-full",
        isDragging && "cursor-grabbing",
        !isDragging && isFloating && "cursor-grab",
        className
      )}
      style={floatingStyle}
      {...props}
    >
      {renderToolbarContent()}
    </div>
  );
}
