"use client";

import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-[#0063a3] text-white hover:bg-[#004e82] shadow-sm active:bg-[#003d66]",
        disabled: "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
        yellow: "bg-amber-500 text-black hover:bg-amber-600 shadow-sm",
        default2: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        default3: "border border-border bg-background hover:bg-muted text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        destructiveOutline: "border border-destructive text-destructive hover:bg-destructive/10",
        outline: "border border-input bg-background hover:bg-muted hover:text-foreground text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground text-foreground",
        ghost2: "hover:bg-muted hover:text-foreground text-foreground",
        ghost3: "hover:bg-muted hover:text-foreground text-foreground",
        link: "text-[#0063a3] dark:text-blue-400 underline-offset-4 hover:underline",
        toolbar: "border border-border bg-background hover:bg-muted text-foreground",
        expandIcon: "bg-[#0063a3] text-white hover:bg-[#004e82]",
        expandIcon2: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ringHover: "bg-[#0063a3] text-white hover:ring-2 hover:ring-[#0063a3]/50",
        ringHover2: "bg-amber-500 text-black hover:ring-2 hover:ring-amber-500/50",
        shine: "bg-[#0063a3] text-white hover:bg-[#004e82]",
        gooeyRight: "bg-[#0063a3] text-white hover:bg-[#004e82]",
        gooeyLeft: "bg-[#0063a3] text-white hover:bg-[#004e82]",
        linkHover1: "text-[#0063a3] dark:text-blue-400 hover:underline",
        linkHover2: "text-[#0063a3] dark:text-blue-400 hover:underline",
        whiteToolbar: "border border-border bg-white text-gray-800 hover:bg-gray-50",
        threeDViewport: "border border-border bg-background hover:bg-muted text-foreground",
        omniSearch: "border border-border bg-background hover:bg-muted text-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8 text-sm",
        icon: "h-9 w-9 p-0",
        smIcon: "h-8 w-8 p-0",
        threeDViewportSmall: "h-7 w-7 p-0",
        threeDViewportMedium: "h-8 w-8 p-0",
        threeDViewportLarge: "h-9 w-9 p-0",
        threeDViewportXLarge: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface IconProps {
  Icon: React.ElementType;
  iconPlacement: "left" | "right";
}
interface ConnectIconProps {
  Icon?: never;
  iconPlacement?: "left" | "right";
  connectIcon?: string;
  connectIconSize?: "16" | "24" | "32" | "64";
  connectIconClassName?: string;
}
interface NoIconProps {
  Icon?: never;
  iconPlacement?: undefined;
  connectIcon?: never;
  connectIconSize?: undefined;
  connectIconClassName?: undefined;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  checked?: boolean;
  active?: boolean;
  Icon?: React.ElementType;
  iconPlacement?: "left" | "right";
  connectIcon?: string;
  connectIconSize?: "16" | "24" | "32" | "64";
  connectIconClassName?: string;
}

export type ButtonIconProps = IconProps | ConnectIconProps | NoIconProps;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps & ButtonIconProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      Icon,
      iconPlacement = "left",
      connectIcon,
      connectIconSize,
      connectIconClassName,
      checked,
      active,
      onClick,
      disabled,
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const isIconOnly =
      size === "icon" ||
      size === "smIcon" ||
      size === "threeDViewportSmall" ||
      size === "threeDViewportMedium" ||
      size === "threeDViewportLarge" ||
      size === "threeDViewportXLarge";

    const content = (
      <>
        {Icon && iconPlacement === "left" && <Icon />}
        {connectIcon && iconPlacement === "left" && !isIconOnly && (
          <i
            className={cn(
              "icon-font",
              `tc-icon-${connectIcon}`,
              connectIconSize === "16" && "i16",
              connectIconSize === "32" && "i32",
              connectIconSize === "64" && "i64",
              "mr-2",
              connectIconClassName
            )}
            aria-hidden
          />
        )}
        {connectIcon && isIconOnly && (
          <i
            className={cn(
              "icon-font",
              `tc-icon-${connectIcon}`,
              connectIconSize === "16" && "i16",
              connectIconSize === "32" && "i32",
              connectIconSize === "64" && "i64",
              connectIconClassName
            )}
            aria-hidden
          />
        )}
        {!asChild && <Slottable>{children}</Slottable>}
        {Icon && iconPlacement === "right" && <Icon />}
        {connectIcon && iconPlacement === "right" && !isIconOnly && (
          <i
            className={cn(
              "icon-font",
              `tc-icon-${connectIcon}`,
              connectIconSize === "16" && "i16",
              connectIconSize === "32" && "i32",
              connectIconSize === "64" && "i64",
              "ml-2",
              connectIconClassName
            )}
            aria-hidden
          />
        )}
      </>
    );

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          data-state-checked={checked ? "true" : undefined}
          data-state-active={active ? "true" : undefined}
          onClick={onClick}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        type={type}
        disabled={disabled}
        data-state-checked={checked ? "true" : undefined}
        data-state-active={active ? "true" : undefined}
        onClick={onClick}
        {...props}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
