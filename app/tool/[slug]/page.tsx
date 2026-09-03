import { createClient } from "@/lib/supabase/server";
import type { Tool } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import VoteButton from "@/components/VoteButton";
import SaveButton from "@/components/SaveButton";
import ToolAvatar from "@/components/ToolAvatar";
import ToolScreenshot from "@/components/ToolScreenshot";
import ReviewSection from "@/components/ReviewSection";

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

const PRICING_LABEL: Record<string, string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
};

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

  let isSaved = false;
  if (user) {
    const { data: savedRow } = await supabase
      .from("saved_tools")
      .select("tool_id")
      .eq("user_id", user.id)
      .eq("tool_id", tool.id)
      .maybeSingle();
    isSaved = !!savedRow;
  }

  const netVotes = tool.upvotes - tool.downvotes;
  const totalVotes = tool.upvotes + tool.downvotes;
  const upRatio = totalVotes > 0 ? Math.round((tool.upvotes / totalVotes) * 100) : null;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*, profiles(username)")
    .eq("tool_id", tool.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const allReviews = (reviewRows ?? []) as any[];
  const myReview = user
    ? (allReviews.find((r) => r.user_id === user.id) as any) ?? null
    : null;
  const otherReviews = allReviews
    .filter((r) => r.user_id !== user?.id)
    .map((r) => ({ ...r, author_label: r.profiles?.username ?? "AIPick user" }));

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <div className="text-sm text-ink/45 mb-6">
        <Link href="/tools" className="hover:text-plum">Tools</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink/70">{tool.name}</span>
      </div>

      <div className="bg-surface border border-line rounded-lg p-6 sm:p-8 shadow-card">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <ToolAvatar name={tool.name} logoUrl={tool.logo_url} size={56} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-2xl sm:text-3xl leading-tight">
                  {tool.name}
                </h1>
                {tool.verified && (
                  <span
                    title="Verified by AIPick"
                    className="inline-flex items-center gap-1 text-xs font-medium text-forest bg-forest-soft px-2 py-0.5 rounded-full shrink-0"
                  >
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-ink/60 mt-1.5 leading-relaxed">
                {tool.short_description}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <VoteButton
              toolId={tool.id}
              initialNetVotes={netVotes}
              initialUserVote={userVote}
              isLoggedIn={!!user}
            />
            <SaveButton toolId={tool.id} initialSaved={isSaved} isLoggedIn={!!user} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-6 border-t border-line text-sm">
          {tool.pricing_type && (
            <span className="px-3 py-1 bg-forest-soft text-forest font-medium rounded-full">
              {PRICING_LABEL[tool.pricing_type] ?? tool.pricing_type}
            </span>
          )}
          {tool.pricing_summary && (
            <span className="px-3 py-1 border border-line rounded-full text-ink/60">
              {tool.pricing_summary}
            </span>
          )}
          {upRatio !== null && (
            <span className="px-3 py-1 border border-line rounded-full text-ink/60">
              {upRatio}% would recommend
            </span>
          )}
          {tool.rating_count > 0 && (
            <span className="px-3 py-1 border border-line rounded-full text-ink/60">
              ★ {tool.rating_avg.toFixed(1)} ({tool.rating_count} reviews)
            </span>
          )}
          <a
            href={tool.website_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="ml-auto font-medium text-white bg-plum px-4 py-1.5 rounded-full hover:bg-plum-deep transition-colors"
          >
            Visit website →
          </a>
        </div>

        <div className="mt-3 text-xs">
          {user && tool.owner_id === user.id ? (
            <Link href={`/dashboard/tools/${tool.slug}`} className="text-plum hover:underline">
              Manage this listing →
            </Link>
          ) : !tool.owner_id ? (
            <Link href={`/claim/${tool.slug}`} className="text-ink/40 hover:text-plum">
              Is this your tool? Claim this listing →
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-line mt-6 aspect-[16/9]">
        <ToolScreenshot websiteUrl={tool.website_url} name={tool.name} className="w-full h-full" />
      </div>

      {tool.platforms && tool.platforms.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {tool.platforms.map((p) => (
            <span
              key={p}
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-ink/5 text-ink/60"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <article className="prose prose-neutral mt-10 max-w-none font-body text-[15px] leading-relaxed">
        <h2 className="font-display font-bold text-xl mb-3">Overview</h2>
        <p>{tool.description}</p>
      </article>

      <ReviewSection
        toolId={tool.id}
        toolName={tool.name}
        isLoggedIn={!!user}
        myReview={myReview}
        otherReviews={otherReviews}
        ratingAvg={tool.rating_avg}
        ratingCount={tool.rating_count}
      />
    </main>
  );
}
