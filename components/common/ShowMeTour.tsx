"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Compass, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getDefaultProjectId,
  getLastSelectedProjectId,
  resolveActiveProjectId,
} from "@/lib/active-project";

interface TourStep {
  title: string;
  description: string;
  href: (projectId: string) => string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: "Projects",
    description:
      "You see the projects you have in ProjectSight. Each has a QR code for trade partners (no login). Foremen scan it, pick their language, and speak or type their daily.",
    href: () => "/projects",
  },
  {
    title: "Companies",
    description:
      "Set up each trade partner here: their contacts and the ProjectSight crew their reports should go to.",
    href: (projectId) => `/projects/${projectId}/companies`,
  },
  {
    title: "Review & Approvals",
    description:
      "Submitted dailies land here. Open one to check or edit it, then choose Approve & Send to PS.",
    href: (projectId) => `/projects/${projectId}/review`,
  },
  {
    title: "Bowling Sheet",
    description:
      "One row per company, one column per day. Use it to spot who hasn't reported on a working day.",
    href: (projectId) => `/projects/${projectId}/bowling`,
  },
];

// Mounted once in the layout so the card survives the page changes the tour triggers.
export default function ShowMeTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  const goToStep = (index: number) => {
    const projectId = resolveActiveProjectId({
      pathname,
      lastProjectId: getLastSelectedProjectId(),
      defaultProjectId: getDefaultProjectId(),
    });
    setStepIndex(index);
    router.push(TOUR_STEPS[index].href(projectId));
  };

  if (stepIndex === null) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => goToStep(0)}
        className="fixed bottom-4 right-4 z-40 gap-1.5 bg-background shadow-md text-xs font-semibold"
      >
        <Compass className="h-3.5 w-3.5 text-[#0063a3]" />
        Show Me Around
      </Button>
    );
  }

  const step = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-label="Product tour"
      className="fixed bottom-4 right-4 z-40 w-80 rounded-xl border border-border bg-background p-4 shadow-xl space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0063a3]">
          {stepIndex + 1} of {TOUR_STEPS.length}
        </span>
        <button
          type="button"
          aria-label="Close tour"
          onClick={() => setStepIndex(null)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isFirst}
          onClick={() => goToStep(stepIndex - 1)}
          className="text-xs gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => (isLast ? setStepIndex(null) : goToStep(stepIndex + 1))}
          className="text-xs font-bold gap-1 bg-[#0063a3] hover:bg-[#004f83] text-white"
        >
          {isLast ? "Done" : "Next"}
          {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
