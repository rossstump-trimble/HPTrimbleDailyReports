"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  HelpCircle,
  Search,
  User,
  Settings2,
  Zap,
  Bot,
} from "lucide-react";
import { IoApps } from "react-icons/io5";
import { BiSolidZap } from "react-icons/bi";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/Mode";
import { HeaderIconButton } from "@/components/HeaderIconButton";

import AppLauncher from "@/components/AppLauncher";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useUIConfig } from "@/hooks/useUIConfig";
import HelpPopover from "@/components/HelpPopover";

import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAssistant } from "@/contexts/AssistantContext";
import { UserPopover } from "@/components/UserPopover";
import { usePathname, useSearchParams } from "next/navigation";

const HeaderHome = () => {
  const userName = "John Doe";
  const { config, isLoaded } = useUIConfig();
  const avatarColor = "hsl(var(--border))"; // Changed to use design system color
  const [showSettings, setShowSettings] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toggleAssistant } = useAssistant();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if we're in a ProjectSight context by examining:
  // 1. Path includes /projectsight/
  // 2. Source parameter is set to projectsight
  const isProjectSight =
    pathname?.toLowerCase().includes("projectsight") ||
    searchParams?.get("source") === "projectsight";

  // During SSR and before mounting, return the light theme version
  const logoSrc =
    !mounted || resolvedTheme !== "dark"
      ? isProjectSight
        ? "/projectsight_logo.svg"
        : "/trimbleconnect_header.svg"
      : isProjectSight
        ? "/projectsight_logo_dark.svg"
        : "/trimbleconnect_header_dark.svg";

  // Set the appropriate home link based on which logo is shown
  const homeLink = isProjectSight ? "/trimble-connect" : "/";

  return (
    <header className="bg-background h-[60px] px-3 flex justify-between items-center z-10 relative border-b border-border">
      <div className="flex items-center">
        <div className="ml-3">
          <div className="text-xl">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={homeLink}>
                    <Image
                      src={logoSrc}
                      alt={isProjectSight ? "ProjectSight" : "Trimble Connect"}
                      width={200}
                      height={20}
                      style={{ width: "auto", height: "auto" }}
                      priority={true}
                      loading="eager"
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Home</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="ml-8"></div>
      </div>
      <div className="flex gap-12">
        <div className="flex items-center">
          <div className="flex items-center space-x-1 mr-4">
            <HeaderIconButton tooltip="Search">
              <Search className="h-5 w-5" />
            </HeaderIconButton>

            {isLoaded && config.showSettings && (
              <HeaderIconButton tooltip="Prototype Settings" onClick={() => setShowSettings(true)}>
                <Settings2 className="h-5 w-5" />
              </HeaderIconButton>
            )}
            <TooltipProvider>
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button type="button" className="header-icon-btn">
                        <HelpCircle className="h-5 w-5" />
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Help</TooltipContent>
                </Tooltip>
                <PopoverContent className="w-64 p-0" align="end">
                  <HelpPopover />
                </PopoverContent>
              </Popover>
            </TooltipProvider>
            <ModeToggle />

            <HeaderIconButton tooltip="Assistant" onClick={toggleAssistant}>
              <Bot className="h-5 w-5" />
            </HeaderIconButton>

            {isLoaded && config.showAppLauncher && (
              <TooltipProvider>
                <Popover>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <button type="button" className="header-icon-btn">
                          <IoApps className="h-5 w-5" />
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Apps</TooltipContent>
                  </Tooltip>
                  <PopoverContent className="w-auto p-0" align="end">
                    <AppLauncher />
                  </PopoverContent>
                </Popover>
              </TooltipProvider>
            )}
          </div>

          <UserPopover />
        </div>
      </div>
    </header>
  );
};

export default HeaderHome;
