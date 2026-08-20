"use client";

import { LiveAPIProvider } from "@/contexts/LiveAPIContext";

interface LiveAPIWrapperProps {
  children: React.ReactNode;
  apiKey: string;
}

export default function LiveAPIWrapper({
  children,
  apiKey,
}: LiveAPIWrapperProps) {
  return <LiveAPIProvider apiKey={apiKey}>{children}</LiveAPIProvider>;
}
