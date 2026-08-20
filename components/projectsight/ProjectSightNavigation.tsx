"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { ChevronRight, ChevronDown, ArrowLeft, PlusCircle } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import {
  getNavigationByConfig,
  MenuItem,
} from "@/lib/projectsight/navigationData";
import { Button } from "../ui/button";
import { PSIntegrations } from "./PSIntegrations";
import { useUIConfig } from "@/hooks/useUIConfig";

interface ProjectSightNavigationProps {
  isExpanded: boolean;
  className?: string;
}

export default function ProjectSightNavigation({
  isExpanded: isNavExpanded,
  className,
}: ProjectSightNavigationProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [showAllRecords, setShowAllRecords] = React.useState(false);
  const [showAllFinancials, setShowAllFinancials] = React.useState(false);
  const [integrationsDialogOpen, setIntegrationsDialogOpen] = useState(false);
  const { config } = useUIConfig();

  React.useEffect(() => {
    if (pathname === "/rfis" && !expandedItems.includes("Records")) {
      setExpandedItems(prev => [...prev, "Records"]);
    }
    if (pathname === "/potential-change-orders" && !expandedItems.includes("Financials")) {
      setExpandedItems(prev => [...prev, "Financials"]);
    }
  }, [pathname, expandedItems]);

  // Get navigation items based on config
  const menuItems = React.useMemo(
    () =>
      getNavigationByConfig(
        !!config.showUpdatedNavigation,
        !!config.showIntegrations
      ),
    [config.showUpdatedNavigation, config.showIntegrations]
  );

  // Using ref to track hovering state for each menu item
  const hoveringItems = React.useRef(new Set<string>());

  const toggleSubmenu = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((item) => item !== itemName)
        : [...prev, itemName]
    );
  };

  const renderMenuItem = (item: MenuItem, isSubItem = false) => {
    const isActive = pathname === item.path;
    const isRecords = item.id === "records";
    const isFinancials = item.id === "financials";
    const isHovering = hoveringItems.current.has(item.id);

    const handleMouseEnter = () => {
      hoveringItems.current.add(item.id);
      // Force re-render
      setExpandedItems([...expandedItems]);
    };

    const handleMouseLeave = () => {
      hoveringItems.current.delete(item.id);
      // Force re-render
      setExpandedItems([...expandedItems]);
    };

    let subItems = item.subItems;
    if (isRecords && !showAllRecords && subItems) {
      subItems = subItems.slice(0, 5);
    } else if (isFinancials && !showAllFinancials && subItems) {
      subItems = subItems.slice(0, 5);
    }

    return (
      <div key={item.id}>
        <Link
          href={item.path}
          target={item.target}
          className={cn(
            "flex items-center px-4 py-2 text-sm transition-colors duration-200",
            "hover:bg-accent rounded-l-xl",
            isActive
              ? "bg-[#ccebfb] dark:bg-[#004066] text-foreground font-medium"
              : "text-foreground",
            isSubItem ? "ml-8" : "ml-2"
          )}
          onClick={(e) => {
            if (item.hasSubmenu) {
              e.preventDefault();
              toggleSubmenu(item.name);
            }
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {item.icon ? (
            <item.icon className="h-4 w-4 min-w-4" />
          ) : item.icon2 ? (
            <div className="h-4 w-4 min-w-4 flex items-center justify-center">
              {typeof item.icon2 === "function"
                ? React.createElement(item.icon2)
                : item.icon2}
            </div>
          ) : null}
          {isNavExpanded && (
            <>
              <span className="ml-2">{item.name}</span>
              {item.id === "integrations" && isHovering && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0.5 ml-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIntegrationsDialogOpen(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              )}
              {item.hasSubmenu && (
                <ChevronRight
                  className={cn(
                    item.id === "integrations" && isHovering
                      ? "ml-1 h-4 w-4"
                      : "ml-auto h-4 w-4",
                    "transition-transform",
                    expandedItems.includes(item.name) && "transform rotate-90"
                  )}
                />
              )}
            </>
          )}
        </Link>
        {subItems && expandedItems.includes(item.name) && isNavExpanded && (
          <div className="mt-1">
            {subItems.map((subItem) => renderMenuItem(subItem, true))}
            {((isRecords && !showAllRecords) ||
              (isFinancials && !showAllFinancials)) && (
              <button
                onClick={() => {
                  if (isRecords) setShowAllRecords(true);
                  if (isFinancials) setShowAllFinancials(true);
                }}
                className="flex items-center px-4 py-2 text-sm text-primary hover:bg-accent/50 rounded-l-xl mx-2 ml-8"
              >
                <span className="mr-2">Less</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <nav
        className={cn(
          "bg-background border-r border-border h-full overflow-y-auto transition-all duration-300",
          isNavExpanded ? "w-60" : "w-16",
          className
        )}
      >
        <ScrollArea className="h-full">
          <div className="py-2 flex flex-col h-full">
            <div
              className={cn(
                "px-4 py-2 text-sm font-medium text-muted-foreground",
                !isNavExpanded && "hidden"
              )}
            >
              Project Menu
            </div>
            <div className="space-y-1 flex-1">
              {menuItems.map((item) => renderMenuItem(item, false))}
            </div>
          </div>
          <div className={cn("pt-4 pb-2 border-t", !isNavExpanded && "hidden")}>
            <Link
              href="/"
              className="flex items-center px-6 py-2 text-sm text-foreground hover:bg-accent/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isNavExpanded && <span>My Projects</span>}
            </Link>
          </div>
        </ScrollArea>
      </nav>
      <PSIntegrations
        open={integrationsDialogOpen}
        onOpenChange={setIntegrationsDialogOpen}
        onSelectIntegration={(category, integration, id) => {
          console.log(`Selected ${integration} (${id}) from ${category}`);
        }}
      />
    </>
  );
}
