"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, Plus, UserCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen } from "lucide-react";
import { MOCK_PROJECTS, MOCK_PORTFOLIOS } from "@/lib/projectsight/myProjectsData";

interface MyProjectsSidebarProps {
  isExpanded: boolean;
  className?: string;
}

export default function MyProjectsSidebar({
  isExpanded,
  className,
}: MyProjectsSidebarProps) {
  const pathname = usePathname();
  const [portfoliosExpanded, setPortfoliosExpanded] = useState(false);
  const isMyProjectsPage = pathname === "/";

  return (
    <nav
      className={cn(
        "bg-background border-r border-border h-full overflow-y-auto transition-all duration-300 flex flex-col",
        isExpanded ? "w-60" : "w-16",
        className
      )}
    >
      <ScrollArea className="h-full flex-1">
        <div className="py-2 flex flex-col h-full">
          <div
            className={cn(
              "px-4 py-2 text-sm font-medium text-muted-foreground",
              !isExpanded && "hidden"
            )}
          >
            Project Menu
          </div>

          <div className="space-y-0.5 flex-1">
            {/* Projects (4) - active on My Projects page */}
            <Link
              href="/"
              className={cn(
                "flex items-center px-4 py-2 text-sm transition-colors duration-200 hover:bg-accent rounded-l-xl ml-2",
                isMyProjectsPage
                  ? "bg-[#ccebfb] dark:bg-[#004066] text-foreground font-medium"
                  : "text-foreground"
              )}
            >
              <FolderOpen className="h-4 w-4 min-w-4 shrink-0" />
              {isExpanded && (
                <>
                  <span className="ml-2 flex-1">Projects ({MOCK_PROJECTS.length})</span>
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                </>
              )}
            </Link>

            {/* Portfolios - expandable, one portfolio for now */}
            <div>
              <button
                type="button"
                onClick={() => setPortfoliosExpanded((p) => !p)}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm transition-colors duration-200 hover:bg-accent rounded-l-xl ml-2 text-foreground"
                )}
              >
                <FolderOpen className="h-4 w-4 min-w-4 shrink-0" />
                {isExpanded && (
                  <>
                    <span className="ml-2 flex-1 text-left">
                      Portfolios ({MOCK_PORTFOLIOS.length})
                    </span>
                    <Plus className="h-4 w-4 shrink-0 mr-1" aria-hidden />
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        portfoliosExpanded && "rotate-90"
                      )}
                      aria-hidden
                    />
                  </>
                )}
              </button>
              {isExpanded && portfoliosExpanded && (
                <div className="mt-0.5 ml-6 pl-2 border-l border-border space-y-0.5">
                  {MOCK_PORTFOLIOS.map((portfolio) => (
                    <Link
                      key={portfolio.id}
                      href="/"
                      className="flex items-center px-3 py-1.5 text-sm text-foreground hover:bg-accent/50 rounded-md"
                    >
                      {portfolio.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Walkthrough - bottom */}
          <div className={cn("pt-4 pb-2 border-t mt-auto", !isExpanded && "hidden")}>
            <Link
              href="#"
              className="flex items-center px-6 py-2 text-sm text-foreground hover:bg-accent/50 rounded-l-xl"
            >
              <UserCircle className="h-4 w-4 mr-2 shrink-0" />
              <span>Walkthrough</span>
            </Link>
          </div>
        </div>
      </ScrollArea>
    </nav>
  );
}
