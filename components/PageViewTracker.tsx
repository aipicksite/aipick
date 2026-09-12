"use client";

import { useEffect, useRef } from "react";

// Same visitor-id pattern used elsewhere in this codebase (ReviewSection's
// helpful-vote tracking, the recommend widget) — reuses the same
// "aipick_visitor_id" localStorage key so a browser counts as the same
// visitor across every feature that tracks one.
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

function newViewId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `pv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function sendBeaconOrFetch(url: string, payload: string) {
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analytics must never break the page.
  }
}

// Renders nothing. Fires one page-view beacon on mount, then a second
// "how long were they here" beacon when the visitor actually leaves the
// page — tracked via the Page Visibility API (fires reliably on mobile
// tab-switch/app-switch, unlike beforeunload) with pagehide as a fallback
// for the rare case visibilitychange doesn't fire first.
export default function PageViewTracker({
  path,
  toolId,
}: {
  path: string;
  toolId?: string | null;
}) {
  const sent = useRef(false);
  const durationSent = useRef(false);
  const viewIdRef = useRef<string>("");
  const mountedAtRef = useRef<number>(0);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const viewId = newViewId();
    viewIdRef.current = viewId;
    mountedAtRef.current = Date.now();

    const params = new URLSearchParams(window.location.search);

    sendBeaconOrFetch(
      "/api/track-view",
      JSON.stringify({
        path: path + (window.location.search || ""),
        toolId: toolId ?? null,
        referrer: document.referrer || null,
        visitorId: getVisitorId(),
        viewId,
        utmSource: params.get("utm_source"),
        utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"),
      })
    );

    function sendDuration() {
      if (durationSent.current) return;
      durationSent.current = true;
      const seconds = Math.round((Date.now() - mountedAtRef.current) / 1000);
      // Skip near-instant bounces — not meaningful "time on page" data,
      // just noise from someone hitting back immediately.
      if (seconds < 1) return;
      sendBeaconOrFetch(
        "/api/track-view/duration",
        JSON.stringify({ viewId: viewIdRef.current, durationSeconds: seconds })
      );
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") sendDuration();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendDuration);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendDuration);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, toolId]);

  return null;
}
