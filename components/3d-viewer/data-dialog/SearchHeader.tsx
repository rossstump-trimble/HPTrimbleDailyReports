import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SearchHeaderProps {
  viewportIndex: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Header component for the dialog with title and search input
 */
export function SearchHeader({
  viewportIndex,
  searchQuery,
  onSearchChange,
}: SearchHeaderProps) {
  return (
    <DialogHeader className="px-6 py-6 border-b dark:border-slate-800">
      <DialogTitle className="text-lg pb-4">
        Select Data for Viewport {viewportIndex + 1}
      </DialogTitle>
      <div className="mt-4">
        <Input
          placeholder="Search data sources..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-background dark:bg-slate-950 dark:border-slate-700"
        />
      </div>
    </DialogHeader>
  );
}
