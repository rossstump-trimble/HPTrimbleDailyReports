"use client";

import React, { Suspense, useState, useEffect } from "react";

// Workspace type
export type WorkspaceType = "bim" | "geospatial" | "maya" | "quadri";

// Loading fallback component
function Loading() {
  const [show, setShow] = useState(true);
  const [timerComplete, setTimerComplete] = useState(false);

  useEffect(() => {
    const minShowTime = setTimeout(() => {
      setTimerComplete(true);
    }, 4000);

    return () => clearTimeout(minShowTime);
  }, []);

  // Force component to stay visible for minimum duration
  useEffect(() => {
    if (!timerComplete) return;

    // Only hide after timer completes
    setShow(false);
  }, [timerComplete]);

  if (!show) return null;

  return (
    <div className="flex items-center justify-center h-screen w-full bg-background dark:bg-gray-900">
      {/* <div className="flex flex-col items-center gap-3">
        <Image
          src="/logos/connect-light.svg"
          alt="Trimble Connect"
          className="h-24 w-auto"
          width={100}
          height={100}
        />
        <p className="text-sm text-muted-foreground">
          Loading Trimble viewer experience...
        </p>{" "}
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div> */}
    </div>
  );
}

// Client Component that uses useSearchParams
import dynamic from "next/dynamic";

// Use dynamic import with ssr: false to avoid the hydration issues
const ThreeDViewerClient = dynamic(
  () => import("@/components/3d-viewer/ThreeDViewerClient"),
  {
    ssr: false,
    loading: () => <Loading />,
  }
);

export default function ThreeDViewer() {
  return (
    <Suspense fallback={<Loading />}>
      <ThreeDViewerClient />
    </Suspense>
  );
}
