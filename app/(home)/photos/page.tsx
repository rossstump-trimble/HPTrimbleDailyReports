"use client";

import { useState } from "react";
import PhotosDataTreeView from "@/components/projectsight/PhotosDataTreeView";
import PhotosDataPhotoGrid from "@/components/projectsight/PhotosDataPhotoGrid";

export default function PhotosPage() {
  const [selectedNode, setSelectedNode] = useState<string>("library");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const handleSelectNode = (id: string) => {
    setSelectedNode(id);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="flex h-full">
      <PhotosDataTreeView
        onSelectNode={handleSelectNode}
        isVisible={isSidebarVisible}
      />
      <PhotosDataPhotoGrid
        selectedNode={selectedNode}
        isSidebarVisible={isSidebarVisible}
        onToggleSidebar={toggleSidebar}
      />
    </div>
  );
}
