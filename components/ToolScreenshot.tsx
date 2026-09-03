"use client";

import { useState } from "react";
import Logo from "./Logo";

function screenshotUrl(websiteUrl: string) {
  // thum.io — free, keyless URL-to-screenshot service. No crop param here —
  // we fetch the natural screenshot and let the frame below handle fitting
  // it without cutting anything off.
  return `https://image.thum.io/get/width/1200/noanimate/${websiteUrl}`;
}

function hostnameOf(websiteUrl: string) {
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    return websiteUrl;
  }
}

export default function ToolScreenshot({
  websiteUrl,
  overrideUrl,
  name,
  className = "",
}: {
  websiteUrl: string;
  /** Manual screenshot set by an admin/owner — used instead of the
   * auto-generated one when the auto one shows a bot-check page or looks
   * wrong. Set via tools.screenshot_url. */
  overrideUrl?: string | null;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`flex flex-col bg-gradient-to-br from-plum via-plum to-plum-deep ${className}`}
    >
      {/* Browser-window chrome bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-coral" />
        <span className="w-2.5 h-2.5 rounded-full bg-gold" />
        <span className="w-2.5 h-2.5 rounded-full bg-forest" />
        <span className="ml-2.5 text-[11px] text-white/60 bg-white/10 rounded-full px-2.5 py-0.5 truncate">
          {hostnameOf(websiteUrl)}
        </span>
        <span className="ml-auto shrink-0 opacity-80">
          <Logo size={16} />
        </span>
      </div>

      {/* Screenshot, fully contained — nothing gets cropped */}
      <div className="flex-1 bg-base/95 p-3 sm:p-4 flex items-center justify-center min-h-0">
        {failed ? (
          <div className="font-display font-semibold text-ink/40 text-sm">
            {name}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={overrideUrl || screenshotUrl(websiteUrl)}
            alt={`Screenshot of ${name}`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="max-w-full max-h-full object-contain rounded-sm shadow-lift"
          />
        )}
      </div>
    </div>
  );
}
