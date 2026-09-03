import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import Link from "next/link";
import ToolRow from "@/components/ToolRow";
import Pagination from "@/components/Pagination";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse AI Tools | AIPick",
  description: "Search and filter every AI tool in the AIPick directory.",
};

const PAGE_SIZE = 24;

type SearchParams = {
  q?: string;
  category?: string;
  pricing?: string;
  sort?: string;
  verified?: string;
  page?: string;
};

const SORT_OPTIONS: Record<string, { label: string; column: string; ascending: boolean }> = {
  score: { label: "Top score", column: "score", ascending: false },
  newest: { label: "Newest", column: "created_at", ascending: false },
  votes: { label: "Most voted", column: "upvotes", ascending: false },
  rating: { label: "Highest rated", column: "rating_avg", ascending: false },
};

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const { q, category, pricing, verified } = searchParams;
  const sortKey = searchParams.sort && SORT_OPTIONS[searchParams.sort] ? searchParams.sort : "score";
  const sort = SORT_OPTIONS[sortKey];
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  let query = supabase
    .from("tools")
    .select(category ? "*, tool_categories!inner(category_id)" : "*", { count: "exact" })
    .eq("status", "active");

  if (q) {
    query = query.textSearch("search_vector", q, { type: "websearch", config: "english" });
  }
  if (pricing) {
    query = query.eq("pricing_type", pricing);
  }
  if (verified === "1") {
    query = query.eq("verified", true);
  }
  if (category) {
    const cat = (categories as Category[] | null)?.find((c) => c.slug === category);
    if (cat) query = query.eq("tool_categories.category_id", cat.id);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data: tools, count } = await query
    .order(sort.column, { ascending: sort.ascending })
    .range(from, from + PAGE_SIZE - 1);

  const toolList = (tools as unknown as Tool[]) ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildUrl(overrides: Partial<SearchParams>) {
    const params = new URLSearchParams();
    const merged = { q, category, pricing, sort: sortKey, verified, ...overrides };
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
      <p className="text-ink/55 text-sm mt-1">
        {count ?? 0} tool{count === 1 ? "" : "s"}
        {category && (categories as Category[] | null)?.find((c) => c.slug === category)
          ? ` in ${(categories as Category[]).find((c) => c.slug === category)!.name}`
          : ""}
      </p>

      <form action="/tools" method="get" className="mt-6">
        {category && <input type="hidden" name="category" value={category} />}
        {pricing && <input type="hidden" name="pricing" value={pricing} />}
        {sortKey !== "score" && <input type="hidden" name="sort" value={sortKey} />}
        {verified === "1" && <input type="hidden" name="verified" value="1" />}
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
          href={buildUrl({ pricing: undefined, page: undefined })}
          className={`px-3 py-1.5 rounded-full text-xs border ${
            !pricing ? "bg-plum text-white border-plum" : "border-line hover:border-plum"
          }`}
        >
          All pricing
        </Link>
        {pricingOptions.map((opt) => (
          <Link
            key={opt.value}
            href={buildUrl({ pricing: opt.value, page: undefined })}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              pricing === opt.value ? "bg-plum text-white border-plum" : "border-line hover:border-plum"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-10 mt-8">
        <aside className="w-52 shrink-0 hidden md:block">
          <div>
            <h2 className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-3">
              Sort by
            </h2>
            <div className="space-y-1">
              {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
                <Link
                  key={key}
                  href={buildUrl({ sort: key === "score" ? undefined : key, page: undefined })}
                  className={`block text-sm py-1 ${
                    sortKey === key ? "text-plum font-medium" : "text-ink/70 hover:text-ink"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <h2 className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-3">
              Filters
            </h2>
            <Link
              href={buildUrl({ verified: verified === "1" ? undefined : "1", page: undefined })}
              className="flex items-center gap-2 text-sm py-1"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                  verified === "1" ? "bg-forest border-forest text-white" : "border-line"
                }`}
              >
                {verified === "1" && "✓"}
              </span>
              <span className={verified === "1" ? "text-forest font-medium" : "text-ink/70"}>
                Verified only
              </span>
            </Link>
          </div>

          <div className="mt-7">
            <h2 className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-3">
              Category
            </h2>
            <div className="space-y-1">
              <Link
                href={buildUrl({ category: undefined, page: undefined })}
                className={`block text-sm py-1 ${
                  !category ? "text-plum font-medium" : "text-ink/70 hover:text-ink"
                }`}
              >
                All categories
              </Link>
              {(categories as Category[] | null)?.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildUrl({ category: cat.slug, page: undefined })}
                  className={`block text-sm py-1 ${
                    category === cat.slug ? "text-plum font-medium" : "text-ink/70 hover:text-ink"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
              {(categories as Category[] | null)?.length === 0 && (
                <p className="text-xs text-ink/40 leading-relaxed">
                  No categories yet — add some from Admin.
                </p>
              )}
            </div>
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

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildUrl={(p) => buildUrl({ page: p === 1 ? undefined : String(p) })}
          />
        </div>
      </div>
    </main>
  );
}
