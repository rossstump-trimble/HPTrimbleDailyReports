"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface LoadingScreenProps {
  duration?: number;
  message?: string;
}

export function LoadingScreen({
  duration = 2000,
  message = "Loading Trimble viewer experience...",
}: LoadingScreenProps) {
  const [show, setShow] = useState(true);
  const [timerComplete, setTimerComplete] = useState(false);

  useEffect(() => {
    const minShowTime = setTimeout(() => {
      setTimerComplete(true);
    }, duration);

    return () => clearTimeout(minShowTime);
  }, [duration]);

  // Force component to stay visible for minimum duration
  useEffect(() => {
    if (!timerComplete) return;

    // Only hide after timer completes
    setShow(false);
  }, [timerComplete]);

  if (!show) return null;

  return (
    <div className="flex items-center justify-center h-full w-full bg-background dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/logos/connect-light.svg"
          alt="Trimble Connect"
          className="h-8 w-auto mt-2"
          width={100}
          height={32}
        />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
