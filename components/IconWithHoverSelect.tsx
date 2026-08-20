import React from "react";
import {
  Check,
  Camera,
  Box,
  PackageCheck,
  Folder,
  FileText,
  ClipboardCheck,
  Text,
  Files,
  Aperture,
  Globe,
} from "lucide-react";
import { FaFolder, FaFile, FaCamera } from "react-icons/fa";
import { PiBlueprint } from "react-icons/pi";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface IconWithHoverSelectProps {
  isSelected: boolean;
  isHovered: boolean;
  type:
    | "file"
    | "folder"
    | "view"
    | "releases"
    | "topics"
    | "property"
    | "activity"
    | "geospatial-package"
    | "e57"
    | "blueprint";
  icon?: string;
  customIcon?: React.ReactNode;
  avatar?: string;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
}

export default function IconWithHoverSelect({
  isSelected,
  isHovered,
  type,
  icon,
  customIcon,
  avatar,
  onClick,
}: IconWithHoverSelectProps) {
  return (
    <div
      className={cn(
        "relative w-8 h-8 flex items-center justify-center transition-all duration-200 ease-in-out rounded-full",
        isHovered || isSelected ? "bg-primary/80" : "",
        "cursor-pointer"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      {isSelected ? (
        <Check className="w-4 h-4 text-background" />
      ) : avatar ? (
        <div className="w-7 h-7 rounded-full overflow-hidden">
          <Image
            src={avatar}
            alt="User avatar"
            width={28}
            height={28}
            className={cn(
              "object-cover w-full h-full",
              isHovered && "opacity-80"
            )}
          />
        </div>
      ) : customIcon ? (
        <div className={cn(isHovered && "text-background/80")}>
          {customIcon}
        </div>
      ) : (
        (() => {
          switch (type) {
            case "folder":
              return (
                <FaFolder
                  className={cn(
                    "w-5 h-5",
                    isHovered ? "text-background/80" : "text-foreground/70"
                  )}
                />
              );
            case "blueprint":
              return (
                <PiBlueprint
                  className={cn(
                    "w-5 h-5",
                    isHovered ? "text-background/80" : "text-foreground/70"
                  )}
                />
              );
            case "view":
              return (
                <Camera
                  className={cn(
                    "w-5 h-5",
                    isHovered ? "text-background/80" : "text-foreground/70"
                  )}
                />
              );
            case "releases":
              return (
                <PackageCheck
                  className={cn(
                    "w-5 h-5",
                    isHovered ? "text-background/80" : "text-foreground/70"
                  )}
                />
              );
            case "topics":
              return (
                <ClipboardCheck
                  className={cn(
                    "w-5 h-5",
                    isHovered ? "text-background/80" : "text-foreground/70"
                  )}
                />
              );
            case "property":
              return (
                <Files
                  className={cn(
                    "w-5 h-5",
                    isHovered ? "text-background/80" : "text-foreground/70"
                  )}
                />
              );
            case "e57":
              return (
                <Aperture
                  className={cn(
                    "w-5 h-5",
                    isHovered ? "text-background/80" : "text-foreground/70"
                  )}
                />
              );
            case "geospatial-package":
              return (
                <Globe
                  className={cn(
                    "w-5 h-5",
                    isHovered ? "text-background/80" : "text-foreground/70"
                  )}
                />
              );
            default:
              return (
                <FileText
                  className={cn(
                    "w-5 h-5",
                    isHovered ? "text-background/80" : "text-foreground/60"
                  )}
                />
              );
          }
        })()
      )}
    </div>
  );
}
