import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface ThreeDViewerSettingsProps {
  areToolbarsVisible: boolean;
  onToggleToolbarsVisibility?: () => void;
}

export function ThreeDViewerSettings({
  areToolbarsVisible,
  onToggleToolbarsVisibility,
}: ThreeDViewerSettingsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="whiteToolbar" size="icon" title="Layout Settings">
          <i className="icon-font tc-icon-layout-settings" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Layout Settings</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="toolbar-visibility"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Toolbar Visibility
              </label>
              <p className="text-[0.8rem] text-muted-foreground">
                Toggle visibility of toolbars (TAB)
              </p>
            </div>
            <Switch
              id="toolbar-visibility"
              checked={areToolbarsVisible}
              onCheckedChange={onToggleToolbarsVisibility || (() => {})}
              className="data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
