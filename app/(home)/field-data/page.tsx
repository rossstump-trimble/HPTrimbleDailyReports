"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FieldDataTreeView from "@/components/projectsight/FieldDataTreeView";
import FieldDataPhotoGrid from "@/components/projectsight/FieldDataPhotoGrid";
import FieldDataDrawingGrid from "@/components/projectsight/FieldDataDrawingGrid";

export default function FieldDataPage() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const [selectedNode, setSelectedNode] = useState<string>(
    section === "site-captures" ? "Site Captures" : "Photos"
  );
  const [activeView, setActiveView] = useState<"photos" | "drawings">("photos");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useEffect(() => {
    if (section === "site-captures") {
      setSelectedNode("Site Captures");
    }
  }, [section]);

  const handleNodeSelect = (id: string, type: "photos" | "drawings") => {
    setSelectedNode(id);
    setActiveView(type);
  };

  const handleToggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="flex h-full">
      <FieldDataTreeView
        onSelectNode={handleNodeSelect}
        isVisible={isSidebarVisible}
        defaultSelectedNode={selectedNode}
      />
      {activeView === "photos" && (
        <FieldDataPhotoGrid
          selectedNode={selectedNode}
          isSidebarVisible={isSidebarVisible}
          onToggleSidebar={handleToggleSidebar}
        />
      )}
      {activeView === "drawings" && (
        <FieldDataDrawingGrid
          selectedNode={selectedNode}
          isSidebarVisible={isSidebarVisible}
          onToggleSidebar={handleToggleSidebar}
        />
      )}
    </div>
  );
}
