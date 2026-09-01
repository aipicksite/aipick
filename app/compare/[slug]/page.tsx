import { createClient } from "@/lib/supabase/server";
import type { Tool } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 21600;

type Props = { params: { slug: string } };

async function getComparison(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("comparisons")
    .select("*, tool_a:tool_a_id(*), tool_b:tool_b_id(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;
  return {
    introText: data.intro_text as string | null,
    toolA: data.tool_a as unknown as Tool,
    toolB: data.tool_b as unknown as Tool,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const comparison = await getComparison(params.slug);
  if (!comparison) return {};
  const { toolA, toolB } = comparison;
  return {
    title: `${toolA.name} vs ${toolB.name} — Which Is Better? | AIPick`,
    description: `Compare ${toolA.name} and ${toolB.name} on pricing, platforms, and community votes.`,
  };
}

function Row({
  label,
  a,
  b,
}: {
  label: string;
  a: React.ReactNode;
  b: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 py-4 border-b border-line text-sm">
      <span className="text-ink/50">{label}</span>
      <span>{a}</span>
      <span>{b}</span>
    </div>
  );
}

export default async function ComparePage({ params }: Props) {
  const comparison = await getComparison(params.slug);
  if (!comparison) notFound();
  const { toolA, toolB, introText } = comparison;

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display font-bold text-3xl">
        {toolA.name} vs {toolB.name}
      </h1>
      {introText && <p className="text-ink/70 mt-3">{introText}</p>}

      <div className="grid grid-cols-3 gap-4 mt-10 pb-4 border-b-2 border-ink">
        <span></span>
        <Link href={`/tool/${toolA.slug}`} className="font-display font-bold text-lg hover:text-plum">
          {toolA.name}
        </Link>
        <Link href={`/tool/${toolB.slug}`} className="font-display font-bold text-lg hover:text-plum">
          {toolB.name}
        </Link>
      </div>

      <Row label="Pricing" a={toolA.pricing_summary} b={toolB.pricing_summary} />
      <Row label="Pricing type" a={toolA.pricing_type} b={toolB.pricing_type} />
      <Row label="Platforms" a={toolA.platforms?.join(", ")} b={toolB.platforms?.join(", ")} />
      <Row
        label="Community votes"
        a={`▲ ${toolA.upvotes - toolA.downvotes}`}
        b={`▲ ${toolB.upvotes - toolB.downvotes}`}
      />
      <Row
        label="Website"
        a={<a href={toolA.website_url} target="_blank" rel="noopener noreferrer nofollow" className="text-plum hover:underline">Visit →</a>}
        b={<a href={toolB.website_url} target="_blank" rel="noopener noreferrer nofollow" className="text-plum hover:underline">Visit →</a>}
      />
    </main>
  );
}
