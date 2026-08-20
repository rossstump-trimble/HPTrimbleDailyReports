"use client";

import * as React from "react";
import { ModusWcTextInput } from "@trimble-oss/moduswebcomponents-react";
import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/use-is-client";

const MODUS_INPUT_TYPES = ["date", "email", "number", "password", "search", "tel", "text", "url", "time", "week", "month", "datetime-local"] as const;

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  size?: "sm" | "md" | "lg";
}

const Input = React.forwardRef<HTMLElement, InputProps>(
  ({ className, type = "text", value, onChange, size = "md", id, name, placeholder, disabled, readOnly, required, maxLength, minLength, pattern, ...rest }, ref) => {
    const isClient = useIsClient();
    const modusType = MODUS_INPUT_TYPES.includes(type as (typeof MODUS_INPUT_TYPES)[number]) ? type : "text";
    const [internalValue, setInternalValue] = React.useState(
      value === undefined ? "" : String(value)
    );
    const isControlled = value !== undefined;
    const displayValue = isControlled ? String(value) : internalValue;

    const handleInputChange = (e: CustomEvent) => {
      const newValue = e.detail?.target?.value ?? "";
      if (!isControlled) setInternalValue(newValue);
      onChange?.(
        { target: { value: newValue } } as React.ChangeEvent<HTMLInputElement>
      );
    };

    React.useEffect(() => {
      if (isControlled) setInternalValue(String(value));
    }, [value, isControlled]);

    if (!isClient) {
      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          type={type}
          value={displayValue}
          onChange={(e) => onChange?.(e)}
          className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)}
          id={id}
          name={name}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          {...rest}
        />
      );
    }

    return (
      <ModusWcTextInput
        ref={ref as never}
        value={displayValue}
        type={modusType as "text" | "search" | "email" | "password" | "tel" | "url" | "number" | "date" | "time" | "week" | "month" | "datetime-local"}
        size={size}
        bordered={true}
        inputId={id}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        customClass={cn(className)}
        onInputChange={handleInputChange}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
