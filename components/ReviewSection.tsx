"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StarRating from "./StarRating";
import type { Review } from "@/types/database";

type ReviewWithAuthor = Review & { author_label: string };

export default function ReviewSection({
  toolId,
  toolName,
  isLoggedIn,
  myReview,
  otherReviews,
  ratingAvg,
  ratingCount,
}: {
  toolId: string;
  toolName: string;
  isLoggedIn: boolean;
  myReview: Review | null;
  otherReviews: ReviewWithAuthor[];
  ratingAvg: number;
  ratingCount: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!myReview);
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [body, setBody] = useState(myReview?.body ?? "");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(
    myReview?.would_recommend ?? null
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push(`/login?next=/tool/${toolId}`);
      return;
    }
    if (rating < 1) {
      setError("একটা রেটিং দিন (কমপক্ষে ১ তারা)।");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, rating, wouldRecommend, body }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError("রিভিউ সেভ করা যায়নি — আবার চেষ্টা করুন।");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId }),
      });
      setRating(0);
      setBody("");
      setWouldRecommend(null);
      setEditing(true);
      router.refresh();
    });
  }

  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display font-bold text-xl">Reviews</h2>
        {ratingCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <StarRating value={Math.round(ratingAvg)} readOnly size={16} />
            <span className="font-medium">{ratingAvg.toFixed(1)}</span>
            <span className="text-ink/45">({ratingCount})</span>
          </div>
        )}
      </div>

      {/* My review — write or edit */}
      <div className="mt-5 bg-surface border border-line rounded-lg p-5">
        {!editing && myReview ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarRating value={myReview.rating} readOnly size={18} />
                <span className="text-sm text-ink/45">Your review</span>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => setEditing(true)} className="text-plum hover:underline">
                  Edit
                </button>
                <button onClick={handleDelete} disabled={isPending} className="text-coral hover:underline">
                  Delete
                </button>
              </div>
            </div>
            {myReview.body && <p className="text-sm text-ink/70 mt-2 leading-relaxed">{myReview.body}</p>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Your rating</span>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`What's it like using ${toolName}? (optional)`}
              rows={3}
              className="w-full bg-base border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-plum"
            />
            <div className="flex items-center gap-3 text-sm">
              <span className="text-ink/60">Would you recommend it?</span>
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`px-2.5 py-1 rounded-full border ${
                  wouldRecommend === true ? "bg-forest-soft border-forest text-forest" : "border-line"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`px-2.5 py-1 rounded-full border ${
                  wouldRecommend === false ? "bg-coral-soft border-coral text-coral" : "border-line"
                }`}
              >
                No
              </button>
            </div>
            {error && <p className="text-sm text-coral">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="bg-plum text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-plum-deep transition-colors disabled:opacity-60"
              >
                {isLoggedIn ? "Post review" : "Sign in to post a review"}
              </button>
              {myReview && (
                <button type="button" onClick={() => setEditing(false)} className="text-sm text-ink/50 hover:text-ink">
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Everyone else's reviews */}
      <div className="mt-4 flex flex-col gap-3">
        {otherReviews.map((r) => (
          <div key={r.id} className="bg-surface border border-line rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarRating value={r.rating} readOnly size={16} />
                <span className="text-sm font-medium text-ink/70">{r.author_label}</span>
              </div>
              {r.would_recommend !== null && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    r.would_recommend ? "bg-forest-soft text-forest" : "bg-coral-soft text-coral"
                  }`}
                >
                  {r.would_recommend ? "Recommends" : "Doesn't recommend"}
                </span>
              )}
            </div>
            {r.body && <p className="text-sm text-ink/70 mt-2 leading-relaxed">{r.body}</p>}
          </div>
        ))}
        {otherReviews.length === 0 && !myReview && (
          <p className="text-sm text-ink/50 py-6">Be the first to review {toolName}.</p>
        )}
      </div>
    </section>
  );
}
