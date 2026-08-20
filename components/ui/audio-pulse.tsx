import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface AudioPulseProps {
  active: boolean;
  volume: number;
  hover?: boolean;
  variant?: "small" | "medium" | "large";
  className?: string;
}

export function AudioPulse({
  active,
  volume,
  hover = false,
  variant = "medium",
  className,
}: AudioPulseProps) {
  const lines = useRef<(HTMLDivElement | null)[]>([]);
  const lineCount = variant === "large" ? 9 : 5;

  useEffect(() => {
    let timeout: number | null = null;

    const update = () => {
      lines.current.forEach((line, i) => {
        if (!line) return;

        // Add some randomness to make it look more natural
        const randomFactor = 1 + (Math.random() * 0.3 - 0.15);

        // Calculate different heights for different positions
        // Center line is tallest, outer lines are shorter
        const centerIndex = Math.floor(lineCount / 2);
        const distanceFromCenter = Math.abs(i - centerIndex);
        const positionFactor = 1 - (distanceFromCenter / centerIndex) * 0.5;

        // Increase multiplier when active
        const baseMultiplier = active ? 1.5 : 1; // 50% taller when active
        const multiplier =
          (i === centerIndex ? 400 : i % 3 === 0 ? 120 : 80) *
          positionFactor *
          randomFactor *
          baseMultiplier;

        // Size adjustments based on variant and active state
        const baseHeight =
          variant === "small" ? 4 : variant === "medium" ? 5 : 8;
        const maxHeight = active
          ? variant === "small"
            ? 30
            : variant === "medium"
            ? 48
            : 90 // 50% taller max heights when active
          : variant === "small"
          ? 20
          : variant === "medium"
          ? 32
          : 60;

        // For inactive state (when not actively speaking), use consistent minimal height
        // to avoid the impression of activity when there's actually none
        let calculatedHeight;
        if (!active && volume < 0.03) {
          // When not active and volume is very low, use a standardized minimal height pattern
          const minHeight =
            variant === "small" ? 4 : variant === "medium" ? 5 : 7;
          calculatedHeight = i === centerIndex ? minHeight + 2 : minHeight;
        } else {
          // Normal active rendering with dynamic heights
          calculatedHeight = Math.min(
            maxHeight,
            baseHeight + volume * multiplier
          );
        }

        line.style.height = `${calculatedHeight}px`;
      });

      timeout = window.setTimeout(update, 80); // Faster updates for smoother animation
    };

    update();

    return () => {
      if (timeout !== null) clearTimeout(timeout);
    };
  }, [volume, variant, lineCount, active]);

  // Determine colors based on variant
  const getLineColor = (index: number, count: number) => {
    const centerIndex = Math.floor(count / 2);

    if (variant === "large") {
      // For large variant, use a gradient effect
      if (index === centerIndex) return "bg-blue-400";
      if (index === centerIndex - 1 || index === centerIndex + 1)
        return "bg-blue-500";
      if (index === centerIndex - 2 || index === centerIndex + 2)
        return "bg-tc-blue";
      return "bg-tc-blue/80";
    } else {
      // For smaller variants, use simpler colors
      return index === Math.floor(count / 2) ? "bg-blue-400" : "bg-tc-blue";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center h-12 w-full",
        variant === "medium" && "h-16",
        variant === "large" && "h-24",
        active ? "opacity-100" : "opacity-30",
        hover && "hover:opacity-100",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-4",
          variant === "small" && "w-[120px]",
          variant === "medium" && "w-[160px]",
          variant === "large" && "w-[220px]"
        )}
      >
        {Array(lineCount)
          .fill(null)
          .map((_, i) => (
            <div
              key={i}
              ref={(el: HTMLDivElement | null) => {
                lines.current[i] = el;
              }}
              className={cn(
                "rounded-full transition-height duration-100",
                getLineColor(i, lineCount),
                variant === "small" && "w-[4px]",
                variant === "medium" && "w-[5px]",
                variant === "large" && "w-[7px]"
              )}
              style={{
                height: "4px",
                animationDelay: `${i * 100}ms`,
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          ))}
      </div>
    </div>
  );
}
