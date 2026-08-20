import React from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssistant } from "@/contexts/AssistantContext";
import { useUIConfig } from "@/hooks/useUIConfig";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  fileSpecificExampleQuestions,
  folderSpecificExampleQuestions,
} from "@/components/Assistant";

interface AssistantButtonProps {
  projectId: string;
  projectName: string;
  className?: string;
  entityType?: "project" | "folder" | "file"; // Optional explicit entity type
}

export const AssistantButton: React.FC<AssistantButtonProps> = ({
  projectId,
  projectName,
  className,
  entityType,
}) => {
  const {
    preloadQuestion,
    toggleAssistant,
    isAssistantOpen,
    setExampleQuestions,
  } = useAssistant();
  const { config, isLoaded } = useUIConfig();

  // // Don't render if the Assistant feature is not enabled
  // if (!isLoaded || !config.showAssistant) return null;

  // Determine entity type from projectName if not explicitly provided
  const determineEntityType = (): "project" | "folder" | "file" => {
    if (entityType) return entityType;

    if (projectName.includes("Tell me about this Folder")) return "folder";
    if (projectName.includes("Tell me about this File")) return "file";
    return "project"; // Default to project
  };

  const actualEntityType = determineEntityType();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Set the appropriate example questions based on entity type
    if (actualEntityType === "file") {
      setExampleQuestions(fileSpecificExampleQuestions);
    } else if (actualEntityType === "folder") {
      setExampleQuestions(folderSpecificExampleQuestions);
    }

    if (!isAssistantOpen) {
      toggleAssistant();
    }

    preloadQuestion(projectName);
  };

  // Get appropriate tooltip text based on entity type
  const getTooltipText = () => {
    switch (actualEntityType) {
      case "folder":
        return "Ask AI about this folder";
      case "file":
        return "Ask AI about this file";
      case "project":
      default:
        return "Ask AI about this project";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 p-1 transition-colors rounded-full ${className}`}
            onClick={handleClick}
          >
            <Bot className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
