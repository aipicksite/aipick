import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import Link from "next/link";
import ToolRow from "@/components/ToolRow";

export const revalidate = 3600; // ISR: refresh homepage hourly

export default async function HomePage() {
  const supabase = createClient();

  const { data: tools } = await supabase
    .from("tools")
    .select("*")
    .eq("status", "active")
    .order("score", { ascending: false })
    .limit(12);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const toolList = (tools as Tool[] | null) ?? [];
  const categoryList = (categories as Category[] | null) ?? [];

  const totalVotes = toolList.reduce((sum, t) => sum + t.upvotes + t.downvotes, 0);

  return (
    <main>
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-14">
        <div className="max-w-2xl">
          <h1 className="font-display font-bold text-4xl md:text-[3.25rem] leading-[1.05] tracking-tight">
            Find the AI tool that actually gets the job done.
          </h1>
          <p className="mt-5 text-lg text-ink/65 max-w-lg leading-relaxed">
            Ranked by the people who use them — not by whoever pays the most.
            Vote, review, and compare the tools worth your time.
          </p>

          <form action="/tools" method="get" className="mt-8 flex max-w-lg">
            <input
              type="text"
              name="q"
              placeholder="Search 500+ AI tools — “image generator”, “SEO”…"
              className="flex-1 bg-surface border border-line rounded-l-md px-4 py-3 text-sm focus:outline-none focus:border-plum"
            />
            <button
              type="submit"
              className="bg-plum text-white px-5 py-3 rounded-r-md text-sm font-medium hover:bg-plum-deep transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          <div className="flex gap-8 mt-9 text-sm">
            <div>
              <span className="rank-badge block text-2xl font-bold">{toolList.length}+</span>
              <span className="text-ink/50">Tools ranked</span>
            </div>
            <div>
              <span className="rank-badge block text-2xl font-bold">{categoryList.length}</span>
              <span className="text-ink/50">Categories</span>
            </div>
            <div>
              <span className="rank-badge block text-2xl font-bold">{totalVotes}+</span>
              <span className="text-ink/50">Community votes</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex flex-wrap gap-2">
          {categoryList.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="px-4 py-2 bg-surface border border-line rounded-full text-sm hover:border-plum hover:text-plum transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display font-bold text-2xl">Top Ranked</h2>
          <Link href="/tools" className="text-sm font-medium text-plum hover:underline">
            View all tools
          </Link>
        </div>
        <div className="flex flex-col">
          {toolList.map((tool, i) => (
            <ToolRow key={tool.id} tool={tool} rank={i + 1} />
          ))}
          {toolList.length === 0 && (
            <p className="text-sm text-ink/55 py-10">
              No tools yet — the first ranking will appear as soon as tools are added.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
