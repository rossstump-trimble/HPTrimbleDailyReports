import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CollapseButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  className?: string;
}

export function CollapseButton({
  direction,
  onClick,
  className = "",
}: CollapseButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`absolute top-1/2 -translate-y-1/2 bg-background hover:bg-accent z-20 ${className} `}
      onClick={onClick}
    >
      {direction === "left" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </Button>
  );
}
