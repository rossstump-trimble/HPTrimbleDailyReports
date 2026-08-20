"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderIconButtonProps {
  tooltip: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const HeaderIconButton = React.forwardRef<
  HTMLButtonElement,
  HeaderIconButtonProps
>(({ tooltip, onClick, children, className }, ref) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className={`header-icon-btn${className ? ` ${className}` : ""}`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

HeaderIconButton.displayName = "HeaderIconButton";
