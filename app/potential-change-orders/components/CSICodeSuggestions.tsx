"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Search } from "lucide-react";
import type { CSICodeSuggestion } from "./types";
import { ConfidenceIndicator } from "./ConfidenceIndicator";

interface CSICodeSuggestionsProps {
  suggestions: CSICodeSuggestion[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  pcoDescription: string;
}

export function CSICodeSuggestions({ suggestions, selectedCode, onSelect, pcoDescription }: CSICodeSuggestionsProps) {
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          CSI Code Suggestions
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] text-muted-foreground"
          onClick={() => setShowManualSearch(!showManualSearch)}
        >
          <Search className="h-3 w-3 mr-1" />
          {showManualSearch ? "Hide search" : "Manual search"}
        </Button>
      </div>

      {pcoDescription && (
        <div className="rounded-md border bg-muted/30 px-3 py-2">
          <p className="text-[11px] text-muted-foreground leading-tight">
            <span className="font-medium">Analyzed:</span> {pcoDescription}
          </p>
        </div>
      )}

      {showManualSearch && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search CSI codes (e.g. 03 30 00)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      )}

      <div className="space-y-1.5">
        {suggestions.map((suggestion, idx) => {
          const isSelected = selectedCode === suggestion.code;
          return (
            <button
              key={idx}
              onClick={() => onSelect(suggestion.code)}
              className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                isSelected
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-950 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800"
                  : "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/50"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center rounded-full border text-foreground font-mono text-[10px] px-1.5 py-0 flex-shrink-0">
                    {suggestion.code}
                  </span>
                  <span className="text-xs font-medium truncate">{suggestion.title}</span>
                </span>
                <span className="flex items-center gap-1.5 flex-shrink-0">
                  <ConfidenceIndicator score={suggestion.confidence} size="sm" />
                  {isSelected && (
                    <span className="inline-flex h-4 w-4 rounded-full bg-blue-600 items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                </span>
              </span>
              <span className="block text-[11px] text-muted-foreground mt-1 leading-snug">
                {suggestion.matchReason}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
