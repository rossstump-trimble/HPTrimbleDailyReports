"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";

interface DescriptionEditorScreenProps {
  value: string;
  onSave: (value: string) => void;
  onBack: () => void;
  label?: string;
  singleLine?: boolean;
}

export default function DescriptionEditorScreen({
  value,
  onSave,
  onBack,
  label = "Description",
  singleLine = false,
}: DescriptionEditorScreenProps) {
  const [text, setText] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus and move cursor to end
    if (textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, []);

  const handleDone = () => {
    onSave(text);
    onBack();
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header
        className="flex items-center px-3 py-3 flex-none gap-2"
        style={{ backgroundColor: "#1b3a5c" }}
      >
        <button
          onClick={onBack}
          className="text-white opacity-90 hover:opacity-100 p-1"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-white font-semibold text-base">{label}</span>
        <button
          onClick={handleDone}
          className="text-white opacity-70 hover:opacity-100 text-sm font-medium"
        >
          Done
        </button>
      </header>

      {/* Input area */}
      <div className="flex-1 overflow-hidden">
        {singleLine ? (
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleDone(); }}
            className="w-full px-4 py-4 text-sm text-gray-800 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none border-b border-gray-200 dark:border-gray-800"
            placeholder={`Enter ${label.toLowerCase()}…`}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-full resize-none p-4 text-sm text-gray-800 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed focus:outline-none"
            placeholder={`Enter ${label.toLowerCase()}…`}
          />
        )}
      </div>
    </div>
  );
}
