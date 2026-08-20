import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  onSingleClick?: () => void;
  className?: string;
  inputClassName?: string;
  type?: "text" | "number";
  min?: number;
  suffix?: string;
}

export function InlineEdit({
  value,
  onSave,
  onSingleClick,
  className,
  inputClassName,
  type = "text",
  min,
  suffix,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, value]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  }, [draft, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If there's a single-click handler, use a timer to distinguish from double-click
    if (onSingleClick) {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
      }
      clickTimer.current = setTimeout(() => {
        onSingleClick();
        clickTimer.current = null;
      }, 250);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    setEditing(true);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        min={min}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(
          "bg-secondary border border-primary/30 rounded px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-primary/50",
          inputClassName
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={cn("cursor-text hover:bg-secondary/60 rounded px-0.5 -mx-0.5 transition-colors", className)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      {value}{suffix}
    </span>
  );
}
