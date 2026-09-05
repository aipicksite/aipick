"use client";

import { useState } from "react";

export default function CopyLinkButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard API can fail in some browsers/contexts — fail silently
        }
      }}
      className="bg-plum text-white rounded px-4 py-2 text-sm font-medium hover:bg-plum-deep transition-colors shrink-0"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
