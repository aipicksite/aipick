"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

type ListSummary = { id: string; title: string; list_items: { tool_id: string }[] };

export default function AddToListButton({
  toolId,
  isLoggedIn,
}: {
  toolId: string;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListSummary[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggle() {
    if (!isLoggedIn) {
      router.push(`/login?next=${window.location.pathname}`);
      return;
    }
    if (!open && lists === null) {
      fetch("/api/lists")
        .then((r) => r.json())
        .then((data) => setLists(data.lists ?? []));
    }
    setOpen((o) => !o);
  }

  function toggleTool(listId: string, alreadyIn: boolean) {
    startTransition(async () => {
      await fetch(`/api/lists/${listId}/items`, {
        method: alreadyIn ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId }),
      });
      setLists((prev) =>
        prev
          ? prev.map((l) =>
              l.id === listId
                ? {
                    ...l,
                    list_items: alreadyIn
                      ? l.list_items.filter((i) => i.tool_id !== toolId)
                      : [...l.list_items, { tool_id: toolId }],
                  }
                : l
            )
          : prev
      );
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-md flex items-center justify-center border border-line hover:border-plum hover:text-plum transition-colors"
        title="Add to a list"
        aria-label="Add to a list"
      >
        +
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-lg shadow-lift py-1.5 text-sm z-40">
          <div className="px-3.5 py-1.5 text-ink/45 text-xs">Add to list</div>
          {lists === null && <div className="px-3.5 py-2 text-ink/45">Loading…</div>}
          {lists?.map((list) => {
            const inList = list.list_items.some((i) => i.tool_id === toolId);
            return (
              <button
                key={list.id}
                onClick={() => toggleTool(list.id, inList)}
                disabled={isPending}
                className="w-full text-left px-3.5 py-2 hover:bg-ink/5 flex items-center gap-2"
              >
                <span className={inList ? "text-forest" : "text-ink/30"}>{inList ? "✓" : "○"}</span>
                <span className="truncate">{list.title}</span>
              </button>
            );
          })}
          {lists?.length === 0 && (
            <div className="px-3.5 py-2 text-ink/45 text-xs">
              No lists yet —{" "}
              <a href="/lists" className="text-plum hover:underline">
                create one
              </a>
              .
            </div>
          )}
        </div>
      )}
    </div>
  );
}
