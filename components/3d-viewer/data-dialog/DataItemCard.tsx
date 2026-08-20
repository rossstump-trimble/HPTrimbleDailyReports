import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import {
  Building2,
  Map,
  Layers,
  Grid3X3,
  LineChart,
  Mountain,
  Globe,
  ImageIcon,
  Camera,
} from "lucide-react";
import { DataItem } from "./types";
import { ViewportDataType } from "../GeospatialViewport";

interface DataItemCardProps {
  item: DataItem;
  isSelected: boolean;
  isCurrent: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

/**
 * A card component for displaying a data item in the ViewportDataDialog
 */
export function DataItemCard({
  item,
  isSelected,
  isCurrent,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: DataItemCardProps) {
  // Get the appropriate icon for the data type
  const getTypeIcon = (type: ViewportDataType) => {
    switch (type) {
      case "ifc-model":
      case "buildings":
      case "3dmodel":
        return (
          <Building2 className="h-5 w-5 text-primary dark:text-blue-400" />
        );
      case "2d-map":
        return <Map className="h-5 w-5 text-primary dark:text-blue-400" />;
      case "vector-data":
        return <Layers className="h-5 w-5 text-primary dark:text-blue-400" />;
      case "pointcloud":
        return <Grid3X3 className="h-5 w-5 text-primary dark:text-blue-400" />;
      case "alignment":
        return (
          <LineChart className="h-5 w-5 text-primary dark:text-blue-400" />
        );
      case "terrain":
        return <Mountain className="h-5 w-5 text-primary dark:text-blue-400" />;
      case "gis-data":
        return <Globe className="h-5 w-5 text-primary dark:text-blue-400" />;
      case "imagery":
        return (
          <ImageIcon className="h-5 w-5 text-primary dark:text-blue-400" />
        );
      case "360s":
        return <Camera className="h-5 w-5 text-primary dark:text-blue-400" />;
      default:
        return <Layers className="h-5 w-5 text-primary dark:text-blue-400" />;
    }
  };

  return (
    <div
      className={cn(
        "border rounded-md p-4 cursor-pointer transition-colors",
        // Highlight if selected
        isSelected
          ? "border-primary bg-primary/10 dark:bg-blue-900/30 dark:border-blue-600"
          : // Or if it's the current data in the viewport
          isCurrent
          ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700"
          : // Default hover state
            "hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:hover:bg-slate-800/60 dark:hover:border-slate-600",
        isHovered && "border-primary dark:border-blue-500"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-primary/10 dark:bg-slate-800 p-2">
          {getTypeIcon(item.type)}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium">{item.label}</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {item.description}
          </p>

          {(item.fileSize || item.lastModified) && (
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {item.fileSize && <span>{item.fileSize}</span>}
              {item.lastModified && <span>Modified: {item.lastModified}</span>}
            </div>
          )}
        </div>

        {isSelected ? (
          <span className="flex items-center text-primary dark:text-blue-400 text-xs gap-1">
            <Check className="h-4 w-4" />
            Selected
          </span>
        ) : isCurrent ? (
          <span className="text-green-600 dark:text-green-400 text-xs">
            Current
          </span>
        ) : null}
      </div>
    </div>
  );
}
