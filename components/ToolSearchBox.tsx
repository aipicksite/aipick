"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ToolAvatar from "./ToolAvatar";

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export default function ToolSearchBox({
  variant = "hero",
  placeholder,
  defaultValue = "",
  extraParams,
}: {
  variant?: "hero" | "compact";
  placeholder?: string;
  defaultValue?: string;
  /** Other filter params (category, pricing, sort…) to keep in the URL when
   * submitting a full search — used on pages like /tools that have their
   * own filter form alongside this box. */
  extraParams?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  function handleChange(next: string) {
    setValue(next);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = next.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`/api/tools/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setSuggestions(data.tools ?? []);
        setOpen(true);
      } catch {
        // aborted or network error — ignore, keep prior state
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  function goToTool(slug: string) {
    setOpen(false);
    router.push(`/tool/${slug}`);
  }

  function submitSearch() {
    setOpen(false);
    const q = value.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    for (const [key, val] of Object.entries(extraParams ?? {})) {
      if (val) params.set(key, val);
    }
    const qs = params.toString();
    router.push(qs ? `/tools?${qs}` : "/tools");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitSearch();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        goToTool(suggestions[activeIndex].slug);
      } else {
        submitSearch();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const isHero = variant === "hero";

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch();
        }}
        className={`flex w-full ${isHero ? "" : ""}`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Search AI tools…"}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className={
            isHero
              ? "flex-1 bg-surface border border-line rounded-l-full pl-6 pr-4 py-4 text-[15px] focus:outline-none focus:border-plum shadow-lift"
              : "flex-1 bg-surface border border-line rounded-l-md px-4 py-3 text-sm focus:outline-none focus:border-plum"
          }
        />
        <button
          type="submit"
          className={
            isHero
              ? "bg-plum text-white px-7 py-4 rounded-r-full text-sm font-semibold hover:bg-plum-deep transition-colors shrink-0"
              : "bg-plum text-white px-5 py-3 rounded-r-md text-sm font-medium hover:bg-plum-deep transition-colors shrink-0"
          }
        >
          Search
        </button>
      </form>

      {open && (
        <div
          className={`absolute z-40 left-0 right-0 mt-2 bg-surface border border-line rounded-xl shadow-lift overflow-hidden text-left ${
            isHero ? "" : ""
          }`}
        >
          {loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-ink/45">Searching…</div>
          )}
          {!loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-ink/45">
              No tools found — press Enter to search the full directory.
            </div>
          )}
          {suggestions.map((tool, i) => (
            <button
              type="button"
              key={tool.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => goToTool(tool.slug)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                activeIndex === i ? "bg-plum/10" : "hover:bg-ink/5"
              }`}
            >
              <ToolAvatar name={tool.name} logoUrl={tool.logo_url} size={26} />
              <span className="font-medium truncate">{tool.name}</span>
            </button>
          ))}
          {suggestions.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={submitSearch}
              className="w-full text-left px-4 py-2.5 text-xs font-medium text-plum border-t border-line hover:bg-plum/5"
            >
              See all results for &ldquo;{value.trim()}&rdquo; →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
