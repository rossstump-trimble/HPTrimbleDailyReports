import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ButtonProps } from "@/components/ui/button";

type LoadingButtonProps = Omit<
  ButtonProps,
  | "asChild"
  | "Icon"
  | "iconPlacement"
  | "connectIcon"
  | "connectIconSize"
  | "connectIconClassName"
> & {
  isLoading?: boolean;
  loadingText?: string;
};

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      className,
      children,
      variant = "default",
      size = "default",
      isLoading = false,
      loadingText,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        className={cn(className)}
        variant={variant}
        size={size}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
