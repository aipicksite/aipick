"use client";

import { useState } from "react";

const PALETTE = [
  { bg: "#3E2A5C", fg: "#F4E3BE" }, // plum / gold
  { bg: "#28603F", fg: "#DCEBE0" }, // forest
  { bg: "#B84A3A", fg: "#F3DAD3" }, // coral
  { bg: "#C68A28", fg: "#2C1D43" }, // gold
  { bg: "#1F3A5F", fg: "#DCE6F2" }, // navy
  { bg: "#6B4226", fg: "#F0E1D2" }, // umber
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function faviconUrl(websiteUrl: string, size: number) {
  try {
    const hostname = new URL(websiteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${Math.max(size, 64)}`;
  } catch {
    return null;
  }
}

export default function ToolAvatar({
  name,
  logoUrl,
  websiteUrl,
  size = 44,
}: {
  name: string;
  logoUrl?: string | null;
  /** When provided (tool contexts, not user avatars) and no logoUrl is set,
   * falls back to the site's favicon before falling back to initials. */
  websiteUrl?: string | null;
  size?: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const imageSrc = logoUrl || (websiteUrl ? faviconUrl(websiteUrl, size) : null);

  if (imageSrc && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt=""
        width={size}
        height={size}
        onError={() => setImgFailed(true)}
        className="rounded-[10px] object-cover shrink-0 border border-line bg-surface"
        style={{ width: size, height: size }}
      />
    );
  }

  const { bg, fg } = paletteFor(name || "?");
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <div
      aria-hidden
      className="rounded-[10px] shrink-0 flex items-center justify-center font-display font-bold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}
