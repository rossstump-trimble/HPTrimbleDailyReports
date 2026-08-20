"use client";

import { useAssistant } from "@/contexts/AssistantContext";
import Assistant from "@/components/Assistant";
import {
  X,
  Maximize2,
  Minimize2,
  Expand,
  Minimize,
  MessageSquare,
  MessagesSquare,
  MessageCircleHeart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIConfig } from "@/hooks/useUIConfig";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import CollaboratorAssistant from "@/components/CollaboratorAssistant";
import { CollaboratorProvider } from "@/contexts/CollaboratorContext";

const DEFAULT_WIDTH = 400; // px
const EXPANDED_WIDTH = 600; // px
const HEADER_HEIGHT = 60; // px
const FOOTER_HEIGHT = 48; // px
const DETAILS_PANE_WIDTH = 300; // px

export default function AssistantPanel() {
  const {
    isAssistantOpen,
    toggleAssistant,
    isExpanded,
    toggleExpanded,
    isCentered,
    toggleCentered,
    exampleQuestions,
    mode,
    setMode,
    toggleMode,
  } = useAssistant();
  const { config, isLoaded } = useUIConfig();
  const pathname = usePathname();

  if (!isAssistantOpen) return null;

  // Calculate dynamic height based on the current route
  const isExplorerPage =
    pathname.startsWith("/explorer") ||
    pathname.startsWith("/ifcs") ||
    pathname.startsWith("/pdfs") ||
    pathname.startsWith("/docs");

  // Calculate dynamic height based on footer visibility and current page
  const shouldShowFooter =
    isLoaded && !config.showHomeSidebar && !isExplorerPage;
  const panelHeight = isExplorerPage
    ? "calc(100vh - 60px)" // Only subtract header height for explorer pages
    : `calc(100vh - ${HEADER_HEIGHT}px${
        shouldShowFooter ? ` - ${FOOTER_HEIGHT}px` : ""
      })`;

  const AssistantContent = () => (
    <div className="flex flex-col h-full border-l-4 border-border">
      <div className="sticky top-0 p-4 border-b border-border bg-background z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Trimble Assistant</h2>
            {!isCentered && (
              <Button
                variant="ghost2"
                size="sm"
                className="p-2 rounded-full"
                onClick={toggleExpanded}
                title={isExpanded ? "Collapse panel" : "Expand panel"}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* <Button
              variant="ghost2"
              size="sm"
              className="p-2 rounded-full"
              onClick={toggleCentered}
              title={isCentered ? "Go back to sidepane" : "Open as dialog"}
            >
              {isCentered ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Expand className="h-4 w-4" />
              )}
            </Button> */}
          </div>

          {!isCentered && (
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full"
              onClick={toggleAssistant}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="mt-3">
          {mode === "chat" ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setMode("collaborator")}
            >
              <Users className="h-4 w-4" />
              Use Collaboration Mode
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setMode("chat")}
            >
              <MessagesSquare className="h-4 w-4" />
              Use Chat Mode
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {mode === "chat" ? (
          <Assistant exampleQuestions={exampleQuestions} />
        ) : (
          <CollaboratorProvider>
            <CollaboratorAssistant />
          </CollaboratorProvider>
        )}
      </div>
    </div>
  );

  if (isCentered) {
    return (
      <>
        <Dialog open={true} onOpenChange={() => toggleCentered()}>
          <DialogTitle>Trimble Assistant</DialogTitle>
          <DialogContent className="max-w-[900px] h-[80vh] p-0 [&>button]:hidden">
            <AssistantContent />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div
        data-assistant-panel
        style={{
          width: isExpanded ? EXPANDED_WIDTH : DEFAULT_WIDTH,
          top: 0,
          height: "100vh",
          right: 0,
          opacity: 1,
          transform: "translateX(0)",
          borderLeft: "2px solid var(--border)",
        }}
        className={cn(
          "fixed bg-background transform transition-all duration-300 ease-in-out z-50",
          "data-[minimized=true]:opacity-0",
          "data-[minimized=true]:pointer-events-none"
        )}
      >
        <AssistantContent />
      </div>
    </>
  );
}
