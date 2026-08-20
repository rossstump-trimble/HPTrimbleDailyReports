import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labsBadgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-trimble-blue text-background dark:text-white hover:bg-tc-blue-hover",
        secondary: "bg-tc-secondary text-background hover:bg-tc-secondary/80",
        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success:
          "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-200",
        warning:
          "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-200",
        info: "bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-200",
        shine:
          "text-primary-foreground animate-shine bg-gradient-to-r from-primary via-primary/75 to-primary bg-[length:400%_100%]",
        gooey:
          "text-primary-foreground relative bg-primary z-0 overflow-hidden transition-all duration-500 before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%] before:bg-gradient-to-r from-zinc-400 before:transition-transform before:duration-1000 hover:before:translate-x-[0%] hover:before:translate-y-[0%]",
        ringHover:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:ring-2 hover:ring-primary/90 hover:ring-offset-2",
        expandIcon:
          "group relative text-primary-foreground bg-primary hover:bg-primary/90",
        expandIcon2:
          "group relative text-primary-foreground bg-muted-foreground hover:bg-muted-foreground/90",
      },
      size: {
        default: "px-3 py-1",
        sm: "px-2.5 py-0.5 text-xs",
        md: "px-3 py-1.5",
        lg: "px-4 py-1.5",
        xl: "px-5 py-2",
        "2xl": "px-6 py-2.5",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        slideIn: "animate-slideIn",
      },
      clickable: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
      clickable: false,
    },
  }
);

interface IconProps {
  Icon?: React.ElementType;
  iconPlacement?: "left" | "right";
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

interface IconRefProps {
  Icon?: never;
  iconPlacement?: undefined;
  startContent?: never;
  endContent?: never;
}

export interface LabsBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof labsBadgeVariants> {
  asChild?: boolean;
  clickable?: boolean;
  iconClassName?: string;
}

export type LabsBadgeIconProps = IconProps | IconRefProps;

const LabsBadge = React.forwardRef<
  HTMLDivElement,
  LabsBadgeProps & LabsBadgeIconProps
>(
  (
    {
      className,
      variant,
      size,
      animation,
      Icon,
      iconPlacement,
      startContent,
      endContent,
      asChild = false,
      clickable,
      children,
      iconClassName,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";

    return (
      <Comp
        ref={ref}
        className={cn(
          labsBadgeVariants({ variant, size, animation, clickable, className })
        )}
        {...props}
      >
        {startContent && (
          <div className="flex items-center mr-2">{startContent}</div>
        )}

        {Icon && iconPlacement === "left" && (
          <div className="w-0 translate-x-[0%] pr-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:translate-x-100 group-hover:pr-2 group-hover:opacity-100">
            <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
          </div>
        )}

        <Slottable>{children}</Slottable>

        {(Icon && iconPlacement === "right") || endContent ? (
          <div className="w-0 translate-x-[100%] pl-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:translate-x-0 group-hover:pl-2 group-hover:opacity-100">
            {Icon && iconPlacement === "right" ? (
              <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
            ) : (
              endContent
            )}
          </div>
        ) : null}
      </Comp>
    );
  }
);

LabsBadge.displayName = "LabsBadge";

export { LabsBadge, labsBadgeVariants };
