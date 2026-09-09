"use client";

import { useEffect, useState } from "react";

type ToolResult = { id: string; name: string; slug: string; logo_url: string | null };

export default function ToolPicker({
  onSelect,
}: {
  onSelect: (tool: ToolResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ToolResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tools/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.tools ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for the tool by name…"
        className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
      />
      {loading && <p className="text-xs text-ink/45 mt-2">Searching…</p>}
      {results.length > 0 && (
        <div className="mt-2 border border-line rounded-lg divide-y divide-line overflow-hidden">
          {results.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelect(tool)}
              className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-surface flex items-center gap-2"
            >
              {tool.logo_url && (
                <img src={tool.logo_url} alt="" className="w-5 h-5 rounded" />
              )}
              {tool.name}
            </button>
          ))}
        </div>
      )}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-xs text-ink/45 mt-2">
          No match. Not listed yet?{" "}
          <a href="/submit" className="text-plum hover:underline">
            Submit it instead
          </a>
          .
        </p>
      )}
    </div>
  );
}
