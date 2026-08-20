"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

function SearchParamsHandler() {
  useSearchParams();
  return null;
}

export default function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={cn("relative", className)}>
      <Suspense fallback={null}>
        <SearchParamsHandler />
        {children}
      </Suspense>
    </div>
  );
}
