import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import Link from "next/link";
import ToolRow from "@/components/ToolRow";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse AI Tools | AIPick",
  description: "Search and filter every AI tool in the AIPick directory.",
};

type SearchParams = {
  q?: string;
  category?: string;
  pricing?: string;
};

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const { q, category, pricing } = searchParams;

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  let query = supabase
    .from("tools")
    .select(category ? "*, tool_categories!inner(category_id)" : "*")
    .eq("status", "active");

  if (q) {
    query = query.textSearch("search_vector", q, {
      type: "websearch",
      config: "english",
    });
  }

  if (pricing) {
    query = query.eq("pricing_type", pricing);
  }

  if (category) {
    const cat = (categories as Category[] | null)?.find(
      (c) => c.slug === category
    );
    if (cat) {
      query = query.eq("tool_categories.category_id", cat.id);
    }
  }

  const { data: tools } = await query
    .order("score", { ascending: false })
    .limit(60);

  const toolList = (tools as unknown as Tool[]) ?? [];

  function buildUrl(overrides: Partial<SearchParams>) {
    const params = new URLSearchParams();
    const merged = { q, category, pricing, ...overrides };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const qs = params.toString();
    return qs ? `/tools?${qs}` : "/tools";
  }

  const pricingOptions: { label: string; value: string }[] = [
    { label: "Free", value: "free" },
    { label: "Freemium", value: "freemium" },
    { label: "Paid", value: "paid" },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-14">
      <h1 className="font-display font-bold text-3xl">Browse AI Tools</h1>

      <form action="/tools" method="get" className="mt-6">
        {category && <input type="hidden" name="category" value={category} />}
        {pricing && <input type="hidden" name="pricing" value={pricing} />}
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search tools by name or feature…"
          className="w-full max-w-xl bg-surface border border-line rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-plum"
        />
      </form>

      <div className="flex flex-wrap gap-2 mt-4">
        <Link
          href={buildUrl({ pricing: undefined })}
          className={`px-3 py-1.5 rounded-full text-xs border ${
            !pricing
              ? "bg-plum text-white border-plum"
              : "border-line hover:border-plum"
          }`}
        >
          All pricing
        </Link>
        {pricingOptions.map((opt) => (
          <Link
            key={opt.value}
            href={buildUrl({ pricing: opt.value })}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              pricing === opt.value
                ? "bg-plum text-white border-plum"
                : "border-line hover:border-plum"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-10 mt-8">
        <aside className="w-48 shrink-0 hidden md:block">
          <h2 className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-3">
            Category
          </h2>
          <div className="space-y-1">
            <Link
              href={buildUrl({ category: undefined })}
              className={`block text-sm py-1 ${
                !category ? "text-plum font-medium" : "text-ink/70 hover:text-ink"
              }`}
            >
              All categories
            </Link>
            {(categories as Category[] | null)?.map((cat) => (
              <Link
                key={cat.id}
                href={buildUrl({ category: cat.slug })}
                className={`block text-sm py-1 ${
                  category === cat.slug
                    ? "text-plum font-medium"
                    : "text-ink/70 hover:text-ink"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {toolList.length === 0 ? (
            <p className="text-sm text-ink/60 py-10">
              No tools match these filters yet — try clearing a filter or a
              different search term.
            </p>
          ) : (
            <div className="flex flex-col">
              {toolList.map((tool) => (
                <ToolRow key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
