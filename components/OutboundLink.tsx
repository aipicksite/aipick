"use client";

// Drop-in replacement for a plain <a target="_blank"> to an external tool
// site. Fires a beacon to /api/track-click right as the visitor clicks —
// before the new tab opens — so "where do visitors go after browsing"
// shows up in the admin analytics dashboard. Never blocks or delays the
// actual navigation.
export default function OutboundLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  function handleClick() {
    try {
      const payload = JSON.stringify({
        targetUrl: href,
        sourcePath: window.location.pathname,
        visitorId: window.localStorage.getItem("aipick_visitor_id"),
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track-click", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/track-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Never let click-tracking break the actual link.
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
