import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import Link from "next/link";
import ToolRow from "@/components/ToolRow";
import CreditedImage from "@/components/CreditedImage";
import { getPexelsImage } from "@/lib/pexels";

export const revalidate = 3600; // ISR: refresh homepage hourly

const FEATURES = [
  {
    title: "Vote, don't guess",
    body: "Every tool's rank comes from real upvotes and reviews — not ad spend.",
  },
  {
    title: "Compare side by side",
    body: "Line up pricing, platforms and ratings before you commit to one tool.",
  },
  {
    title: "Verified by owners",
    body: "Claimed listings are kept accurate by the people who actually run the tool.",
  },
];

export default async function HomePage() {
  const supabase = createClient();

  const [{ data: tools }, { count: totalTools }, { data: voteRows }, { data: categories }, heroImage] = await Promise.all([
    supabase
      .from("tools")
      .select("*")
      .eq("status", "active")
      .order("score", { ascending: false })
      .limit(12),
    supabase.from("tools").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tools").select("upvotes, downvotes").eq("status", "active"),
    supabase.from("categories").select("*").order("name"),
    getPexelsImage("futuristic technology gradient abstract", "landscape"),
  ]);

  const toolList = (tools as Tool[] | null) ?? [];
  const categoryList = (categories as Category[] | null) ?? [];

  const totalVotes = (voteRows ?? []).reduce(
    (sum: number, t: { upvotes: number; downvotes: number }) => sum + t.upvotes + t.downvotes,
    0
  );

  return (
    <main>
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-14 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div>
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
              placeholder={`Search ${totalTools ?? toolList.length}+ AI tools — “image generator”, “SEO”…`}
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
              <span className="rank-badge block text-2xl font-bold">{totalTools ?? toolList.length}</span>
              <span className="text-ink/50">Tools ranked</span>
            </div>
            <div>
              <span className="rank-badge block text-2xl font-bold">{categoryList.length}</span>
              <span className="text-ink/50">Categories</span>
            </div>
            <div>
              <span className="rank-badge block text-2xl font-bold">{totalVotes}</span>
              <span className="text-ink/50">Community votes</span>
            </div>
          </div>
        </div>

        <div className="hidden lg:block rounded-xl overflow-hidden border border-line shadow-lift aspect-[4/3]">
          {heroImage ? (
            <CreditedImage image={heroImage} className="w-full h-full" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-plum to-plum-deep" />
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface border border-line rounded-lg p-5">
              <h3 className="font-display font-semibold text-sm">{f.title}</h3>
              <p className="text-sm text-ink/55 mt-1.5 leading-relaxed">{f.body}</p>
            </div>
          ))}
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
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display font-bold text-2xl">Top Ranked</h2>
          <Link href="/tools" className="text-sm font-medium text-plum hover:underline">
            View all tools
          </Link>
        </div>
        <p className="text-sm text-ink/50 mb-6">
          The 12 highest by <Link href="/how-it-works" className="text-plum hover:underline">AIPick Score</Link> — votes, reviews and recent activity combined, not just newest or cheapest.
        </p>
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
