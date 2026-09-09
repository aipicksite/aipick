"use client";

import { useState } from "react";

function thumbUrl(websiteUrl: string) {
  return `https://image.thum.io/get/width/480/noanimate/${websiteUrl}`;
}

export default function FeaturedThumb({
  websiteUrl,
  overrideUrl,
  name,
  priority = false,
}: {
  websiteUrl: string;
  overrideUrl?: string | null;
  name: string;
  /** Set true for cards visible without scrolling (first row) so the
   * browser fetches them eagerly at high priority instead of lazily —
   * these are third-party (thum.io) screenshots and can otherwise become
   * the page's LCP element and load slowly. Leave false for every card
   * below the fold. */
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-plum to-plum-deep text-white font-display font-bold text-lg">
        {(name || "?").trim().charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={overrideUrl || thumbUrl(websiteUrl)}
      alt={`${name} screenshot`}
      width={480}
      height={300}
      loading={priority ? "eager" : "lazy"}
      // @ts-expect-error - fetchpriority isn't in React's img attr types yet
      fetchpriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
    />
  );
}
