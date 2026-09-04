"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CreateListForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give your list a title.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/lists/${data.id}`);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-6 text-sm font-medium px-4 py-2.5 rounded-md bg-plum text-white hover:bg-plum-deep transition-colors"
      >
        + New list
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 border border-line rounded-lg p-4 bg-surface">
      <label className="block text-sm font-medium mb-1">Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Best free tools for students"
        className="w-full border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
        maxLength={100}
        autoFocus
      />

      <label className="block text-sm font-medium mt-4 mb-1">Description (optional)</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum resize-none"
        maxLength={500}
      />

      <label className="flex items-center gap-2 mt-4 text-sm">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        Make this list public (anyone with the link can view it)
      </label>

      {error && <p className="text-sm text-coral mt-3">{error}</p>}

      <div className="flex items-center gap-2 mt-4">
        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-medium px-4 py-2.5 rounded-md bg-plum text-white hover:bg-plum-deep transition-colors disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create list"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ink/50 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
