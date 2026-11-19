"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  QrCode,
  Building2,
  ClipboardCheck,
  TableProperties,
  Link2,
  HelpCircle,
} from "lucide-react";

export interface TourStep {
  title: string;
  badge?: string;
  description: string;
  icon?: React.ReactNode;
  tips?: string[];
}

export interface ShowMeTourProps {
  tourId: "projects" | "review" | "bowling";
  className?: string;
  variant?: "button" | "pill" | "icon";
}

const TOURS: Record<string, { title: string; subtitle: string; steps: TourStep[] }> = {
  projects: {
    title: "Projects & Jobsite Onboarding Tour",
    subtitle: "Learn how to manage projects, toggle list view, and share jobsite intake QR codes.",
    steps: [
      {
        title: "Tile View vs. Collapsed List View",
        badge: "New Feature",
        description:
          "Easily toggle between the traditional expanded Tile View and the new Collapsed List View using the toggle buttons in the top right. The list view gives you a dense overview matching ProjectSight / Trimble Connect.",
        icon: <TableProperties className="h-6 w-6 text-[#0063a3]" />,
        tips: [
          "Click the chevron (>) next to any project in list view to expand its jobsite QR drawer.",
          "Your view mode preference is automatically remembered for your next visit.",
        ],
      },
      {
        title: "Trade Partner & Staff QR Codes",
        badge: "Field Intake",
        description:
          "Every project has two dedicated QR codes: one for Trade Subcontractors (no app install or corporate login required) and one for Hensel Phelps Staff with direct ProjectSight sync.",
        icon: <QrCode className="h-6 w-6 text-[#0063a3]" />,
        tips: [
          "Print QR codes and post them on site trailers, muster areas, and turnstiles.",
          "Trades can speak their daily report using voice-to-text with specialized nomenclature.",
        ],
      },
      {
        title: "Project Configuration & ProjectSight IDs",
        badge: "Configuration",
        description:
          "Click the gear icon (Settings) on any project card or list row to view or update its linked ProjectSight Portfolio ID and Project ID, project number, or work schedule.",
        icon: <Link2 className="h-6 w-6 text-[#0063a3]" />,
        tips: [
          "Ensure the Portfolio ID (UUID) and Project ID match your ProjectSight project settings.",
          "Changes to working days immediately update missing daily calculations.",
        ],
      },
      {
        title: "Default Project & Quick Navigation",
        badge: "Productivity",
        description:
          "Click the Star (★) icon next to any project to set it as your personal default project. The app will automatically default to this project on dashboards and menu navigation.",
        icon: <Sparkles className="h-6 w-6 text-amber-500" />,
        tips: [
          "Use the direct action buttons to jump straight to Dashboard, Bowling Sheet, or Review Queue.",
        ],
      },
    ],
  },
  review: {
    title: "Review & Approval Queue Tour",
    subtitle: "Step through superintendent verification and 1-tap ProjectSight sync.",
    steps: [
      {
        title: "Live Subcontractor Submissions",
        badge: "Real-Time Queue",
        description:
          "As trade foremen dictate or type their daily reports on site via QR intake, records land instantly in your Superintendent Review Queue.",
        icon: <ClipboardCheck className="h-6 w-6 text-[#0063a3]" />,
        tips: [
          "Each card shows manpower headcount, hours worked, safety STA status, and trade notes.",
          "Subcontractor voice recordings are transcribed and summarized automatically.",
        ],
      },
      {
        title: "Side-by-Side Review & Editing",
        badge: "Quality Control",
        description:
          "Click 'Review & Edit' on any card to open the inspection drawer. You can verify work performed, adjust manpower or hours, and inspect any uploaded STA safety forms or photos.",
        icon: <Building2 className="h-6 w-6 text-[#0063a3]" />,
        tips: [
          "Any trade-specific nomenclature or delays can be refined prior to commitment.",
        ],
      },
      {
        title: "Designated ProjectSight Crews",
        badge: "Crew Mapping",
        description:
          "You can designate specific ProjectSight crews (e.g. 'Framing Crew A' or 'Concrete Finishers') for each trade partner so records never default to the first crew on file in ProjectSight.",
        icon: <Sparkles className="h-6 w-6 text-[#0063a3]" />,
        tips: [
          "Set company default crews in the Companies tab or adjust the crew directly in the review drawer.",
        ],
      },
      {
        title: "1-Tap ProjectSight Commitment",
        badge: "System of Record",
        description:
          "Click 'Approve & Send to PS' to commit the report. The app communicates directly with Trimble ProjectSight, generating an official Daily Report record, attaching photos, and creating Labor Cards.",
        icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
        tips: [
          "Synced records display the official ProjectSight Daily ID stamped on the card.",
        ],
      },
    ],
  },
  bowling: {
    title: "Bowling Sheet Matrix Tour",
    subtitle: "Understand trade compliance, missing logs, and company tracking.",
    steps: [
      {
        title: "Consolidated Company Rows",
        badge: "Consolidation",
        description:
          "Each enrolled subcontractor occupies a single row on the Bowling Sheet. If multiple foremen submit reports for the same trade on a given date, manpower and hours are combined on that calendar cell.",
        icon: <TableProperties className="h-6 w-6 text-[#0063a3]" />,
        tips: [
          "Click any cell to view all individual submitter logs, craft breakdowns, and notes.",
        ],
      },
      {
        title: "Daily Status Indicators",
        badge: "Visual Legend",
        description:
          "Green cells indicate an approved/submitted daily report. Red cells indicate a missing report on a scheduled work day. Grey cells indicate non-working days or scheduled off-site days.",
        icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
        tips: [
          "Right-click or click a cell to mark trade-specific on-site or off-site schedule exceptions.",
        ],
      },
      {
        title: "Working Days Schedule",
        badge: "Project Schedule",
        description:
          "The project schedule determines which calendar days expect a report. Use the schedule selector (Mon–Fri, Mon–Sat, 7 Days) or the Admin Console to adjust active working days.",
        icon: <Sparkles className="h-6 w-6 text-[#0063a3]" />,
        tips: [
          "Changing working days immediately recalculates monthly missing rates.",
        ],
      },
    ],
  },
};

