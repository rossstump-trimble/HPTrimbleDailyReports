"use client";
import { useAssistant } from "@/contexts/AssistantContext";
import AssistantPanel from "@/components/AssistantPanel";

import React from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAssistantOpen, isExpanded } = useAssistant();
  const assistantWidth = isAssistantOpen ? (isExpanded ? 600 : 400) : 0;

  return (
    <>
      <div
        className="app-shell"
        style={{
          width: assistantWidth ? `calc(100vw - ${assistantWidth}px)` : "100vw",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <AssistantPanel />
    </>
  );
}
