"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ToolAvatar from "./ToolAvatar";

export default function UserMenu({
  email,
  username,
  isAdmin,
}: {
  email: string;
  username: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const label = username ? `@${username}` : email;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-line hover:border-plum transition-colors"
      >
        <ToolAvatar name={username ?? email} size={28} />
        <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
          {label}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-line rounded-lg shadow-lift py-1.5 text-sm z-40">
          <div className="px-3.5 py-2 text-ink/45 text-xs border-b border-line truncate">{email}</div>
          <Link href="/account" className="block px-3.5 py-2 hover:bg-ink/5" onClick={() => setOpen(false)}>
            Account settings
          </Link>
          <Link href="/saved" className="block px-3.5 py-2 hover:bg-ink/5" onClick={() => setOpen(false)}>
            Saved tools
          </Link>
          {isAdmin && (
            <Link href="/admin" className="block px-3.5 py-2 hover:bg-ink/5" onClick={() => setOpen(false)}>
              Admin
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button type="submit" className="w-full text-left px-3.5 py-2 hover:bg-ink/5 text-coral">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
