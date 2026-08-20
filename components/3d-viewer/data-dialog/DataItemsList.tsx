import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Database } from "lucide-react";
import { DataItem } from "./types";
import { DataItemCard } from "./DataItemCard";
import { ViewportDataType } from "../GeospatialViewport";

interface DataItemsListProps {
  items: DataItem[];
  currentData: {
    type: ViewportDataType;
    label: string;
    id?: string;
  };
  selectedData: {
    type: ViewportDataType;
    label: string;
  } | null;
  onSelectData: (type: ViewportDataType, label: string) => void;
}

/**
 * Component that displays a list of data items in the dialog
 */
export function DataItemsList({
  items,
  currentData,
  selectedData,
  onSelectData,
}: DataItemsListProps) {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Database className="mx-auto h-12 w-12 mb-3 opacity-30" />
        <p>No data sources found</p>
        <p className="text-sm">Try a different search or category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => (
        <DataItemCard
          key={item.id}
          item={item}
          isSelected={
            selectedData?.type === item.type &&
            selectedData?.label === item.label
          }
          isCurrent={
            currentData.type === item.type && currentData.label === item.label
          }
          isHovered={hoveredItemId === item.id}
          onMouseEnter={() => setHoveredItemId(item.id)}
          onMouseLeave={() => setHoveredItemId(null)}
          onClick={() => onSelectData(item.type, item.label)}
        />
      ))}
    </div>
  );
}
