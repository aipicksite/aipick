"use client";

import { useEffect, useState } from "react";

type Props = {
  toolId: string;
  initialUp: number;
  initialDown: number;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left" | string;
};

const POSITION_CLASSES: Record<string, string> = {
  "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6",
  "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6",
  "top-right": "top-4 right-4 sm:top-6 sm:right-6",
  "top-left": "top-4 left-4 sm:top-6 sm:left-6",
};

const VISIBLE_MS = 400; // fade-in
const RESULT_HOLD_MS = 3000; // how long the result is shown before auto-hide

function storageKey(toolId: string) {
  return `aipick_recommend_${toolId}`;
}

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem("aipick_visitor_id");
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem("aipick_visitor_id", fresh);
    return fresh;
  } catch {
    // localStorage unavailable (e.g. blocked) — fall back to a
    // per-page-load id; the widget just won't remember across visits.
    return `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

export default function FloatingRecommendWidget({
  toolId,
  initialUp,
  initialDown,
  position,
}: Props) {
  const [status, setStatus] = useState<
    "hidden" | "prompt" | "result" | "gone"
  >("hidden");
  const [up, setUp] = useState(initialUp);
  const [down, setDown] = useState(initialDown);
  const [myVote, setMyVote] = useState<"up" | "down" | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.localStorage.getItem(storageKey(toolId));
      if (saved === "dismissed") {
        setStatus("gone");
        return;
      }
      if (saved === "up" || saved === "down") {
        setMyVote(saved);
        setStatus("gone");
        return;
      }
    } catch {
      // ignore — treat as never-shown
    }
    const t = setTimeout(() => setStatus("prompt"), VISIBLE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

  function dismiss() {
    setStatus("gone");
    try {
      window.localStorage.setItem(storageKey(toolId), "dismissed");
    } catch {
      // ignore
    }
  }

  async function handleVote(voteType: "up" | "down") {
    if (isPending) return;
    setIsPending(true);
    setMyVote(voteType);
    // Optimistic bump so the result feels instant.
    if (voteType === "up") setUp((n) => n + 1);
    else setDown((n) => n + 1);
    setStatus("result");

    try {
      const res = await fetch("/api/tool-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          sessionId: getVisitorId(),
          voteType,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.up === "number") setUp(data.up);
        if (typeof data.down === "number") setDown(data.down);
      }
    } catch {
      // Keep the optimistic counts — voting still "worked" for the
      // visitor even if the network call failed.
    }

    try {
      window.localStorage.setItem(storageKey(toolId), voteType);
    } catch {
      // ignore
    }

    setTimeout(() => setStatus("gone"), RESULT_HOLD_MS);
  }

  if (!mounted || status === "hidden" || status === "gone") return null;

  const total = up + down;
  const upRatio = total > 0 ? Math.round((up / total) * 100) : null;
  const posClasses = POSITION_CLASSES[position] ?? POSITION_CLASSES["bottom-right"];

  return (
    <div
      className={`fixed z-40 ${posClasses} w-[260px] bg-white border border-line rounded-xl shadow-lg p-4 transition-opacity duration-300`}
      role="dialog"
      aria-label="Recommend this tool"
    >
      <button
        onClick={dismiss}
        aria-label="Close"
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-ink/40 hover:text-ink hover:bg-line/40 transition-colors"
      >
        ×
      </button>

      {status === "prompt" && (
        <>
          <p className="text-sm font-medium text-ink pr-5">
            Recommend this tool?
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => handleVote("up")}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 border border-line rounded-md py-2 text-sm font-medium hover:border-forest hover:text-forest hover:bg-forest-soft transition-colors"
            >
              👍 Like
            </button>
            <button
              onClick={() => handleVote("down")}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 border border-line rounded-md py-2 text-sm font-medium hover:border-coral hover:text-coral hover:bg-coral-soft transition-colors"
            >
              👎 Dislike
            </button>
          </div>
        </>
      )}

      {status === "result" && (
        <div className="pr-5">
          <p className="text-sm font-medium text-ink">
            {myVote === "up" ? "Thanks for the 👍!" : "Thanks for the feedback!"}
          </p>
          <p className="text-xs text-ink/55 mt-1.5">
            {upRatio !== null ? (
              <>
                <span className="font-medium text-forest">{upRatio}%</span>{" "}
                would recommend this tool
                <span className="text-ink/40"> ({total} votes)</span>
              </>
            ) : (
              "Your vote has been counted."
            )}
          </p>
        </div>
      )}
    </div>
  );
}
