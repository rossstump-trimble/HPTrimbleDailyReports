import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface DialogActionFooterProps {
  isApplying: boolean;
  onCancel: () => void;
  onApply: () => void;
}

/**
 * Footer component with Cancel and Apply buttons
 */
export function DialogActionFooter({
  isApplying,
  onCancel,
  onApply,
}: DialogActionFooterProps) {
  return (
    <DialogFooter className="p-4 border-t dark:border-slate-800">
      <Button
        variant="outline"
        onClick={onCancel}
        className="dark:border-slate-700 dark:hover:bg-slate-800"
        disabled={isApplying}
      >
        Cancel
      </Button>
      {isApplying ? (
        <Button disabled className="relative min-w-[100px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
          <span className="opacity-0">Apply</span>
        </Button>
      ) : (
        <Button variant="default" onClick={onApply} className="min-w-[100px]">
          Apply
        </Button>
      )}
    </DialogFooter>
  );
}
