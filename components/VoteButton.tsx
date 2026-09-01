"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  toolId: string;
  initialNetVotes: number;
  initialUserVote: "up" | "down" | null;
  isLoggedIn: boolean;
};

export default function VoteButton({
  toolId,
  initialNetVotes,
  initialUserVote,
  isLoggedIn,
}: Props) {
  const [netVotes, setNetVotes] = useState(initialNetVotes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(
    initialUserVote
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleVote(voteType: "up" | "down") {
    if (!isLoggedIn) {
      router.push(`/login?next=${window.location.pathname}`);
      return;
    }

    // Optimistic update
    const prevVote = userVote;
    const prevNet = netVotes;

    let delta = 0;
    if (prevVote === voteType) {
      delta = voteType === "up" ? -1 : 1;
      setUserVote(null);
    } else if (prevVote === null) {
      delta = voteType === "up" ? 1 : -1;
      setUserVote(voteType);
    } else {
      delta = voteType === "up" ? 2 : -2;
      setUserVote(voteType);
    }
    setNetVotes(prevNet + delta);

    startTransition(async () => {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, voteType }),
      });
      if (!res.ok) {
        // Roll back on failure
        setUserVote(prevVote);
        setNetVotes(prevNet);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote("up")}
        disabled={isPending}
        aria-pressed={userVote === "up"}
        aria-label="Upvote"
        className={`w-9 h-9 rounded flex items-center justify-center border transition-colors ${
          userVote === "up"
            ? "bg-accent border-accent text-ink"
            : "border-line hover:border-ink"
        }`}
      >
        ▲
      </button>
      <span className="rank-badge text-lg font-bold w-10 text-center">
        {netVotes}
      </span>
      <button
        onClick={() => handleVote("down")}
        disabled={isPending}
        aria-pressed={userVote === "down"}
        aria-label="Downvote"
        className={`w-9 h-9 rounded flex items-center justify-center border transition-colors ${
          userVote === "down"
            ? "bg-ink border-ink text-base"
            : "border-line hover:border-ink"
        }`}
      >
        ▼
      </button>
    </div>
  );
}
