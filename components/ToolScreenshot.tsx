"use client";

import { useState } from "react";
import Logo from "./Logo";

function screenshotUrl(websiteUrl: string) {
  // thum.io — free, keyless URL-to-screenshot service. Format:
  // https://image.thum.io/get/width/{w}/crop/{h}/noanimate/{url}
  return `https://image.thum.io/get/width/900/crop/560/noanimate/${websiteUrl}`;
}

export default function ToolScreenshot({
  websiteUrl,
  overrideUrl,
  name,
  className = "",
  watermark = true,
}: {
  websiteUrl: string;
  /** Manual screenshot set by an admin/owner — used instead of the
   * auto-generated one when the auto one shows a bot-check page or looks
   * wrong. Set via tools.screenshot_url. */
  overrideUrl?: string | null;
  name: string;
  className?: string;
  /** Small AIPick logo badge in the corner — off by default for tiny
   * thumbnails where it would just be noise. */
  watermark?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-plum to-plum-deep text-white/70 font-display font-semibold ${className}`}
      >
        {name}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={overrideUrl || screenshotUrl(websiteUrl)}
        alt={`Screenshot of ${name}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover object-top"
      />
      {watermark && (
        <div className="absolute bottom-2 right-2 opacity-90 drop-shadow-md">
          <Logo size={26} />
        </div>
      )}
    </div>
  );
}
