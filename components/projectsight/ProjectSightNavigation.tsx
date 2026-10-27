"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { getSortedNavigationData, MenuItem } from "@/lib/projectsight/navigationData";
import {
  ACTIVE_PROJECT_EVENT,
  extractProjectIdFromPath,
  getDefaultProjectId,
  getLastSelectedProjectId,
  resolveActiveProjectId,
  setLastSelectedProjectId,
} from "@/lib/active-project";

interface ProjectSightNavigationProps {
  isExpanded: boolean;
  className?: string;
}

function isItemActive(pathname: string, item: MenuItem): boolean {
  if (item.path === "/projects") {
    return pathname === "/projects";
  }
  if (item.id === "inspections" && (pathname.includes("/checklists") || pathname.includes("/inspections"))) {
    return true;
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

export default function ProjectSightNavigation({
  isExpanded: isNavExpanded,
  className,
}: ProjectSightNavigationProps) {
  const pathname = usePathname();
  const pathProjectId = extractProjectIdFromPath(pathname);

  const [lastProjectId, setLastProjectIdState] = useState<string | null>(null);
  const [defaultProjectId, setDefaultProjectIdState] = useState<string | null>(null);

  useEffect(() => {
    setLastProjectIdState(getLastSelectedProjectId());
    setDefaultProjectIdState(getDefaultProjectId());

    const handleSync = () => {
      setLastProjectIdState(getLastSelectedProjectId());
      setDefaultProjectIdState(getDefaultProjectId());
    };

    window.addEventListener(ACTIVE_PROJECT_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(ACTIVE_PROJECT_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  useEffect(() => {
    if (pathProjectId) {
      setLastProjectIdState(pathProjectId);
      setLastSelectedProjectId(pathProjectId);
    }
  }, [pathProjectId]);

  const activeProjectId = resolveActiveProjectId({
    pathname,
    lastProjectId,
    defaultProjectId,
    fallback: "1025",
  });

  const menuItems = getSortedNavigationData(activeProjectId);

  const renderMenuItem = (item: MenuItem) => {
    const isActive = isItemActive(pathname, item);
    const Icon = item.icon;

    return (
      <div key={item.id}>
        <Link
          href={item.path}
          target={item.target}
          className={cn(
            "flex items-center px-4 py-2 text-sm transition-colors duration-200",
            "hover:bg-accent rounded-l-xl ml-2",
            isActive
              ? "bg-[#ccebfb] dark:bg-[#004066] text-foreground font-medium"
              : "text-foreground"
          )}
        >
          {Icon ? <Icon className="h-4 w-4 min-w-4" /> : null}
          {isNavExpanded && <span className="ml-2">{item.name}</span>}
        </Link>
      </div>
    );
  };

  return (
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
            {menuItems.map((item) => renderMenuItem(item))}
          </div>
        </div>
      </ScrollArea>
    </nav>
  );
}
