import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import Link from "next/link";

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

  return (
    <main>
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12">
        <div className="max-w-2xl">
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-[1.1]">
            Find the AI tool that actually gets the job done.
          </h1>
          <p className="mt-5 text-lg text-ink/70 max-w-lg">
            Ranked by people who use them, not by whoever pays the most.
            Browse, compare, and vote on the tools worth your time.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex flex-wrap gap-2">
          {(categories as Category[] | null)?.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="px-4 py-2 border border-line rounded-full text-sm hover:border-violet hover:text-violet transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="font-display font-bold text-2xl mb-6">Top Ranked</h2>
        <div className="divide-y divide-line border-t border-b border-line">
          {toolList.map((tool, i) => (
            <Link
              key={tool.id}
              href={`/tool/${tool.slug}`}
              className="flex items-center gap-6 py-5 group"
            >
              <span className="rank-badge text-2xl font-bold text-ink/30 w-10 shrink-0 group-hover:text-accent transition-colors">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-medium text-lg">
                  {tool.name}
                </h3>
                <p className="text-sm text-ink/60 truncate">
                  {tool.short_description}
                </p>
              </div>
              <span className="text-sm text-ink/50 shrink-0 hidden sm:block">
                {tool.pricing_summary}
              </span>
              <span className="rank-badge text-sm font-medium bg-ink text-base px-2.5 py-1 rounded shrink-0">
                ▲ {tool.upvotes - tool.downvotes}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
