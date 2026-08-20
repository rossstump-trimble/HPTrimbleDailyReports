"use client";
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LabsBadge } from "@/components/labs/labs-badge";
import { LabIcon } from "@/components/icons/lab-icon";
import { ArrowRightIcon, SquareArrowOutUpRight } from "lucide-react";
import type { LabsBadgeConfig } from "@/types/labs";

interface BadgeSelectorProps {
  selectedBadge: LabsBadgeConfig | null;
  badgeConfigs: LabsBadgeConfig[];
  onBadgeSelect: (badge: LabsBadgeConfig | null) => void;
}

export function BadgeSelector({
  selectedBadge,
  badgeConfigs,
  onBadgeSelect,
}: BadgeSelectorProps) {
  return (
    <RadioGroup
      value={selectedBadge?.id}
      onValueChange={(id) =>
        onBadgeSelect(badgeConfigs.find((config) => config.id === id) || null)
      }
    >
      {badgeConfigs.map((config) => (
        <div
          key={config.id}
          className="flex items-center gap-4 p-2 rounded-full hover:bg-background/50 hover:shadow-sm transition-all cursor-pointer group"
          onClick={() => onBadgeSelect(config)}
        >
          <RadioGroupItem
            value={config.id}
            id={config.id}
            className="mt-0 group-hover:border-primary"
            aria-label={`Select ${config.label} badge`}
          />
          <LabsBadge
            variant={config.variant ?? "default"}
            Icon={
              config.variant?.includes("expandIcon")
                ? SquareArrowOutUpRight
                : undefined
            }
            iconPlacement="right"
            className={config.className}
            size="md"
          >
            {config.icon === LabIcon ? (
              <LabIcon className="h-4 w-4" />
            ) : (
              React.createElement(config.icon, { className: "h-4 w-4" })
            )}
            {config.label}
          </LabsBadge>
        </div>
      ))}
    </RadioGroup>
  );
}
