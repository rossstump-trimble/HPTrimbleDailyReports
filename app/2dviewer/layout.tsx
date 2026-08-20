"use client";

import React from "react";

export default function TwoDViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen flex flex-col bg-background">{children}</div>;
}
