"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DeleteListButton({ listId }: { listId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!confirm("Delete this list? This can't be undone.")) return;
    startTransition(async () => {
      await fetch(`/api/lists/${listId}`, { method: "DELETE" });
      router.push("/lists");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="shrink-0 text-xs font-medium text-coral hover:underline"
    >
      Delete list
    </button>
  );
}
