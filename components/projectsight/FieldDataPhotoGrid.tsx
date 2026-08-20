"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Upload,
  MoreVertical,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Sample photo data using 360 images
const photos = [
  {
    id: 1,
    filename: "360s/360_a.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 2,
    filename: "360s/360_b.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 3,
    filename: "360s/360_a.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 4,
    filename: "360s/360_b.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 5,
    filename: "360s/360_a.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 6,
    filename: "360s/360_b.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 7,
    filename: "360s/360_a.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 8,
    filename: "360s/360_b.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 9,
    filename: "360s/360_a.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 10,
    filename: "360s/360_b.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 11,
    filename: "360s/360_a.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
  {
    id: 12,
    filename: "360s/360_b.jpg",
    date: "March 5, 2025",
    time: "10:25 AM",
  },
];

interface PhotosDataPhotoGridProps {
  selectedNode?: string;
  isSidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

export default function PhotosDataPhotoGrid({
  selectedNode,
  isSidebarVisible = true,
  onToggleSidebar,
}: PhotosDataPhotoGridProps) {
  const [selectedView, setSelectedView] = useState<string>("week");
  const [selectedDate, setSelectedDate] = useState<string>(
    "Mar 01, 2025 - Mar 07, 2025"
  );
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode on component mount and when theme changes
  useEffect(() => {
    // Check if document has .dark class or prefers-color-scheme is dark
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    };

    // Check initially
    checkDarkMode();

    // Set up event listener for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Check for preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => checkDarkMode();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Toolbar */}
      <div className="flex justify-between items-center gap-2 p-2 bg-background sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", !isSidebarVisible && "bg-accent/30")}
          onClick={() => onToggleSidebar && onToggleSidebar()}
        >
          {isSidebarVisible ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Toolbar */}
      <div
        className={cn(
          "flex justify-between items-center p-2 border-y",
          isDarkMode ? "bg-background/80" : "bg-background/20"
        )}
      >
        <div className="flex items-center gap-2">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="bg-primary text-primary-foreground">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Photo Grid */}
      <ScrollArea className="flex-1 p-2">
        <div className="flex items-center ml-2 mt-4 mb-4">
          <Checkbox id="date-range" className="mr-2" />
          <label htmlFor="date-range" className="text-sm">
            {selectedDate}
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-2 ">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-all duration-300",
                isDarkMode ? "border-accent/30" : "border-border"
              )}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={`/${photo.filename}`}
                  alt={photo.filename}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-all hover:scale-105"
                  onError={(e) => {
                    // Fallback image if the actual image is not found
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.srcset = "";
                    imgElement.src = `https://source.unsplash.com/random/300x300/?360-panorama`;
                  }}
                />
              </div>
              <div
                className={cn(
                  "p-2 text-center",
                  isDarkMode ? "bg-card" : "bg-background"
                )}
              >
                <div className="text-xs text-foreground">{photo.date}</div>
                <div className="text-xs text-muted-foreground">
                  {photo.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
