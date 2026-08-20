import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CategorySidebar } from "./CategorySidebar";
import { SearchHeader } from "./SearchHeader";
import { DataItemsList } from "./DataItemsList";
import { DialogActionFooter } from "./DialogActionFooter";
import { ViewportDataDialogProps } from "./types";
import { dataCategories, dataItemsByCategory } from "./mock-data";

/**
 * Dialog component for selecting data to display in a viewport
 */
export function ViewportDataDialog({
  open,
  onOpenChange,
  viewportIndex,
  currentData,
  onSelectData,
}: ViewportDataDialogProps) {
  // State for active category
  const [activeCategory, setActiveCategory] = useState("3d-data");
  // State for search filter
  const [searchQuery, setSearchQuery] = useState("");
  // State for temporarily selected data (before applying)
  const [selectedData, setSelectedData] = useState<{
    type: any;
    label: string;
  } | null>(null);
  // State for loading when applying selection
  const [isApplying, setIsApplying] = useState(false);

  // Reset selected data when dialog opens/closes or current data changes
  useEffect(() => {
    setSelectedData(null);
  }, [open, currentData]);

  // Reset search when changing category
  useEffect(() => {
    setSearchQuery("");
  }, [activeCategory]);

  // Get the current category's data items
  const currentCategoryItems = dataItemsByCategory[activeCategory] || [];

  // Filter data items based on search query
  const filteredItems = currentCategoryItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to handle applying the selected data
  const handleApply = () => {
    if (selectedData) {
      setIsApplying(true);
      // Find the full item data to get the ID
      const selectedItem = Object.values(dataItemsByCategory)
        .flat()
        .find(
          (item) =>
            item.type === selectedData.type && item.label === selectedData.label
        );

      // Simulate loading for a better UX
      setTimeout(() => {
        onSelectData(
          viewportIndex,
          selectedData.type,
          selectedData.label,
          selectedItem?.id
        );
        setIsApplying(false);
      }, 800);
    } else {
      // If nothing selected, close the dialog
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] h-[80vh] bg-secondary dark:bg-slate-900 ring-1 dark:ring-slate-800 p-0 gap-0 flex">
        <div className="flex flex-1 h-full">
          {/* Left sidebar - categories */}
          <CategorySidebar
            categories={dataCategories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Right content area */}
          <div className="flex-1 flex flex-col h-full">
            {/* Header with search */}
            <SearchHeader
              viewportIndex={viewportIndex}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Main content - data items list */}
            <ScrollArea className="flex-1 pl-6 pr-6 pt-4 pb-4 bg-background dark:bg-slate-950">
              <DataItemsList
                items={filteredItems}
                currentData={currentData}
                selectedData={selectedData}
                onSelectData={(type, label) => setSelectedData({ type, label })}
              />
            </ScrollArea>

            {/* Footer with action buttons */}
            <DialogActionFooter
              isApplying={isApplying}
              onCancel={() => onOpenChange(false)}
              onApply={handleApply}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
