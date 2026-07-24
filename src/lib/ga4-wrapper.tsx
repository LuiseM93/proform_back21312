"use client";

import { useEffect, useRef } from "react";

export type GA4EventName =
  | "generate_click"
  | "download_pdf"
  | "upgrade_click"
  | "pricing_view";

/**
 * Call this in components to track a GA4 event.
 * Safe to call server-side (no-op).
 */
export function trackGA4(eventName: GA4EventName, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && typeof (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag === "function") {
    (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.("event", eventName, params);
  }
}

/**
 * Hook: fires a GA4 event once when the component mounts.
 */
export function useTrackOnce(eventName: GA4EventName, params?: Record<string, string | number | boolean>) {
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      trackGA4(eventName, params);
    }
  }, [eventName]); // eslint-disable-line react-hooks/exhaustive-deps
}
