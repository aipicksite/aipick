"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RemoveFromListButton({
  listId,
  toolId,
}: {
  listId: string;
  toolId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await fetch(`/api/lists/${listId}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId }),
      });
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Remove from list"
      className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-ink/40 hover:text-coral hover:bg-coral/10 transition-colors"
    >
      ✕
    </button>
  );
}
