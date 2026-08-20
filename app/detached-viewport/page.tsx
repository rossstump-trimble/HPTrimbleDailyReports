"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DetachedViewport } from "@/components/3d-viewer/DetachedViewport";
import { ViewportDataType } from "@/components/3d-viewer/GeospatialViewport";

function DetachedViewportContent() {
  const searchParams = useSearchParams();
  const contentType = searchParams.get("contentType") as ViewportDataType;
  const dataId = searchParams.get("dataId") || undefined;

  return <DetachedViewport contentType={contentType} dataId={dataId} />;
}

export default function DetachedViewportPage() {
  return (
    <main className="w-screen h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <DetachedViewportContent />
      </Suspense>
    </main>
  );
}
