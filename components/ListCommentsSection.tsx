"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  authorLabel: string;
  isMine: boolean;
};

export default function ListCommentsSection({
  listId,
  initialComments,
  isLoggedIn,
  isListOwner,
}: {
  listId: string;
  initialComments: Comment[];
  isLoggedIn: boolean;
  isListOwner: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Keep in sync if the server-rendered list changes on navigation.
  useEffect(() => setComments(initialComments), [initialComments]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push(`/login?next=/lists/${listId}`);
      return;
    }
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch(`/api/lists/${listId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setComments((prev) => [...prev, data.comment]);
      setBody("");
    });
  }

  function handleDelete(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    startTransition(async () => {
      await fetch(`/api/lists/${listId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
    });
  }

  return (
    <div className="mt-10 border-t border-line pt-6">
      <h2 className="font-display font-bold text-lg">
        Comments {comments.length > 0 && <span className="text-ink/40 font-normal">({comments.length})</span>}
      </h2>

      <div className="mt-4 flex flex-col gap-4">
        {comments.map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm">
                <span className="font-medium">{c.authorLabel}</span>{" "}
                <span className="text-ink/40 text-xs">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-ink/75 mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
            </div>
            {(c.isMine || isListOwner) && (
              <button
                onClick={() => handleDelete(c.id)}
                title="Delete comment"
                className="shrink-0 text-xs text-ink/40 hover:text-coral"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-sm text-ink/55">No comments yet — be the first to say something.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => {
            if (!isLoggedIn) router.push(`/login?next=/lists/${listId}`);
          }}
          placeholder={isLoggedIn ? "Add a comment…" : "Log in to leave a comment"}
          rows={2}
          maxLength={1000}
          disabled={!isLoggedIn}
          className="w-full border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum resize-none disabled:bg-surface disabled:text-ink/40"
        />
        {error && <p className="text-sm text-coral mt-2">{error}</p>}
        <div className="mt-2">
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="text-sm font-medium px-4 py-2 rounded-md bg-plum text-white hover:bg-plum-deep transition-colors disabled:opacity-60"
          >
            {isPending ? "Posting…" : "Post comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
