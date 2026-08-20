"use client";
import React, { useState } from "react";
import ProjectSightNavigation from "@/components/projectsight/ProjectSightNavigation";
import ProjectSightHeaderHome from "@/components/projectsight/ProjectSightHeaderHome";

export default function RFIsLayout({
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
      {/* Full-width header that spans above everything */}
      <ProjectSightHeaderHome 
        isNavExpanded={isNavExpanded} 
        onNavToggle={handleNavToggle} 
      />
      
      {/* Main content area with navigation and page content */}
      <div className="flex h-[calc(100vh-60px)]">
        <ProjectSightNavigation isExpanded={isNavExpanded} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
