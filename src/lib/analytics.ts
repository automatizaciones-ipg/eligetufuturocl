// src/lib/analytics.ts
// Utility delgada para disparar eventos a Google Analytics 4.
// Es segura en SSR (chequea `typeof window`) y no lanza si GA4 no está cargado.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params ?? {});
  }
}
