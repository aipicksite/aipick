import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ToolListicle from "@/components/ToolListicle";

export const revalidate = 21600; // 6 hours — matches the rankings-refresh cadence

type Props = { params: { slug: string } };

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
    return { title: SPECIAL_RANKINGS[slug].title, blurb: SPECIAL_RANKINGS[slug].blurb, tools: (data as Tool[]) ?? [] };
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
  const title = `${ranking.title} (Updated) | AIPick`;
  const description = `Community-ranked ${ranking.title.toLowerCase()}, updated regularly by upvotes.`;
  return {
    title,
    description,
    alternates: { canonical: `https://aipick.site/top/${params.slug}` },
    openGraph: { title, description, url: `https://aipick.site/top/${params.slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TopPage({ params }: Props) {
  const ranking = await resolveRanking(params.slug);
  if (!ranking) notFound();
  const { title, blurb, tools } = ranking;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    itemListElement: tools.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://aipick.site/tool/${t.slug}`,
      name: t.name,
    })),
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Ranking</span>
      <h1 className="font-display font-bold text-3xl mt-1">{title}</h1>
      <p className="text-ink/65 mt-2 leading-relaxed max-w-xl">{blurb}</p>
      <p className="text-xs text-ink/40 mt-2">
        Ranked by community votes and reviews · updated every few hours
      </p>

      <ToolListicle tools={tools} />
    </main>
  );
}
