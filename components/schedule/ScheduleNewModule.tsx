"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { MemoryRouter } from "react-router-dom";
import { ProjectContextProvider } from "@/contexts/ProjectContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "sonner";
import Schedule from "@/app/schedule/Schedule";
import ScheduleListView from "@/app/schedule/ScheduleListView";
import ScheduleCalendarView from "@/app/schedule/ScheduleCalendarView";
import Lookahead from "@/app/schedule/Lookahead";
import { ScheduleToolbar } from "@/components/schedule/ScheduleToolbar";
import { ScheduleFilterPanelProvider, ScheduleFilterPanelInner } from "@/components/schedule/ScheduleFilterPanel";

const ToolbarPortalContext = createContext<HTMLDivElement | null>(null);
const SidebarPortalContext = createContext<HTMLDivElement | null>(null);
const ActiveTabContext = createContext<{ activeTab: string; setActiveTab: (tab: string) => void } | null>(null);

export function useToolbarPortalRef() {
  return useContext(ToolbarPortalContext);
}

export function useSidebarPortalRef() {
  return useContext(SidebarPortalContext);
}

export function useActiveTab() {
  return useContext(ActiveTabContext);
}

export default function ScheduleNewModule() {
  const [activeTab, setActiveTab] = useState("gantt");
  const [toolbarNode, setToolbarNode] = useState<HTMLDivElement | null>(null);
  const [sidebarNode, setSidebarNode] = useState<HTMLDivElement | null>(null);

  const toolbarCallbackRef = useCallback((node: HTMLDivElement | null) => {
    setToolbarNode(node);
  }, []);

  const sidebarCallbackRef = useCallback((node: HTMLDivElement | null) => {
    setSidebarNode(node);
  }, []);

  const activeTabValue = { activeTab, setActiveTab };

  return (
    <MemoryRouter>
      <ProjectContextProvider>
        <ScheduleFilterPanelProvider>
        <ToolbarPortalContext.Provider value={toolbarNode}>
        <SidebarPortalContext.Provider value={sidebarNode}>
        <ActiveTabContext.Provider value={activeTabValue}>
          <div className="flex h-full">
            <ScheduleFilterPanelInner />
            <div className="flex-1 min-w-0 p-4 space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="gantt">Gantt</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="lookahead">Lookahead</TabsTrigger>
                  </TabsList>
                  <div ref={toolbarCallbackRef} className="flex gap-2 items-center pr-2" />
                </div>
                <TabsContent value="gantt">
                  <Schedule />
                </TabsContent>
                <TabsContent value="list">
                  <ScheduleToolbar onSwitchToGantt={() => setActiveTab("gantt")}>
                    <ScheduleListView />
                  </ScheduleToolbar>
                </TabsContent>
                <TabsContent value="calendar">
                  <ScheduleToolbar onSwitchToGantt={() => setActiveTab("gantt")}>
                    <ScheduleCalendarView />
                  </ScheduleToolbar>
                </TabsContent>
                <TabsContent value="lookahead">
                  <Lookahead />
                </TabsContent>
              </Tabs>
            </div>
            <div className="w-px self-stretch bg-muted-foreground/20 shrink-0" />
            <div ref={sidebarCallbackRef} className="shrink-0 flex" />
          </div>
          <Toaster position="bottom-right" />
        </ActiveTabContext.Provider>
        </SidebarPortalContext.Provider>
        </ToolbarPortalContext.Provider>
        </ScheduleFilterPanelProvider>
      </ProjectContextProvider>
    </MemoryRouter>
  );
}
