"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function SaveButton({
  toolId,
  initialSaved,
  isLoggedIn,
}: {
  toolId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=${window.location.pathname}`);
      return;
    }

    const prev = saved;
    setSaved(!prev);

    startTransition(async () => {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId }),
      });
      if (!res.ok) setSaved(prev);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save this tool"}
      title={saved ? "Saved" : "Save for later"}
      className={`w-9 h-9 rounded-md flex items-center justify-center border transition-colors ${
        saved
          ? "bg-gold border-gold text-plum-deep"
          : "border-line hover:border-gold hover:text-gold"
      }`}
    >
      {saved ? "★" : "☆"}
    </button>
  );
}
