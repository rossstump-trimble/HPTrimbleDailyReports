import { useState } from "react";

interface TableStateOptions<T> {
  data: T[];
  getItemId: (item: T) => string;
  onRowClick?: (id: string, e: React.MouseEvent) => void;
}

export function useTableState<T>({
  data,
  getItemId,
  onRowClick,
}: TableStateOptions<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });

  const handleCheckboxChange = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === data.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(data.map((item) => getItemId(item)));
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return {
    selectedItems,
    setSelectedItems,
    hoveredItem,
    setHoveredItem,
    sortConfig,
    handleCheckboxChange,
    handleSelectAll,
    handleSort,
  };
}
