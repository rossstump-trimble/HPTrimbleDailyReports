"use client";
import React, { useState } from "react";
import ProjectSightNavigation from "@/components/projectsight/ProjectSightNavigation";
import ProjectSightHeaderHome from "@/components/projectsight/ProjectSightHeaderHome";

export default function PotentialChangeOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavExpanded, setIsNavExpanded] = useState(true);

  const handleNavToggle = () => {
    setIsNavExpanded(!isNavExpanded);
  };

  return (
    <div className="h-screen bg-background">
      <ProjectSightHeaderHome 
        isNavExpanded={isNavExpanded} 
        onNavToggle={handleNavToggle} 
      />
      <div className="flex h-[calc(100vh-60px)]">
        <ProjectSightNavigation isExpanded={isNavExpanded} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
