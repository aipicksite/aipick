import { createClient } from "@/lib/supabase/server";
import type { Tool } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import VoteButton from "@/components/VoteButton";

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
  const supabase = createClient();
  const tool = await getTool(params.slug);
  if (!tool) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userVote: "up" | "down" | null = null;
  if (user) {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("vote_type")
      .eq("user_id", user.id)
      .eq("tool_id", tool.id)
      .maybeSingle();
    userVote = (existingVote?.vote_type as "up" | "down" | null) ?? null;
  }

  const netVotes = tool.upvotes - tool.downvotes;

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display font-bold text-3xl">{tool.name}</h1>
          <p className="text-ink/70 mt-2">{tool.short_description}</p>
        </div>
        <div className="shrink-0">
          <VoteButton
            toolId={tool.id}
            initialNetVotes={netVotes}
            initialUserVote={userVote}
            isLoggedIn={!!user}
          />
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
