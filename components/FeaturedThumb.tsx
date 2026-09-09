"use client";

import { useState } from "react";

function thumbUrl(websiteUrl: string) {
  return `https://image.thum.io/get/width/480/noanimate/${websiteUrl}`;
}

export default function FeaturedThumb({
  websiteUrl,
  overrideUrl,
  name,
}: {
  websiteUrl: string;
  overrideUrl?: string | null;
  name: string;
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
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
    />
  );
}
