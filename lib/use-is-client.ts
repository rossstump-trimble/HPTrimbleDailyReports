"use client";

import { useState, useEffect } from "react";

let hydrated = false;

export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(hydrated);
  useEffect(() => {
    hydrated = true;
    setIsClient(true);
  }, []);
  return isClient;
}
