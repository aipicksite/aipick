"use client";

import { useEffect, useRef } from "react";

// Same visitor-id pattern used elsewhere in this codebase (e.g.
// ReviewSection's helpful-vote tracking, the recommend widget) —
// deliberately reuses the same "aipick_visitor_id" localStorage key so a
// given browser counts as the same visitor across every feature that
// tracks one, including "unique visitors" on the analytics dashboard.
function getVisitorId(): string | null {
  try {
    const existing = window.localStorage.getItem("aipick_visitor_id");
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem("aipick_visitor_id", fresh);
    return fresh;
  } catch {
    return null;
  }
}

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

    const params = new URLSearchParams(window.location.search);

    const payload = JSON.stringify({
      path: path + (window.location.search || ""),
      toolId: toolId ?? null,
      referrer: document.referrer || null,
      visitorId: getVisitorId(),
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
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
