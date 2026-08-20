import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, CircleCheck, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import IconWithHoverSelect from "@/components/IconWithHoverSelect";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { Bot } from "lucide-react";
import { useAssistant } from "@/contexts/AssistantContext";
import {
  fileSpecificExampleQuestions,
  folderSpecificExampleQuestions,
} from "@/components/Assistant";

export const tableStyles = {
  header: cn(
    "bg-[hsl(var(--table-header-bg))] hover:bg-[hsl(var(--table-header-hover-bg))]",
    "border-b-2 border-[hsl(var(--table-border))]"
  ),
  row: cn(
    "cursor-pointer transition-colors bg-background border-t border-[hsl(var(--table-border))]",
    "hover:bg-[hsl(var(--table-row-hover-bg))]"
  ),
  selectedRow: "bg-[hsl(var(--table-selected-bg))]",
  hoveredRow: "bg-[hsl(var(--table-row-hover-bg))]",
  cell: "py-3 align-middle",
  headerCell: cn(
    "py-3 text-trimble-gray dark:text-foreground font-semibold",
    "align-middle"
  ),
  table: "w-full",
  cellContent: "flex items-center",
  actionColumn: "w-[50px] pr-4",
  checkboxColumn: "w-[60px]",
};

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (item: T) => React.ReactNode;
  headerClassName?: string;
  renderHeader?: () => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  selectedItems: string[];
  hoveredItem: string | null;

  getItemId: (item: T) => string;
  onRowClick: (id: string, e: React.MouseEvent) => void;
  onCheckboxChange: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  getItemType: (
    item: T
  ) =>
    | "file"
    | "folder"
    | "view"
    | "releases"
    | "topics"
    | "property"
    | "activity"
    | "blueprint"
    | "geospatial-package"
    | "e57";
  getItemIcon?: (item: T) => string | undefined;
  getCustomIcon?: (item: T) => React.ReactNode;
  dropdownItems?:
    | {
        label: string;
        onClick: (id: string) => void;
      }[]
    | ((id: string) => {
        label: string;
        onClick: (id: string) => void;
      }[])
    | null;
  getAvatar?: (item: T) => string | undefined;
  headerClassName?: string;
  showSelectAll?: boolean;
  sortConfig?: {
    key: string;
    direction: "asc" | "desc";
  };
  onSort?: (key: string) => void;
  onColumnReorder?: (sourceKey: string, targetKey: string) => void;
  className?: string;
  getRowAttributes?: (item: T) => Record<string, string>;
}

interface SortableHeaderCellProps {
  column: Column<any>;
  onSort?: (key: string) => void;
  sortConfig?: {
    key: string;
    direction: "asc" | "desc";
  };
}

