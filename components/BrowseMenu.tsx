"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const ITEMS = [
  { href: "/top/top-100-ai-tools", label: "Top 100 AI Tools" },
  { href: "/top/best-free-ai-tools", label: "Free AI Tools" },
  { href: "/category", label: "Categories" },
];

export default function BrowseMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="px-3 py-2 rounded-md hover:bg-ink/5 transition-colors flex items-center gap-1"
      >
        Browse
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-52 bg-surface border border-line rounded-lg shadow-lift py-1.5 text-sm z-40">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3.5 py-2 hover:bg-ink/5"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="border-t border-line my-1.5" />
          <Link
            href="/tools"
            className="block px-3.5 py-2 hover:bg-ink/5 text-ink/60"
            onClick={() => setOpen(false)}
          >
            All tools →
          </Link>
        </div>
      )}
    </div>
  );
}
