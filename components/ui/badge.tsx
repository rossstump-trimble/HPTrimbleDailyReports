import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground font-mono font-medium",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground font-mono font-medium",
        acl: "border-transparent bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 font-mono font-xs font-medium",
        "acl-readonly":
          "border-transparent bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 font-mono font-xs font-medium",
        "acl-noaccess":
          "border-transparent bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 font-mono font-xs font-medium",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground font-mono font-medium",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
