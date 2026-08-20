"use client";
import React from "react";
import ProjectSightHeaderHome from "@/components/projectsight/ProjectSightHeaderHome";
import ProjectSightNavigation from "@/components/projectsight/ProjectSightNavigation";
import PageWrapper from "@/components/PageWrapper";

export default function ProjectSightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavExpanded, setIsNavExpanded] = React.useState(false);

  React.useEffect(() => {
    setIsNavExpanded(true);
  }, []);

  return (
    <PageWrapper className="h-screen flex flex-col overflow-hidden">
      <ProjectSightHeaderHome
        isNavExpanded={isNavExpanded}
        onNavToggle={() => setIsNavExpanded((prev) => !prev)}
        className="flex-none z-50"
      />

      <div className="flex-1 flex overflow-hidden">
        <ProjectSightNavigation
          isExpanded={isNavExpanded}
          className="flex-none"
        />
        <main className="flex-1 bg-secondary overflow-y-auto w-full transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>
    </PageWrapper>
  );
}
