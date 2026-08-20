"use client";

import * as React from "react";

// ModusWcThemeProvider is intentionally excluded — it calls watchSystemTheme()
// on mount and overwrites the <html> class with the OS dark mode preference,
// which conflicts with our next-themes setup. Modus component styles still
// work via the imported modus-wc-styles.css.
export function ModusProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
