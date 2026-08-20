"use client";

import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { ModusWcButton } from "@trimble-oss/moduswebcomponents-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/use-is-client";

type ModusColor = "primary" | "secondary" | "tertiary" | "warning" | "danger";
type ModusVariant = "borderless" | "filled" | "outlined";

const variantToModus: Record<string, { color: ModusColor; variant: ModusVariant }> = {
  default: { color: "primary", variant: "filled" },
  disabled: { color: "tertiary", variant: "borderless" },
  yellow: { color: "warning", variant: "filled" },
  default2: { color: "secondary", variant: "filled" },
  default3: { color: "tertiary", variant: "outlined" },
  destructive: { color: "danger", variant: "filled" },
  destructiveOutline: { color: "danger", variant: "outlined" },
  outline: { color: "primary", variant: "outlined" },
  secondary: { color: "secondary", variant: "filled" },
  ghost: { color: "tertiary", variant: "borderless" },
  ghost2: { color: "tertiary", variant: "borderless" },
  ghost3: { color: "tertiary", variant: "borderless" },
  link: { color: "tertiary", variant: "borderless" },
  toolbar: { color: "tertiary", variant: "outlined" },
  expandIcon: { color: "primary", variant: "filled" },
  expandIcon2: { color: "secondary", variant: "filled" },
  ringHover: { color: "primary", variant: "filled" },
  ringHover2: { color: "warning", variant: "filled" },
  shine: { color: "primary", variant: "filled" },
  gooeyRight: { color: "primary", variant: "filled" },
  gooeyLeft: { color: "primary", variant: "filled" },
  linkHover1: { color: "tertiary", variant: "borderless" },
  linkHover2: { color: "tertiary", variant: "borderless" },
  whiteToolbar: { color: "tertiary", variant: "outlined" },
  threeDViewport: { color: "tertiary", variant: "outlined" },
  omniSearch: { color: "tertiary", variant: "outlined" },
};

const sizeToModus: Record<string, "xs" | "sm" | "md" | "lg"> = {
  default: "md",
  sm: "sm",
  lg: "lg",
  icon: "md",
  smIcon: "sm",
  threeDViewportSmall: "sm",
  threeDViewportMedium: "md",
  threeDViewportLarge: "lg",
  threeDViewportXLarge: "lg",
};

const buttonVariants = cva("", {
  variants: {
    variant: {
      default: "",
      disabled: "",
      yellow: "",
      default2: "",
      default3: "",
      destructive: "",
      destructiveOutline: "",
      outline: "",
      secondary: "",
      ghost: "",
      ghost2: "",
      ghost3: "",
      link: "",
      toolbar: "",
      expandIcon: "",
      expandIcon2: "",
      ringHover: "",
      ringHover2: "",
      shine: "",
      gooeyRight: "",
      gooeyLeft: "",
      linkHover1: "",
      linkHover2: "",
      whiteToolbar: "",
      threeDViewport: "",
      omniSearch: "",
    },
    size: {
      default: "",
      sm: "",
      lg: "",
      icon: "",
      smIcon: "",
      threeDViewportSmall: "",
      threeDViewportMedium: "",
      threeDViewportLarge: "",
      threeDViewportXLarge: "",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

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
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
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
    const isClient = useIsClient();
    const modus = variantToModus[variant ?? "default"] ?? variantToModus.default;
    const modusSize = sizeToModus[size ?? "default"] ?? "md";
    const isIconOnly =
      size === "icon" || size === "smIcon" || size === "threeDViewportSmall" ||
      size === "threeDViewportMedium" || size === "threeDViewportLarge" || size === "threeDViewportXLarge";

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

    if (!isClient) {
      return (
        <button
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          type={type}
          disabled={disabled}
          onClick={onClick}
          {...props}
        >
          {content}
        </button>
      );
    }

    return (
      <ModusWcButton
        ref={ref as never}
        color={modus.color}
        variant={modus.variant}
        size={modusSize}
        shape={isIconOnly ? "square" : "rectangle"}
        type={type}
        disabled={disabled}
        pressed={checked ?? active ?? false}
        customClass={cn(buttonVariants({ variant, size }), className)}
        onButtonClick={(e: CustomEvent) => onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>)}
        {...(props as Record<string, unknown>)}
      >
        {content}
      </ModusWcButton>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
