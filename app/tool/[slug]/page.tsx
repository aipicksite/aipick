import { createClient } from "@/lib/supabase/server";
import type { Tool } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: { slug: string } };

async function getTool(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tools")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Tool | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = await getTool(params.slug);
  if (!tool) return {};
  return {
    title: `${tool.name} — Review, Pricing & Alternatives | AIPick`,
    description: tool.short_description ?? undefined,
  };
}

export default async function ToolPage({ params }: Props) {
  const tool = await getTool(params.slug);
  if (!tool) notFound();

  const netVotes = tool.upvotes - tool.downvotes;

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display font-bold text-3xl">{tool.name}</h1>
          <p className="text-ink/70 mt-2">{tool.short_description}</p>
        </div>
        <div className="text-center shrink-0">
          <div className="rank-badge text-2xl font-bold bg-ink text-base rounded px-3 py-2">
            ▲ {netVotes}
          </div>
          <span className="text-xs text-ink/50 block mt-1">net votes</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-6 pb-6 border-b border-line text-sm">
        <span className="px-3 py-1 border border-line rounded-full">
          {tool.pricing_summary}
        </span>
        <a
          href={tool.website_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-violet font-medium hover:underline"
        >
          Visit website
        </a>
      </div>

      <article className="prose prose-neutral mt-8 max-w-none font-body">
        <p>{tool.description}</p>
      </article>
    </main>
  );
}