export default function ShowMeTour({ tourId, className = "" }: ShowMeTourProps) {
  const [open, setOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const tour = TOURS[tourId] || TOURS.projects;
  const currentStep = tour.steps[currentStepIndex] || tour.steps[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === tour.steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setOpen(false);
      setCurrentStepIndex(0);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleStartTour = () => {
    setCurrentStepIndex(0);
    setOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleStartTour}
        className={`h-8 px-2.5 text-xs font-semibold gap-1.5 border-[#0063a3]/30 text-[#0063a3] hover:bg-[#0063a3]/10 dark:text-blue-400 dark:border-blue-800 ${className}`}
        title={`Take guided tour: ${tour.title}`}
      >
        <Compass className="h-3.5 w-3.5 text-[#0063a3] dark:text-blue-400 animate-spin-slow" />
        <span>Show Me</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          {/* Header Banner */}
          <div className="bg-[#0063a3] text-white p-5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
                  Guided Product Tour
                </span>
              </div>
              <Badge className="bg-white/20 text-white hover:bg-white/20 border-0 text-[10px] font-mono">
                Step {currentStepIndex + 1} of {tour.steps.length}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-white pt-1">{tour.title}</h3>
            <p className="text-xs text-blue-100/90 leading-tight">{tour.subtitle}</p>
          </div>

          {/* Step Body */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900 shrink-0">
                {currentStep.icon || <Sparkles className="h-6 w-6 text-[#0063a3]" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground">{currentStep.title}</h4>
                  {currentStep.badge && (
                    <Badge variant="outline" className="text-[10px] font-bold text-[#0063a3] border-blue-300">
                      {currentStep.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Practical Tips */}
            {currentStep.tips && currentStep.tips.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
                <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-[#0063a3]" /> Quick Tip
                </span>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-xs leading-normal">
                  {currentStep.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stepper Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {tour.steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex ? "w-6 bg-[#0063a3]" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="bg-muted/40 border-t border-border p-4 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isFirst}
              onClick={handlePrev}
              className="text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip Tour
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                className="text-xs font-bold gap-1 bg-[#0063a3] hover:bg-[#004f83] text-white"
              >
                <span>{isLast ? "Finish Tour" : "Next Step"}</span>
                {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
