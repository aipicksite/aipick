"use client";

import { useEffect, useState } from "react";

type Props = {
  toolId: string;
  initialUp: number;
  initialDown: number;
};

type RecommendUpdatedDetail = { toolId: string; up: number; down: number };

// Renders the anonymous "visitor poll" result — separate from the
// logged-in member vote stats (upvotes/downvotes on the tools table,
// shown via VoteButton / the "would recommend" line elsewhere on this
// page). This reads from `tool_recommend_votes`, the no-login table the
// floating widget writes to. It starts from the server-fetched counts
// and stays in sync afterwards by listening for the
// "aipick:recommend-updated" event the widget fires right after a vote
// succeeds — no page reload needed.
export default function RecommendStats({ toolId, initialUp, initialDown }: Props) {
  const [up, setUp] = useState(initialUp);
  const [down, setDown] = useState(initialDown);

  useEffect(() => {
    function onUpdate(e: Event) {
      const detail = (e as CustomEvent<RecommendUpdatedDetail>).detail;
      if (!detail || detail.toolId !== toolId) return;
      setUp(detail.up);
      setDown(detail.down);
    }
    window.addEventListener("aipick:recommend-updated", onUpdate);
    return () => window.removeEventListener("aipick:recommend-updated", onUpdate);
  }, [toolId]);

  const total = up + down;
  if (total === 0) return null;

  const ratio = Math.round((up / total) * 100);

  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink/50">Visitor poll</dt>
      <dd className="font-medium">
        👍 {ratio}%{" "}
        <span className="text-ink/40 font-normal">({total} votes)</span>
      </dd>
    </div>
  );
}
