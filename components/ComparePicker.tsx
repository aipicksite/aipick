"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ToolOption = { slug: string; name: string };

export default function ComparePicker({ tools }: { tools: ToolOption[] }) {
  const router = useRouter();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b) {
      setError("Pick two different tools to compare.");
      return;
    }
    if (a === b) {
      setError("Pick two different tools.");
      return;
    }
    router.push(`/compare/${a}-vs-${b}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <select
          value={a}
          onChange={(e) => setA(e.target.value)}
          className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
        >
          <option value="">Select a tool…</option>
          {tools.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>

        <span className="text-ink/40 text-sm text-center">vs</span>

        <select
          value={b}
          onChange={(e) => setB(e.target.value)}
          className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
        >
          <option value="">Select a tool…</option>
          {tools.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-coral mt-3">{error}</p>}

      <button
        type="submit"
        className="mt-5 bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
      >
        Compare →
      </button>
    </form>
  );
}
