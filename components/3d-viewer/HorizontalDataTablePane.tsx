"use client";
import { Button } from "@/components/ui/button";
import {
  X,
  Search,
  Save,
  Maximize2,
  MoreVertical,
  ChevronDown,
  LayoutGrid,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HorizontalDataTablePaneProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HorizontalDataTablePane({
  isOpen,
  onClose,
}: HorizontalDataTablePaneProps) {
  // Animation class for sliding in/out
  const animationClass = isOpen
    ? "translate-y-0 opacity-100"
    : "translate-y-full opacity-0";

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background dark:bg-gray-950 border-t border-border dark:border-gray-800 z-[1100] transition-all duration-300 ease-in-out transform",
        animationClass,
        // Adjust height based on viewport height, but leave space for top elements
        "h-[40vh]"
      )}
    >
      {/* Header with toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border dark:border-gray-800">
        <div className="flex-shrink-0">
          <h2 className="text-lg font-medium text-foreground">Data Table</h2>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-2 flex-grow justify-end">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Search data..."
              type="search"
            />
          </div>

          {/* Columns Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="id-col" defaultChecked />
                  <label htmlFor="id-col">ID</label>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="name-col" defaultChecked />
                  <label htmlFor="name-col">Name</label>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="type-col" defaultChecked />
                  <label htmlFor="type-col">Type</label>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="coord-col" defaultChecked />
                  <label htmlFor="coord-col">Coordinates</label>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save to Organizer */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                <span>Save to Organizer</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Save as new list</DropdownMenuItem>
              <DropdownMenuItem>Add to existing list</DropdownMenuItem>
              <DropdownMenuItem>Export to CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen Button */}
          <Button variant="ghost" size="sm" title="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" title="More options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem>Print Table</DropdownMenuItem>
              <DropdownMenuItem>Clear Filters</DropdownMenuItem>
              <DropdownMenuItem>Reset Columns</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close Button */}
          <Button variant="ghost" size="sm" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-57px)] overflow-y-auto">
        <div className="p-4">
          {/* Example table structure */}
          <div className="border rounded-md">
            <table className="w-full">
              <thead className="bg-muted dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-sm">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-sm">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-sm">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-sm">
                    Coordinates
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-sm">
                    Elevation
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-sm">
                    Date Added
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-sm">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Sample data rows */}
                {Array.from({ length: 10 }).map((_, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-950"
                        : "bg-muted/30 dark:bg-gray-900/50"
                    }
                  >
                    <td className="px-4 py-2 text-sm">{`PT-${
                      1000 + index
                    }`}</td>
                    <td className="px-4 py-2 text-sm">{`Point ${
                      index + 1
                    }`}</td>
                    <td className="px-4 py-2 text-sm">
                      {["Marker", "Sensor", "Building", "POI"][index % 4]}
                    </td>
                    <td className="px-4 py-2 text-sm">{`${(
                      34.052 +
                      index * 0.001
                    ).toFixed(6)}, ${(118.243 + index * 0.001).toFixed(
                      6
                    )}`}</td>
                    <td className="px-4 py-2 text-sm">{`${(
                      100 +
                      index * 5
                    ).toFixed(1)} m`}</td>
                    <td className="px-4 py-2 text-sm">{`2023-${
                      (index % 12) + 1 < 10 ? "0" : ""
                    }${(index % 12) + 1}-${index + 1 < 10 ? "0" : ""}${
                      index + 1
                    }`}</td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          index % 3 === 0
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : index % 3 === 1
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {index % 3 === 0
                          ? "Active"
                          : index % 3 === 1
                          ? "Pending"
                          : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
