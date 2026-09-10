"use client";

import { useEffect, useRef } from "react";

// Renders nothing — fires a single page-view beacon on mount using the
// browser's own document.referrer (more reliable than the server's
// `referer` header, and unaffected by ISR/page caching: this runs on
// every real visit, not once per cache-refresh). Uses sendBeacon when
// available so the request survives even if the visitor navigates away
// immediately.
export default function PageViewTracker({
  path,
  toolId,
}: {
  path: string;
  toolId?: string | null;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const payload = JSON.stringify({
      path: path + (window.location.search || ""),
      toolId: toolId ?? null,
      referrer: document.referrer || null,
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track-view", blob);
      } else {
        fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Analytics must never break the page.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, toolId]);

  return null;
}
