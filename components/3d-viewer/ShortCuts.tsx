import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShortcutSectionProps {
  title: string;
  shortcuts: { action: string; keys: string }[];
}

interface ShortcutsDialogContentProps {
  className?: string;
}

function ShortcutSection({ title, shortcuts }: ShortcutSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            className="flex justify-between items-center text-sm"
          >
            <span className="text-muted-foreground">{shortcut.action}</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
              {shortcut.keys}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export the shortcuts data so it can be used elsewhere if needed
export const shortcuts = {
  navigationShortcuts: [
    { action: "Pan", keys: "Alt + LMB Drag" },
    { action: "Orbit", keys: "Alt + LMB Drag" },
    { action: "Dolly (Zoom)", keys: "Alt + RMB Drag" },
    { action: "Tilt", keys: "Ctrl/Cmd + LMB Drag" },
    { action: "Roll", keys: "Ctrl/Cmd + Shift + LMB Drag" },
  ],
  viewShortcuts: [
    { action: "Toggle Fullscreen", keys: "Ctrl + Spacebar" },
    { action: "Shading Modes", keys: "Z" },
    { action: "Hide Toolbar", keys: "Tab" },
    { action: "Show Minimap", keys: "M" },
    { action: "Reset View", keys: "Numpad Keys" },
  ],
  cameraShortcuts: [
    { action: "Align View to Active Object", keys: "Ctrl + Alt + Numpad0" },
    { action: "Set Camera Viewpoint", keys: "Shift + Numpad0" },
    { action: "View from Negative X-axis", keys: "Ctrl + Numpad3" },
    { action: "Shift View Right", keys: "Ctrl + Numpad6" },
    { action: "Rotate Camera", keys: "Page Up/Down" },
    { action: "Look through camera", keys: "H" },
  ],
  animationShortcuts: [
    { action: "Reverse Play", keys: "Ctrl + Shift + Space" },
    { action: "Scroll through frames", keys: "Alt + Scroll" },
    { action: "Next/Previous frame", keys: "Left/Right arrow" },
    { action: "First/Last Frame", keys: "Shift + Left/Right arrow" },
    { action: "Jump to Keyframe", keys: "Up/Down arrow" },
    { action: "Add Keyframe", keys: "i" },
    { action: "Delete Keyframe", keys: "Alt + i" },
  ],
  otherShortcuts: [
    { action: "Walk Navigation", keys: "F3 (search 'walk')" },
    { action: "Zoom and Rotate Selection", keys: "F" },
    { action: "About 3D View", keys: "Ctrl + Alt + Shift + H" },
    { action: "Navigation Options", keys: "Alt + Right Click" },
  ],
};

export function ShortcutsDialogContent() {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[80vh] pr-4">
        <div className="space-y-6 py-4">
          <ShortcutSection
            title="Navigation"
            shortcuts={shortcuts.navigationShortcuts}
          />
          <ShortcutSection
            title="View Controls"
            shortcuts={shortcuts.viewShortcuts}
          />
          <ShortcutSection
            title="Camera Controls"
            shortcuts={shortcuts.cameraShortcuts}
          />

          <ShortcutSection
            title="Other Controls"
            shortcuts={shortcuts.otherShortcuts}
          />
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
