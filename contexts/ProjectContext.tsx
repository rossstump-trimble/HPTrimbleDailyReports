"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";

const MOCK_PROJECT_ID = "mock-project-001";

interface ProjectContextType {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  activeProjectId: MOCK_PROJECT_ID,
  setActiveProjectId: () => {},
});

export function ProjectContextProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(MOCK_PROJECT_ID);
  return (
    <ProjectContext.Provider value={{ activeProjectId, setActiveProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  return useContext(ProjectContext);
}
