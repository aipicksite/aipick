"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ListLikeButton({
  listId,
  initialLiked,
  initialCount,
  isLoggedIn,
}: {
  listId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (isPending) return;

    if (!isLoggedIn) {
      router.push(`/login?next=/lists/${listId}`);
      return;
    }

    // Optimistic toggle, same pattern as the reviews helpful-vote button.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((n) => (nextLiked ? n + 1 : Math.max(n - 1, 0)));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/lists/${listId}/like`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.liked === "boolean") setLiked(data.liked);
          if (typeof data.count === "number") setCount(data.count);
        } else {
          // roll back on failure
          setLiked(liked);
          setCount((n) => (nextLiked ? Math.max(n - 1, 0) : n + 1));
        }
      } catch {
        setLiked(liked);
        setCount((n) => (nextLiked ? Math.max(n - 1, 0) : n + 1));
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border transition-colors disabled:opacity-60 ${
        liked
          ? "border-plum bg-plum/10 text-plum"
          : "border-line text-ink/60 hover:border-plum hover:text-plum"
      }`}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      {count}
    </button>
  );
}
