import { createClient } from "@/lib/supabase/server";
import type { Tool } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ToolAvatar from "@/components/ToolAvatar";
import ComparisonTable from "@/components/ComparisonTable";

export const revalidate = 21600;

type Props = { params: { slug: string } };

async function getComparison(slug: string) {
  const supabase = createClient();

  // 1. A curated comparison (admin-written intro, fixed pair) takes priority.
  const { data: curated } = await supabase
    .from("comparisons")
    .select("*, tool_a:tool_a_id(*), tool_b:tool_b_id(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (curated) {
    return {
      introText: curated.intro_text as string | null,
      toolA: curated.tool_a as unknown as Tool,
      toolB: curated.tool_b as unknown as Tool,
    };
  }

  // 2. Otherwise, parse "slug-a-vs-slug-b" and look both tools up directly —
  // this makes every pair comparable without an admin pre-creating a row.
  const match = slug.match(/^(.+)-vs-(.+)$/);
  if (!match) return null;
  const [, slugA, slugB] = match;

  const [{ data: toolA }, { data: toolB }] = await Promise.all([
    supabase.from("tools").select("*").eq("slug", slugA).maybeSingle(),
    supabase.from("tools").select("*").eq("slug", slugB).maybeSingle(),
  ]);

  if (!toolA || !toolB) return null;

  return { introText: null, toolA: toolA as Tool, toolB: toolB as Tool };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const comparison = await getComparison(params.slug);
  if (!comparison) return {};
  const { toolA, toolB } = comparison;
  return {
    title: `${toolA.name} vs ${toolB.name} — Which Is Better? | AIPick`,
    description: `Compare ${toolA.name} and ${toolB.name} on pricing, platforms, ratings and community votes.`,
  };
}

export default async function ComparePage({ params }: Props) {
  const comparison = await getComparison(params.slug);
  if (!comparison) notFound();
  const { toolA, toolB, introText } = comparison;

  const rows = [
    { label: "Pricing", values: [toolA.pricing_summary ?? "—", toolB.pricing_summary ?? "—"] },
    { label: "Pricing type", values: [toolA.pricing_type ?? "—", toolB.pricing_type ?? "—"] },
    {
      label: "Platforms",
      values: [toolA.platforms?.join(", ") || "—", toolB.platforms?.join(", ") || "—"],
    },
    {
      label: "Rating",
      values: [
        toolA.rating_count > 0 ? `★ ${toolA.rating_avg.toFixed(1)} (${toolA.rating_count})` : "No reviews yet",
        toolB.rating_count > 0 ? `★ ${toolB.rating_avg.toFixed(1)} (${toolB.rating_count})` : "No reviews yet",
      ],
    },
    {
      label: "Community votes",
      values: [`▲ ${toolA.upvotes - toolA.downvotes}`, `▲ ${toolB.upvotes - toolB.downvotes}`],
    },
    { label: "Verified owner", values: [!!toolA.verified, !!toolB.verified] },
  ];

  const winnerIndex = toolA.score >= toolB.score ? 0 : 1;

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Compare</span>
      <h1 className="font-display font-bold text-3xl mt-1">
        {toolA.name} vs {toolB.name}
      </h1>
      {introText && <p className="text-ink/70 mt-3 leading-relaxed">{introText}</p>}

      <div className="grid grid-cols-2 gap-4 mt-8">
        {[toolA, toolB].map((t, i) => (
          <Link
            key={t.id}
            href={`/tool/${t.slug}`}
            className={`bg-surface border rounded-lg p-5 hover:border-plum transition-colors ${
              i === winnerIndex ? "border-gold" : "border-line"
            }`}
          >
            <div className="flex items-center gap-3">
              <ToolAvatar name={t.name} logoUrl={t.logo_url} websiteUrl={t.website_url} size={36} />
              <div className="min-w-0">
                <h2 className="font-display font-semibold truncate">{t.name}</h2>
                {i === winnerIndex && (
                  <span className="text-xs text-gold font-medium">Higher AIPick Score</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <ComparisonTable columns={[toolA.name, toolB.name]} rows={rows} highlightColumn={winnerIndex} />
      </div>

      <div className="flex gap-3 mt-8">
        <a
          href={toolA.website_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex-1 text-center bg-plum text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
        >
          Visit {toolA.name} →
        </a>
        <a
          href={toolB.website_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex-1 text-center border border-line text-sm font-medium px-4 py-2.5 rounded-md hover:border-plum hover:text-plum transition-colors"
        >
          Visit {toolB.name} →
        </a>
      </div>
    </main>
  );
}
