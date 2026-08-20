"use client";
import React from "react";
import { usePathname } from "next/navigation";
import ProjectSightHeaderHome from "@/components/projectsight/ProjectSightHeaderHome";
import ProjectSightNavigation from "@/components/projectsight/ProjectSightNavigation";
import MyProjectsSidebar from "@/components/projectsight/MyProjectsSidebar";

import PageWrapper from "@/components/PageWrapper";
import { cn } from "@/lib/utils";
import { useAssistant } from "@/contexts/AssistantContext";

const DEFAULT_WIDTH = 400; // px
const EXPANDED_WIDTH = 600; // px

export default function ProjectSightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isNavExpanded, setIsNavExpanded] = React.useState(false);
  const { isAssistantOpen, isExpanded } = useAssistant();
  const assistantWidth = isAssistantOpen
    ? isExpanded
      ? EXPANDED_WIDTH
      : DEFAULT_WIDTH
    : 0;

  const isMyProjectsPage = pathname === "/";

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
        {isMyProjectsPage ? (
          <MyProjectsSidebar
            isExpanded={isNavExpanded}
            className="flex-none"
          />
        ) : (
          <ProjectSightNavigation
            isExpanded={isNavExpanded}
            className="flex-none"
          />
        )}
        <main
          className={cn(
            "flex-1 bg-secondary overflow-y-auto w-full transition-all duration-300 ease-in-out"
          )}
        >
          {children}
        </main>
      </div>
    </PageWrapper>
  );
}
