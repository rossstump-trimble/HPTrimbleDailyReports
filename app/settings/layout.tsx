"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import ProjectSightHeaderHome from "@/components/projectsight/ProjectSightHeaderHome";
import SettingsSidebar from "@/components/projectsight/SettingsSidebar";

const ROUTES_WITH_OWN_SIDEBAR = ["/settings/records/"];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const pathname = usePathname();

  const hasOwnSidebar = ROUTES_WITH_OWN_SIDEBAR.some(
    (prefix) => pathname?.startsWith(prefix)
  );
  const showSettingsSidebar = isNavExpanded && !hasOwnSidebar;

  return (
    <div className="h-screen bg-background flex flex-col">
      <ProjectSightHeaderHome
        isNavExpanded={isNavExpanded}
        onNavToggle={() => setIsNavExpanded((prev) => !prev)}
      />
      <div className="flex flex-1 overflow-hidden">
        {showSettingsSidebar && <SettingsSidebar className="flex-none" />}
        <main className="flex-1 overflow-hidden bg-secondary">
          {children}
        </main>
      </div>
    </div>
  );
}
