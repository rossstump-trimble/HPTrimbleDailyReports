"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export interface FeedbackIdentity {
  name?: string;
  email?: string;
  id?: string;
}

export interface FeedbackWidgetOptions {
  apiBase?: string;
  scriptSrc?: string;
  cssHref?: string;
  hotkey?: string;
  icon?: "bug" | "question";
  category?: "general" | "bug" | "feature";
  title?: string;
  mount?: string | HTMLElement | null;
  enabled?: boolean;
  captureScreenshots?: boolean;
  html2canvasSrc?: string | null | false;
  getCurrentUser?: () => FeedbackIdentity | null;
}

declare global {
  interface Window {
    FeedbackWidget?: {
      init: (options?: Record<string, unknown>) => { toggle: () => void; remount?: (m?: any) => void } | undefined;
      destroy?: () => void;
    };
  }
}

export function FeedbackWidgetProvider({
  apiBase = "",
  scriptSrc = "/feedback-tool/feedback-widget.js",
  cssHref = "/feedback-tool/feedback-widget.css",
  hotkey = "b",
  icon = "bug",
  category = "bug",
  title = "Report a Bug",
  mount = "#feedback-widget-mount",
  enabled = true,
  captureScreenshots = true,
  html2canvasSrc,
  getCurrentUser,
}: FeedbackWidgetOptions): null {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const boot = () => {
      window.FeedbackWidget?.init({
        apiBase: apiBase || window.location.origin,
        hotkey,
        icon,
        category,
        title,
        mount,
        captureScreenshots,
        html2canvasSrc,
        getCurrentUser,
      });
    };

    let link: HTMLLinkElement | null = null;
    if (!document.head.querySelector(`link[href="${cssHref}"]`)) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssHref;
      document.head.appendChild(link);
    }

    if (window.FeedbackWidget) {
      boot();
      return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.onload = boot;
    document.body.appendChild(script);

    return () => {
      // Keep widget active across client navigations
    };
  }, [
    pathname,
    apiBase,
    scriptSrc,
    cssHref,
    hotkey,
    icon,
    category,
    title,
    mount,
    enabled,
    captureScreenshots,
    html2canvasSrc,
    getCurrentUser,
  ]);

  return null;
}