function DraggableHeaderCell({
  column,
  onSort,
  sortConfig,
}: SortableHeaderCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        tableStyles.headerCell,
        column.width && `w-[${column.width}]`,
        column.headerClassName,
        column.sortable && "cursor-pointer select-none",
        "relative group"
      )}
      onClick={() => {
        if (column.sortable && onSort) {
          onSort(column.key);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="absolute left-0 -ml-4 cursor-move touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical
            className={cn(
              "h-4 w-4 flex-shrink-0 text-muted-foreground/50 transition-opacity",
              "opacity-0 group-hover:opacity-100"
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          {column.renderHeader ? column.renderHeader() : column.header}
          {column.sortable && sortConfig?.key === column.key && (
            <span className="text-xs">
              {sortConfig.direction === "asc" ? "↑" : "↓"}
            </span>
          )}
        </div>
      </div>
    </TableHead>
  );
}

function StaticHeaderCell({
  column,
  onSort,
  sortConfig,
}: SortableHeaderCellProps) {
  return (
    <TableHead
      className={cn(
        tableStyles.headerCell,
        column.width && `w-[${column.width}]`,
        column.headerClassName,
        column.sortable && "cursor-pointer select-none",
        "relative group"
      )}
      onClick={() => {
        if (column.sortable && onSort) {
          onSort(column.key);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          {column.renderHeader ? column.renderHeader() : column.header}
          {column.sortable && sortConfig?.key === column.key && (
            <span className="text-xs">
              {sortConfig.direction === "asc" ? "↑" : "↓"}
            </span>
          )}
        </div>
      </div>
    </TableHead>
  );
}

export function DataTable<T>({
  data,
  columns,
  selectedItems,
  hoveredItem,
  getItemId,
  onRowClick,
  onCheckboxChange,
  onSelectAll,
  onMouseEnter,
  onMouseLeave,
  getItemType,
  getItemIcon,
  getCustomIcon,
  dropdownItems,
  getAvatar,
  headerClassName,
  showSelectAll = false,
  sortConfig,
  onSort,
  onColumnReorder,
  className,
  getRowAttributes,
}: DataTableProps<T>) {
  const [selectAllHovered, setSelectAllHovered] = useState(false);
  const {
    preloadQuestion,
    toggleAssistant,
    isAssistantOpen,
    setExampleQuestions,
  } = useAssistant();
  const [contextMenuItem, setContextMenuItem] = useState<T | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onColumnReorder) {
      onColumnReorder(active.id.toString(), over.id.toString());
    }
  };

  const allSelected =
    data.length > 0 &&
    data.every((item) => selectedItems.includes(getItemId(item)));

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allSelected) {
      onCheckboxChange(""); // Clear selection
    } else {
      const allIds = data
        .map((item) => getItemId(item))
        .filter((id) => !selectedItems.includes(id));

      if (onSelectAll) {
        onSelectAll(allIds);
      } else {
        allIds.forEach((id) => onCheckboxChange(id));
      }
    }
  };

  // Helper to determine entity type for example questions
  const getEntityType = (item: T) => {
    const type = getItemType(item);
    if (type === "file") return "file";
    if (type === "folder") return "folder";
    return "other";
  };

  // Handle "Tell Me More About This"
  const handleTellMeMore = () => {
    if (!contextMenuItem) return;
    const item = contextMenuItem;
    const entityType = getEntityType(item);
    if (entityType === "file") {
      setExampleQuestions(fileSpecificExampleQuestions);
    } else if (entityType === "folder") {
      setExampleQuestions(folderSpecificExampleQuestions);
    }
    if (!isAssistantOpen) {
      toggleAssistant();
    }
    // Use a string representation for the LLM prompt
    const label = (item as any).name || (item as any).title || "this item";
    preloadQuestion(`Tell me more about ${label}`);
    setContextMenuItem(null);
  };

  const renderHeaders = () => {
    if (onColumnReorder) {
      return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={columns.map((col) => col.key)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <DraggableHeaderCell
                key={column.key}
                column={column}
                onSort={onSort}
                sortConfig={sortConfig}
              />
            ))}
          </SortableContext>
        </DndContext>
      );
    }

    return columns.map((column) => (
      <StaticHeaderCell
        key={column.key}
        column={column}
        onSort={onSort}
        sortConfig={sortConfig}
      />
    ));
  };

  return (
    <div
      className={cn(
        "rounded-lg border shadow-sm overflow-hidden w-full",
        className
      )}
    >
      <Table className={tableStyles.table}>
        <TableHeader>
          <TableRow className={tableStyles.header}>
            <TableHead
              className={cn(tableStyles.checkboxColumn, tableStyles.headerCell)}
            >
              {showSelectAll && (
                <div
                  onMouseEnter={() => setSelectAllHovered(true)}
                  onMouseLeave={() => setSelectAllHovered(false)}
                >
                  <IconWithHoverSelect
                    isSelected={allSelected}
                    isHovered={selectAllHovered}
                    type="file"
                    customIcon={<CircleCheck className="w-5 h-5" />}
                    onClick={handleSelectAll}
                  />
                </div>
              )}
            </TableHead>
            {renderHeaders()}
            {dropdownItems && (
              <TableHead
                className={cn(tableStyles.actionColumn, tableStyles.headerCell)}
              ></TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const id = getItemId(item);
            const isSelected = selectedItems.includes(id);
            const isHovered = hoveredItem === id;

            return (
              <ContextMenu key={id}>
                <ContextMenuTrigger asChild>
                  <TableRow
                    className={cn(
                      tableStyles.row,
                      isHovered && tableStyles.hoveredRow,
                      isSelected && tableStyles.selectedRow,
                      "group"
                    )}
                    onClick={(e) => onRowClick(id, e)}
                    onMouseEnter={() => onMouseEnter(id)}
                    onMouseLeave={onMouseLeave}
                    onContextMenu={() => setContextMenuItem(item)}
                  >
                    <TableCell
                      className={cn(
                        tableStyles.checkboxColumn,
                        tableStyles.cell
                      )}
                    >
                      <IconWithHoverSelect
                        isSelected={selectedItems.includes(id)}
                        isHovered={hoveredItem === id}
                        type={getItemType(item)}
                        icon={getItemIcon?.(item)}
                        customIcon={getCustomIcon?.(item)}
                        avatar={getAvatar?.(item)}
                        onClick={(e) => onCheckboxChange(id)}
                      />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(tableStyles.cell)}
                      >
                        <div className={tableStyles.cellContent}>
                          {column.render
                            ? column.render(item)
                            : (item as any)[column.key]}
                        </div>
                      </TableCell>
                    ))}
                    {dropdownItems && (
                      <TableCell
                        className={cn(
                          tableStyles.cell,
                          tableStyles.actionColumn
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {typeof dropdownItems === "function" &&
                          dropdownItems(getItemId(item)).length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost2"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {dropdownItems(getItemId(item)).map(
                                  (dropdownItem) => (
                                    <DropdownMenuItem
                                      key={dropdownItem.label}
                                      onClick={() =>
                                        dropdownItem.onClick(getItemId(item))
                                      }
                                    >
                                      {dropdownItem.label}
                                    </DropdownMenuItem>
                                  )
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                      </TableCell>
                    )}
                  </TableRow>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={handleTellMeMore}>
                    <Bot className="w-4 h-4 mr-2" /> Tell Me More About This
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
