"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/tools", label: "Browse all tools" },
  { href: "/top/top-100-ai-tools", label: "Top 100 AI Tools" },
  { href: "/top/best-free-ai-tools", label: "Free AI Tools" },
  { href: "/category", label: "Categories" },
  { href: "/top/trending-ai-tools", label: "Trending" },
  { href: "/compare", label: "Compare" },
  { href: "/submit", label: "Submit a tool" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2 -mr-2 rounded-md hover:bg-ink/5 transition-colors"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 z-40 bg-base border-b border-line shadow-card md:hidden">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-[15px] font-medium rounded-md hover:bg-ink/5 transition-colors border-b border-line last:border-b-0"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
