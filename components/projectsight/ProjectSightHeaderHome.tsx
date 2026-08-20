"use client";

import React, { Suspense, useState, useEffect } from "react";
import {
  Menu,
  HelpCircle,
  Search,
  User,
  Settings2,
  Zap,
  Bot,
  X,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { IoApps } from "react-icons/io5";
import { BiSolidZap } from "react-icons/bi";
import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/Mode";
import { HeaderIconButton } from "@/components/HeaderIconButton";

import AppLauncher from "@/components/AppLauncher";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import NativeHelpMenu from "@/components/NativeHelpMenu";

import { useAssistant } from "@/contexts/AssistantContext";

import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserPopover } from "@/components/UserPopover";
import { cn } from "@/lib/utils";
import OmniSearch from "@/components/omni/OmniSearch";
import { useRouter, usePathname } from "next/navigation";
import ProjectSwitcher from "./ProjectSwitcher";

interface ProjectSightHeaderHomeProps {
  isNavExpanded: boolean;
  onNavToggle: () => void;
  className?: string;
}

const ProjectSightHeaderHome = ({
  isNavExpanded,
  onNavToggle,
  className,
}: ProjectSightHeaderHomeProps) => {
  const userName = "John Doe";

  const avatarColor = "hsl(var(--border))"; // Changed to use design system color
  const [showSettings, setShowSettings] = useState(false);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toggleAssistant } = useAssistant();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const isProjectPage = pathname !== "/" && pathname != null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and before mounting, return the light theme version
  const logoSrc =
    !mounted || resolvedTheme !== "dark"
      ? "/projectsight_logo.svg"
      : "/projectsight_logo_dark.svg";

  const handleSearch = (query: string) => {
    setIsSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <header
      className={cn(
        "bg-background shadow-md h-[60px] px-3 flex justify-between items-center z-10 relative border-b border-border",
        className
      )}
    >
      {isSearchOpen && (
        <div className="absolute inset-0 bg-background z-20 flex items-center justify-center">
          <div className="w-full flex items-center px-4">
            <div className="flex-1 flex justify-center">
              <OmniSearch
                className="w-full max-w-3xl"
                onSearch={handleSearch}
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="header-icon-btn ml-4"
                    onClick={toggleSearch}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Close Search</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <HeaderIconButton tooltip="Menu" onClick={onNavToggle}>
          <Menu className="h-5 w-5" />
        </HeaderIconButton>
        <div className="ml-2">
          <div className="text-xl">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/">
                    <Image
                      src={logoSrc}
                      alt="ProjectSight"
                      width={144}
                      height={16}
                      style={{ width: "auto", height: "auto", transform: "scale(0.7)", transformOrigin: "left center" }}
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

      {isProjectPage && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Suspense fallback={null}>
            <ProjectSwitcher />
          </Suspense>
        </div>
      )}

      <div className="flex gap-12">
        <div className="flex items-center">
          <div className="flex items-center space-x-1 mr-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="/mobile/signin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-foreground hover:bg-accent transition-colors"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile App
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>Open Mobile Prototype</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <HeaderIconButton tooltip="Search" onClick={toggleSearch}>
              <Search className="h-5 w-5" />
            </HeaderIconButton>

            <HeaderIconButton tooltip="Settings" onClick={() => router.push("/settings/companies")}>
              <Settings2 className="h-5 w-5" />
            </HeaderIconButton>

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
                <PopoverContent className="w-[360px] p-0" align="end">
                  <NativeHelpMenu />
                </PopoverContent>
              </Popover>
            </TooltipProvider>
            <ModeToggle />

            <HeaderIconButton tooltip="Assistant" onClick={toggleAssistant}>
              <Bot className="h-5 w-5" />
            </HeaderIconButton>

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
          </div>

          <UserPopover />
        </div>
      </div>
    </header>
  );
};

export default ProjectSightHeaderHome;
