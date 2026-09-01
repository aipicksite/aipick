import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 21600; // 6 hours — matches the rankings-refresh cadence

type Props = { params: { slug: string } };

// Special ranking slugs that aren't tied to one category.
const SPECIAL_RANKINGS: Record<
  string,
  { title: string; filter: (q: any) => any }
> = {
  "best-free-ai-tools": {
    title: "Best Free AI Tools",
    filter: (q) => q.eq("pricing_type", "free"),
  },
  "trending-ai-tools": {
    title: "Trending AI Tools",
    filter: (q) => q.order("created_at", { ascending: false }),
  },
};

async function resolveRanking(slug: string) {
  const supabase = createClient();

  if (SPECIAL_RANKINGS[slug]) {
    let query = supabase.from("tools").select("*").eq("status", "active");
    query = SPECIAL_RANKINGS[slug].filter(query);
    const { data } = await query.order("score", { ascending: false }).limit(20);
    return { title: SPECIAL_RANKINGS[slug].title, tools: (data as Tool[]) ?? [] };
  }

  // e.g. /top/ai-writing → "Top AI Writing Tools" from the ai-writing category
  const categorySlug = slug.replace(/^top-/, "");
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", categorySlug)
    .maybeSingle<Category>();

  if (!category) return null;

  const { data: links } = await supabase
    .from("tool_categories")
    .select("tools(*)")
    .eq("category_id", category.id);

  const tools = ((links ?? []).map((l: any) => l.tools) as Tool[])
    .filter((t) => t.status === "active")
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return { title: `Top ${category.name} AI Tools`, tools };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ranking = await resolveRanking(params.slug);
  if (!ranking) return {};
  return {
    title: `${ranking.title} (Updated) | AIPick`,
    description: `Community-ranked ${ranking.title.toLowerCase()}, updated regularly by upvotes.`,
  };
}

export default async function TopPage({ params }: Props) {
  const ranking = await resolveRanking(params.slug);
  if (!ranking) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display font-bold text-3xl">{ranking.title}</h1>
      <p className="text-ink/60 mt-2 text-sm">
        Ranked by community votes, updated regularly.
      </p>

      <ol className="mt-8 divide-y divide-line border-t border-b border-line">
        {ranking.tools.map((tool, i) => (
          <li key={tool.id}>
            <Link
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
              <span className="rank-badge text-sm font-medium bg-ink text-base px-2.5 py-1 rounded shrink-0">
                ▲ {tool.upvotes - tool.downvotes}
              </span>
            </Link>
          </li>
        ))}
        {ranking.tools.length === 0 && (
          <p className="py-8 text-sm text-ink/60">
            No tools ranked here yet.
          </p>
        )}
      </ol>
    </main>
  );
}
