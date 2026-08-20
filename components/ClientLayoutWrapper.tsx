"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

// Create a separate component for search params
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  return null;
}

export default function ClientLayoutWrapper({
  children,
}: ClientLayoutWrapperProps) {
  return (
    <Suspense fallback={null}>
      <SearchParamsHandler />

      {children}
    </Suspense>
  );
}
