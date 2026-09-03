"use client";

import { useState } from "react";

function screenshotUrl(websiteUrl: string) {
  // thum.io — free, keyless URL-to-screenshot service. Format:
  // https://image.thum.io/get/width/{w}/crop/{h}/noanimate/{url}
  return `https://image.thum.io/get/width/900/crop/560/noanimate/${websiteUrl}`;
}

export default function ToolScreenshot({
  websiteUrl,
  name,
  className = "",
}: {
  websiteUrl: string;
  name: string;
  className?: string;
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={screenshotUrl(websiteUrl)}
      alt={`Screenshot of ${name}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover object-top ${className}`}
    />
  );
}
