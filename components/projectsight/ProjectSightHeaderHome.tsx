"use client";

import React, { Suspense, useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/Mode";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserPopover } from "@/components/UserPopover";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import ProjectSwitcher from "./ProjectSwitcher";

interface ProjectSightHeaderHomeProps {
  isNavExpanded: boolean;
  onNavToggle: () => void;
  className?: string;
}

const ProjectSightHeaderHome = ({
  onNavToggle,
  className,
}: ProjectSightHeaderHomeProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isProjectPage = pathname !== "/" && pathname != null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    !mounted || resolvedTheme !== "dark"
      ? "/projectsight_logo.svg"
      : "/projectsight_logo_dark.svg";

  return (
    <header
      className={cn(
        "bg-background shadow-md h-[60px] px-3 flex justify-between items-center z-10 relative border-b border-border",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <HeaderIconButton tooltip="Menu" onClick={onNavToggle}>
          <Menu className="h-5 w-5" />
        </HeaderIconButton>
        <div className="ml-2">
          <div className="text-xl">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/projects">
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
                <TooltipContent>Projects</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {isProjectPage && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Suspense fallback={null}>
            <ProjectSwitcher />
          </Suspense>
        </div>
      )}

      <div className="flex items-center space-x-1">
        <ModeToggle />
        <UserPopover />
      </div>
    </header>
  );
};

export default ProjectSightHeaderHome;
