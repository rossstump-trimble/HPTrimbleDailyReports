import React, { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface OmniButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  active?: boolean;
}

const OmniButton = React.forwardRef<HTMLButtonElement, OmniButtonProps>(
  ({ text = "Button", className, active = false, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    const showAnimation = active || isHovered;

    return (
      <button
        ref={ref}
        onMouseEnter={() => !active && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative w-32 cursor-pointer overflow-hidden rounded-full border bg-background p-2 text-center font-semibold",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-block translate-x-1 transition-all duration-300",
            showAnimation && "translate-x-12 opacity-0"
          )}
        >
          {text}
        </span>
        <div
          className={cn(
            "absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-primary-foreground dark:text-white opacity-0 transition-all duration-300",
            showAnimation && "-translate-x-1 opacity-100"
          )}
        >
          <span>{text}</span>
          <Globe className="w-4 h-4" />
        </div>
        <div
          className={cn(
            "absolute left-[20%] top-[40%] h-2 w-2 scale-[1] rounded-lg bg-gradient-to-l from-slate-900 to-slate-600 transition-all duration-300",
            showAnimation &&
              "left-[0%] top-[0%] h-full w-full scale-[1.8] bg-gradient-to-l from-slate-900 to-slate-600"
          )}
        ></div>
      </button>
    );
  }
);

OmniButton.displayName = "OmniButton";

export { OmniButton };
