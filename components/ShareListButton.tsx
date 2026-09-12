"use client";

import { useState } from "react";

export default function ShareListButton({ listId }: { listId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}/lists/${listId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (older browsers, insecure context) —
      // fall back to a manual prompt so the link is still copyable.
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border border-line text-ink/60 hover:border-plum hover:text-plum transition-colors"
    >
      {copied ? "✓ Copied" : "🔗 Share"}
    </button>
  );
}
