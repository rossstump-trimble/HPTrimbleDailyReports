import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SidePanelProps {
  isPanelOpen: boolean;
  activePanel: string;
  onTogglePanel: () => void;
}

export function SidePanel({
  isPanelOpen,
  activePanel,
  onTogglePanel,
}: SidePanelProps) {
  return (
    <div className="h-full bg-background dark:bg-gray-950 border-r border-border dark:border-gray-800 w-full z-[1000]">
      <div className="flex items-center justify-between p-4 border-b border-border dark:border-gray-800">
        <h2 className="text-lg font-medium text-foreground">
          {activePanel === "models" && "Models"}
          {activePanel === "layers" && "Layers"}
          {activePanel === "attachments" && "Attachments"}
          {activePanel === "issues" && "Issues"}
          {activePanel === "map" && "Map"}
          {activePanel === "terrain" && "Terrain"}
          {activePanel === "buildings" && "Buildings"}
          {activePanel === "settings" && "Settings"}
          {activePanel === "pins" && "Map Pins"}
          {activePanel === "roads" && "Roads"}
          {activePanel === "measurements" && "Measurements"}
          {activePanel === "organizer" && "Organizer"}
          {activePanel === "datatable" && "Data Table"}
          {activePanel === "views" && "Views"}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePanel}
          className="hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
          aria-label="Close panel"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Button>
      </div>

      <div className="p-4 h-[calc(100%-60px)] overflow-y-auto">
        {activePanel === "models" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Available Models
              </h3>
              <div className="space-y-2 border border-border dark:border-gray-800 rounded-md p-3">
                <div className="cursor-pointer hover:bg-muted dark:hover:bg-gray-800 p-2 rounded-md">
                  Building Model
                </div>
                <div className="cursor-pointer hover:bg-muted dark:hover:bg-gray-800 p-2 rounded-md">
                  Interior Components
                </div>
                <div className="cursor-pointer hover:bg-muted dark:hover:bg-gray-800 p-2 rounded-md">
                  Exterior Fixtures
                </div>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Load Model
            </Button>
          </div>
        )}

        {activePanel === "layers" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Layer Visibility
              </h3>
              <div className="space-y-2 border border-border dark:border-gray-800 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="walls" className="h-4 w-4" />
                  <Label htmlFor="walls" className="text-sm text-foreground">
                    Walls
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="floor" className="h-4 w-4" />
                  <Label htmlFor="floor" className="text-sm text-foreground">
                    Floor
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="roof" className="h-4 w-4" />
                  <Label htmlFor="roof" className="text-sm text-foreground">
                    Roof
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="windows" className="h-4 w-4" />
                  <Label htmlFor="windows" className="text-sm text-foreground">
                    Windows
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="doors" className="h-4 w-4" />
                  <Label htmlFor="doors" className="text-sm text-foreground">
                    Doors
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Layer Settings
              </h3>
              <div className="border border-border dark:border-gray-800 rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  Adjust layer transparency, color, and other properties here.
                </p>
              </div>
            </div>
          </div>
        )}

        {activePanel === "attachments" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Attached Files
              </h3>
              <div className="border border-border dark:border-gray-800 rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  No attachments found. Add attachments to share additional
                  documentation or images.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-dashed border-border dark:border-gray-700 text-foreground"
            >
              Add Attachment
            </Button>
          </div>
        )}

        {activePanel === "issues" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Open Issues
              </h3>
              <div className="border border-border dark:border-gray-800 rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  No issues found. Create an issue to track problems or
                  requests.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-border dark:border-gray-700 text-foreground"
            >
              Create Issue
            </Button>
          </div>
        )}

        {activePanel === "map" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Map Settings
              </h3>
              <div className="border border-border dark:border-gray-800 rounded-md p-3 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="satellite" className="h-4 w-4" />
                  <Label
                    htmlFor="satellite"
                    className="text-sm text-foreground"
                  >
                    Satellite View
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="labels" className="h-4 w-4" />
                  <Label htmlFor="labels" className="text-sm text-foreground">
                    Show Labels
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="boundaries" className="h-4 w-4" />
                  <Label
                    htmlFor="boundaries"
                    className="text-sm text-foreground"
                  >
                    Show Boundaries
                  </Label>
                </div>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Apply Map Settings
            </Button>
          </div>
        )}

        {activePanel === "organizer" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Organize Content
              </h3>
              <div className="border border-border dark:border-gray-800 rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  Organize and structure model components hierarchically.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-border dark:border-gray-700 text-foreground"
            >
              Create Folder
            </Button>
          </div>
        )}

        {activePanel === "datatable" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Data View</h3>
              <div className="border border-border dark:border-gray-800 rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  View and edit model data in tabular format.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-border dark:border-gray-700 text-foreground"
            >
              Export Data
            </Button>
          </div>
        )}

        {(activePanel === "terrain" ||
          activePanel === "buildings" ||
          activePanel === "pins" ||
          activePanel === "roads" ||
          activePanel === "measurements" ||
          activePanel === "settings") && (
          <div className="space-y-4">
            <div className="border border-border dark:border-gray-800 rounded-md p-4">
              <p className="text-center text-muted-foreground">
                {activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}{" "}
                panel content will be available in a future update.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
