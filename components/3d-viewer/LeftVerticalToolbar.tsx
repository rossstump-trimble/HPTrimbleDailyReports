import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Workspace type
type WorkspaceType = "bim" | "geospatial" | "maya" | "quadri";

interface LeftVerticalToolbarProps {
  activePanel: string;
  onSetActivePanel: (panel: string) => void;
  onTogglePanel: () => void;
  workspace: WorkspaceType;
  onToggleDataTable?: () => void;
  isPanelOpen?: boolean;
  viewMode?: "single" | "multi";
}

export function LeftVerticalToolbar({
  activePanel,
  onSetActivePanel,
  onTogglePanel,
  workspace,
  onToggleDataTable,
  isPanelOpen = false,
  viewMode = "single",
}: LeftVerticalToolbarProps) {
  // Function to handle button click - toggle panel or change active panel
  const handleButtonClick = (panel: string) => {
    if (panel === activePanel) {
      // If clicking the currently active panel button, toggle the panel
      onTogglePanel();
    } else {
      // Otherwise, set the new active panel (which should open the panel)
      onSetActivePanel(panel);
    }
  };

  // Common button class for consistent styling
  const buttonClass = (isActive: boolean) =>
    cn(
      "mb-2 w-12 h-10 rounded-none",
      isActive && isPanelOpen
        ? "bg-blue-50 dark:bg-blue-900/20"
        : "hover:bg-slate-100 dark:hover:bg-slate-800"
    );

  // BIM workspace sidebar options
  const renderBIMOptions = () => (
    <>
      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "models")}
        onClick={() => handleButtonClick("models")}
        title="Models"
        connectIcon="geometry-fill"
        active={activePanel === "models" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "layers")}
        onClick={() => handleButtonClick("layers")}
        title="Layers"
        connectIcon="layers"
        active={activePanel === "layers" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "attachments")}
        onClick={() => handleButtonClick("attachments")}
        title="Attachments"
        connectIcon="link-alt"
        active={activePanel === "attachments" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "issues")}
        onClick={() => handleButtonClick("issues")}
        title="ToDos"
        connectIcon="todo"
        active={activePanel === "issues" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "views")}
        onClick={() => handleButtonClick("views")}
        title="Views"
        connectIcon="views"
        active={activePanel === "views" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "organizer")}
        onClick={() => handleButtonClick("organizer")}
        title="Organizer"
        connectIcon="folder-tree"
        active={activePanel === "organizer" && isPanelOpen}
      />
    </>
  );

  // Geospatial workspace sidebar options
  const renderGeospatialOptions = () => (
    <>
      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "map")}
        onClick={() => handleButtonClick("map")}
        title="Map"
        connectIcon="map"
        active={activePanel === "map" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "layers")}
        onClick={() => handleButtonClick("layers")}
        title="Layers"
        connectIcon="layers"
        active={activePanel === "layers" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "terrain")}
        onClick={() => handleButtonClick("terrain")}
        title="Terrain"
        connectIcon="flag"
        active={activePanel === "terrain" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "pins")}
        onClick={() => handleButtonClick("pins")}
        title="Map Pins"
        connectIcon="offline-pin"
        active={activePanel === "pins" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "roads")}
        onClick={() => handleButtonClick("roads")}
        title="Roads"
        connectIcon="quadri"
        active={activePanel === "roads" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "buildings")}
        onClick={() => handleButtonClick("buildings")}
        title="Buildings"
        connectIcon="hard-hat"
        active={activePanel === "buildings" && isPanelOpen}
      />

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "measurements")}
        onClick={() => handleButtonClick("measurements")}
        title="Measurements"
        connectIcon="measure"
        active={activePanel === "measurements" && isPanelOpen}
      />
    </>
  );

  // Function to determine which options to render based on workspace
  const renderWorkspaceOptions = () => {
    switch (workspace) {
      case "bim":
        return renderBIMOptions();
      case "geospatial":
        return renderGeospatialOptions();
      case "maya":
        return renderGeospatialOptions();
      case "quadri":
        return renderGeospatialOptions();
      default:
        return null;
    }
  };

  // Shared buttons that appear at the bottom for all workspaces
  const renderSharedBottomButtons = () => (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="whiteToolbar"
                size="icon"
                className={cn(
                  buttonClass(false),
                  viewMode !== "single" && "opacity-50 cursor-not-allowed"
                )}
                onClick={onToggleDataTable}
                connectIcon="view-table"
                disabled={viewMode !== "single"}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="z-[1001]">
            <p className="text-sm">
              {viewMode === "single"
                ? "Data Table"
                : "Switch to single view to use data table"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        variant="whiteToolbar"
        size="icon"
        className={buttonClass(activePanel === "settings")}
        onClick={() => handleButtonClick("settings")}
        title="Settings"
        connectIcon="settings"
        active={activePanel === "settings" && isPanelOpen}
      />
    </>
  );

  return (
    <div className="flex flex-col items-center bg-background dark:bg-gray-950 border-r border-border dark:border-gray-800 w-full py-3 z-[1000] h-full">
      {renderWorkspaceOptions()}

      <Separator className="my-2 w-8 dark:bg-gray-700" />

      {renderSharedBottomButtons()}
    </div>
  );
}
