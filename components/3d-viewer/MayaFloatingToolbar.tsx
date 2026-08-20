import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConstructionIssueDialog } from "./ConstructionIssueDialog";

interface MayaFloatingToolbarProps {
  position?: "left" | "right";
  viewportIndex: number;
}

/**
 * A floating toolbar specifically for Maya mode that provides quick access to
 * common actions like adding pins, downloading images, and creating links.
 * Can be positioned on either the left or right side of a viewport.
 */
export const MayaFloatingToolbar: React.FC<MayaFloatingToolbarProps> = ({
  position = "left",
  viewportIndex,
}) => {
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [pinPosition, setPinPosition] = useState<
    { x: number; y: number } | undefined
  >(undefined);

  const handlePinClick = () => {
    setPinPosition({ x: Math.random() * 100, y: Math.random() * 100 });
    setIssueDialogOpen(true);
  };

  return (
    <>
      <div
        className={`absolute top-1/2 ${
          position === "left" ? "left-4" : "right-4"
        } -translate-y-1/2 bg-background rounded-2xl shadow-md p-2 z-50 flex flex-col gap-1`}
      >
        <Button
          variant="whiteToolbar"
          size="icon"
          title="Add Construction Issue"
          onClick={handlePinClick}
          connectIcon="location"
        />
        <Button
          variant="whiteToolbar"
          size="icon"
          title="Download Image"
          connectIcon="file-download"
        />
        <Button
          variant="whiteToolbar"
          size="icon"
          title="Create Link"
          connectIcon="link-alt"
        />
      </div>

      <ConstructionIssueDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        position={pinPosition}
        viewportIndex={viewportIndex}
      />
    </>
  );
};

export default MayaFloatingToolbar;
