import { ViewportDataType } from "../GeospatialViewport";

// Define the category type
export type DataCategory = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Define a data item type
export type DataItem = {
  id: string;
  type: ViewportDataType;
  label: string;
  description: string;
  fileSize?: string;
  lastModified?: string;
};

// Props for the main dialog component
export interface ViewportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewportIndex: number;
  currentData: {
    type: ViewportDataType;
    label: string;
    id?: string;
  };
  onSelectData: (
    viewportIndex: number,
    dataType: ViewportDataType,
    dataLabel: string,
    dataId?: string
  ) => void;
}
