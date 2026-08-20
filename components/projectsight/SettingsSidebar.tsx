"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsNavItem {
  id: string;
  name: string;
  path: string;
  enabled?: boolean;
}

interface SettingsNavSection {
  id: string;
  title: string;
  items: SettingsNavItem[];
}

const settingsSections: SettingsNavSection[] = [
  {
    id: "portfolio",
    title: "Portfolio settings",
    items: [
      { id: "users", name: "Users", path: "/settings/users" },
      { id: "security-roles", name: "Security roles", path: "/settings/security-roles" },
      { id: "portfolio-general", name: "General", path: "/settings/general" },
      { id: "portfolio-records", name: "Records", path: "/settings/records", enabled: true },
      { id: "portfolio-reports", name: "Reports", path: "/settings/reports" },
      { id: "lookup-lists", name: "Lookup lists", path: "/settings/lookup-lists" },
      { id: "companies", name: "Companies", path: "/settings/companies", enabled: true },
      { id: "portfolio-spec-sections", name: "Spec sections", path: "/settings/spec-sections" },
      { id: "portfolio-financials", name: "Financials", path: "/settings/financials" },
      { id: "distribution-lists", name: "Distribution lists", path: "/settings/distribution-lists" },
      { id: "external-links", name: "External links", path: "/settings/external-links" },
      { id: "project-export", name: "Project export", path: "/settings/project-export" },
    ],
  },
  {
    id: "project",
    title: "Project settings",
    items: [
      { id: "project-general", name: "General", path: "/settings/project/general" },
      { id: "team-members", name: "Team members", path: "/settings/project/team-members" },
      { id: "project-records", name: "Records", path: "/settings/project/records" },
      { id: "project-reports", name: "Reports", path: "/settings/project/reports" },
      { id: "project-lookup-lists", name: "Lookup lists", path: "/settings/project/lookup-lists" },
      { id: "project-companies", name: "Companies", path: "/settings/project/companies" },
      { id: "locations", name: "Locations", path: "/settings/project/locations" },
      { id: "project-spec-sections", name: "Spec sections", path: "/settings/project/spec-sections" },
      { id: "project-financials", name: "Financials", path: "/settings/project/financials" },
      { id: "project-distribution-lists", name: "Distribution lists", path: "/settings/project/distribution-lists" },
      { id: "project-external-links", name: "External links", path: "/settings/project/external-links" },
    ],
  },
];

interface SettingsSidebarProps {
  className?: string;
}

export default function SettingsSidebar({ className }: SettingsSidebarProps) {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = React.useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <nav
      className={cn(
        "bg-background border-r border-border h-full w-52 flex flex-col",
        className
      )}
    >
      <ScrollArea className="flex-1">
        <div className="py-2">
          {settingsSections.map((section) => {
            const isCollapsed = collapsedSections.includes(section.id);
            return (
              <div key={section.id} className="mb-1">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center w-full px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-accent/50"
                >
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 mr-1.5 transition-transform",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                  {section.title}
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.path ||
                        (item.path !== "/" && pathname?.startsWith(item.path + "/"));
                      if (!item.enabled) {
                        return (
                          <span
                            key={item.id}
                            className="block px-6 py-1.5 text-sm text-muted-foreground/50 cursor-default"
                          >
                            {item.name}
                          </span>
                        );
                      }
                      return (
                        <Link
                          key={item.id}
                          href={item.path}
                          className={cn(
                            "block px-6 py-1.5 text-sm transition-colors",
                            isActive
                              ? "text-primary font-medium border-l-2 border-primary bg-primary/5"
                              : "text-foreground hover:bg-accent/50"
                          )}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-2">
        <Link
          href="/dashboard"
          className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent/50 rounded"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back</span>
        </Link>
      </div>
    </nav>
  );
}
