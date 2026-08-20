"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  SlidersHorizontal,
  Mic,
  MicOff,
  QrCode,
  ArrowRight,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OmniButton } from "@/components/omni/omniButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QrCodeScanner } from "@/components/omni/QrCodeScanner";
import { OmniFilters } from "@/components/omni/OmniFilters";
import { useRouter } from "next/navigation";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onerror: (event: any) => void;
  onend: () => void;
  onresult: (event: any) => void;
  onstart: () => void;
}

interface OmniSearchProps {
  initialValue?: string;
  className?: string;
  onSearch?: (query: string) => void;
  defaultEnabled?: boolean;
  disableAutoFocus?: boolean;
}

export function OmniSearch({
  initialValue = "",
  className,
  onSearch,
  defaultEnabled = false,
  disableAutoFocus = false,
}: OmniSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [isOmniEnabled, setIsOmniEnabled] = useState(defaultEnabled);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join("");

        setQuery(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Focus the input field when component mounts (only if not disabled)
  useEffect(() => {
    if (!disableAutoFocus) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [disableAutoFocus]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        // Navigate to search results page with query parameter
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleOmniSearch = () => {
    setIsOmniEnabled(!isOmniEnabled);
  };

  const handleQrCode = () => {
    setIsQrScannerOpen(true);
  };

  const handleQrCodeScan = (result: string) => {
    setQuery(result);
    setIsQrScannerOpen(false);
  };

  const handleApplyFilters = (filters: any) => {
    console.log("Applied filters:", filters);
    // Implement filter logic here
  };

  // Example searches for demonstration
  const runExampleSearch = (exampleQuery: string) => {
    setShowExamples(false);
    // Remove setting the query
    router.push(`/search?q=${encodeURIComponent(exampleQuery.trim())}`);
  };

  return (
    <div className={cn("relative z-[50]", className)}>
      <div
        className={cn(
          "flex items-center h-12 bg-background rounded-full border-2 border-gray-200 dark:border-gray-700 overflow-hidden relative z-[40]",
          className
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <OmniButton
                text="Omni"
                className="ml-[2px]"
                onClick={toggleOmniSearch}
                aria-label="Toggle Omni Search"
                active={isOmniEnabled}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isOmniEnabled ? "Disable Omni Search" : "Enable Omni Search"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <OmniFilters
              isOpen={isFiltersOpen}
              onOpenChange={setIsFiltersOpen}
              onApplyFilters={handleApplyFilters}
              trigger={
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost2"
                    size="icon"
                    className={cn(
                      "p-2 rounded-full transition-opacity ml-1",
                      !isOmniEnabled && "opacity-50 pointer-events-none"
                    )}
                    disabled={!isOmniEnabled}
                    aria-label="Search Filters"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
              }
            />
            <TooltipContent>
              <p>Search Filters</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 px-4"
          placeholder={
            isOmniEnabled ? "Search across all content..." : "Search..."
          }
          onKeyDown={handleKeyDown}
          onFocus={() => isOmniEnabled && setShowExamples(true)}
          onBlur={() => setTimeout(() => setShowExamples(false), 200)}
        />

        {speechSupported && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost2"
                  size="icon"
                  className={cn(
                    "p-2 rounded-full mr-1",
                    isListening && "text-primary"
                  )}
                  onClick={toggleListening}
                  aria-label="Voice Search"
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice Search {isListening ? "(recording)" : ""}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost2"
                size="icon"
                className="p-2 rounded-full mr-[2px]"
                onClick={handleQrCode}
                aria-label="Scan QR Code"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Scan QR Code</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={query.trim() ? "default" : "ghost2"}
                size="icon"
                className={cn(
                  "p-2 rounded-full mr-[2px]",
                  !query.trim() && "opacity-50"
                )}
                onClick={handleSearch}
                aria-label="Search"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {showExamples && isOmniEnabled && (
        <div className="absolute left-0 right-0 top-14 z-[45] bg-background border rounded-lg shadow-lg p-2">
          <div className="p-2 text-sm font-medium">Recent Searches:</div>
          <div className="grid gap-1">
            <button
              className="text-left p-2 rounded-md hover:bg-muted text-sm"
              onClick={() =>
                runExampleSearch(
                  'Search for all facade panels with material "Glass" and color "Blue" on the North elevation'
                )
              }
            >
              Search for all facade panels with material &quot;Glass&quot; and
              color &quot;Blue&quot; on the North elevation
            </button>
            <button
              className="text-left p-2 rounded-md hover:bg-muted text-sm"
              onClick={() =>
                runExampleSearch(
                  'Search for all steel beams with a cross-section "W14x90" on the 1st floor'
                )
              }
            >
              Search for all steel beams with a cross-section &quot;W14x90&quot;
              on the 1st floor
            </button>
          </div>
        </div>
      )}

      <QrCodeScanner
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScan={handleQrCodeScan}
      />
    </div>
  );
}

export default OmniSearch;
