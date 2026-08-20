"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useUIConfig } from "@/hooks/useUIConfig";
import Image from "next/image";
import { LabsBadge } from "@/components/labs/labs-badge";
import { LabIcon } from "@/components/icons/lab-icon";
import { LabIcon as LabIconModus } from "@/components/icons/lab-icon-modus";
import { SquareArrowOutUpRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const DIALOG_SEEN_KEY = "tc_welcome_dialog_seen";

export default function UserTestingDialog() {
  const [open, setOpen] = useState(false);
  const [hasSeenDialog, setHasSeenDialog] = useState(true); // Start true to prevent flash

  useEffect(() => {
    // Check if user has seen the dialog before
    const dialogSeen = localStorage.getItem(DIALOG_SEEN_KEY);
    if (!dialogSeen) {
      setHasSeenDialog(false);
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(DIALOG_SEEN_KEY, "true");
    setHasSeenDialog(true);
    setOpen(false);
  };

  if (hasSeenDialog) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="border-border max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="relative h-[120px] sm:h-[200px]">
          <Image
            src="/user-testing-dialog.jpg"
            alt="Prototype welcome"
            fill
            className="object-cover"
            priority
          />
        </div>

        <ScrollArea className="flex-1 h-[300px] sm:h-[400px]">
          <div className="p-6">
            <AlertDialogHeader>
              <div className="flex flex-col items-start space-y-2">
                <AlertDialogTitle className="text-xl font-bold text-foreground">
                  Welcome to ProjectSight Prototype
                </AlertDialogTitle>
                <LabsBadge
                  variant="expandIcon"
                  Icon={SquareArrowOutUpRight}
                  iconPlacement="right"
                  className="w-fit text-xs font-mono bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:bg-blue-500/30 dark:text-blue-200"
                  size="md"
                >
                  <LabIcon className="h-4 w-4" />
                  part of ProjectSight Labs
                </LabsBadge>
              </div>

              <AlertDialogDescription asChild>
                <div className="space-y-4 pt-3 text-muted-foreground">
                  <div>
                    Your interactions will be recorded for research purposes.
                    <br />
                    We&apos;ll track navigation patterns and clicks.{" "}
                  </div>
                  <div>No personal information is collected.</div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
        </ScrollArea>

        <AlertDialogFooter className="flex-shrink-0 border-t p-6 mt-0">
          <AlertDialogAction
            onClick={handleAccept}
            className="w-full bg-tc-blue hover:bg-tc-blue-hover text-primary-foreground"
          >
            Continue to prototype
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
