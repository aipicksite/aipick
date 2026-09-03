import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ToolAvatar from "@/components/ToolAvatar";
import ToolScreenshot from "@/components/ToolScreenshot";

export const revalidate = 21600; // 6 hours — matches the rankings-refresh cadence

type Props = { params: { slug: string } };

const PRICING_LABEL: Record<string, string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
};

// Special ranking slugs that aren't tied to one category.
const SPECIAL_RANKINGS: Record<
  string,
  { title: string; blurb: string; filter: (q: any) => any }
> = {
  "best-free-ai-tools": {
    title: "Best Free AI Tools",
    blurb: "No credit card, no trial clock — these are worth using even if you never upgrade.",
    filter: (q) => q.eq("pricing_type", "free"),
  },
  "trending-ai-tools": {
    title: "Trending AI Tools",
    blurb: "What the AIPick community has been voting up most recently.",
    filter: (q) => q.order("created_at", { ascending: false }),
  },
};

async function resolveRanking(slug: string) {
  const supabase = createClient();

  if (SPECIAL_RANKINGS[slug]) {
    let query = supabase.from("tools").select("*").eq("status", "active");
    query = SPECIAL_RANKINGS[slug].filter(query);
    const { data } = await query.order("score", { ascending: false }).limit(20);
    return {
      title: SPECIAL_RANKINGS[slug].title,
      blurb: SPECIAL_RANKINGS[slug].blurb,
      tools: (data as Tool[]) ?? [],
    };
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

  return {
    title: `Top ${category.name} AI Tools`,
    blurb: category.description ?? `Community-ranked ${category.name.toLowerCase()} tools.`,
    tools,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ranking = await resolveRanking(params.slug);
  if (!ranking) return {};
  return {
    title: `${ranking.title} (Updated) | AIPick`,
    description: `Community-ranked ${ranking.title.toLowerCase()}, updated regularly by upvotes.`,
  };
}

function medalClass(rank: number) {
  if (rank === 1) return "medal-1";
  if (rank === 2) return "medal-2";
  if (rank === 3) return "medal-3";
  return "bg-base text-ink/40 border border-line";
}

export default async function TopPage({ params }: Props) {
  const ranking = await resolveRanking(params.slug);
  if (!ranking) notFound();
  const { title, blurb, tools } = ranking;

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Ranking</span>
      <h1 className="font-display font-bold text-3xl mt-1">{title}</h1>
      <p className="text-ink/65 mt-2 leading-relaxed max-w-xl">{blurb}</p>
      <p className="text-xs text-ink/40 mt-2">
        Ranked by community votes and reviews · updated every few hours
      </p>

      {tools.length === 0 ? (
        <p className="py-8 text-sm text-ink/60">No tools ranked here yet.</p>
      ) : (
        <>
          {/* Quick-jump list */}
          <div className="mt-8 border border-line rounded-lg divide-y divide-line overflow-hidden">
            {tools.map((tool, i) => (
              <a
                key={tool.id}
                href={`#${tool.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-base transition-colors text-sm"
              >
                <span className={`rank-badge w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${medalClass(i + 1)}`}>
                  {i + 1}
                </span>
                <span className="font-medium truncate">{tool.name}</span>
                <span className="ml-auto text-ink/40 text-xs shrink-0">
                  ▲ {tool.upvotes - tool.downvotes}
                </span>
              </a>
            ))}
          </div>

          {/* Detailed write-up per tool */}
          <div className="mt-14 flex flex-col gap-14">
            {tools.map((tool, i) => (
              <article key={tool.id} id={tool.slug} className="scroll-mt-20">
                <div className="flex items-center gap-3">
                  <span className={`rank-badge w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${medalClass(i + 1)}`}>
                    {i + 1}
                  </span>
                  <ToolAvatar name={tool.name} logoUrl={tool.logo_url} size={36} />
                  <h2 className="font-display font-bold text-xl">
                    <Link href={`/tool/${tool.slug}`} className="hover:text-plum">
                      {tool.name}
                    </Link>
                  </h2>
                  {tool.verified && (
                    <span className="text-xs font-medium text-forest bg-forest-soft px-2 py-0.5 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div className="rounded-lg overflow-hidden border border-line mt-4 aspect-[16/8]">
                  <ToolScreenshot websiteUrl={tool.website_url} name={tool.name} className="w-full h-full" />
                </div>

                {tool.short_description && (
                  <p className="mt-4 text-[17px] leading-relaxed text-ink/80 font-medium">
                    {tool.short_description}
                  </p>
                )}

                {tool.description && (
                  <p className="mt-3 text-[15px] leading-relaxed text-ink/65">
                    {tool.description}
                  </p>
                )}

                {tool.highlights?.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {tool.highlights.map((h, hi) => (
                      <li key={hi} className="flex gap-2.5 text-sm text-ink/70">
                        <span className="text-forest shrink-0">✓</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-center gap-2.5 mt-5 text-xs">
                  {tool.pricing_type && (
                    <span className="px-2.5 py-1 bg-forest-soft text-forest font-medium rounded-full">
                      {PRICING_LABEL[tool.pricing_type] ?? tool.pricing_type}
                      {tool.pricing_summary && ` · ${tool.pricing_summary}`}
                    </span>
                  )}
                  {tool.rating_count > 0 && (
                    <span className="px-2.5 py-1 border border-line rounded-full text-ink/60">
                      ★ {tool.rating_avg.toFixed(1)} ({tool.rating_count} reviews)
                    </span>
                  )}
                  <span className="px-2.5 py-1 border border-line rounded-full text-ink/60">
                    ▲ {tool.upvotes - tool.downvotes} net votes
                  </span>
                </div>

                <div className="flex gap-3 mt-4">
                  <a
                    href={tool.website_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="bg-plum text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-plum-deep transition-colors"
                  >
                    Visit {tool.name} →
                  </a>
                  <Link
                    href={`/tool/${tool.slug}`}
                    className="border border-line text-sm font-medium px-4 py-2 rounded-md hover:border-plum hover:text-plum transition-colors"
                  >
                    Full review & reviews
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
