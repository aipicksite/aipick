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
  const title = `${tool.name} — Review, Pricing & Alternatives | AIPick`;
  const description =
    tool.short_description ?? `See pricing, features, and community reviews for ${tool.name} on AIPick.`;
  return {
    title,
    description,
    alternates: { canonical: `https://aipick.site/tool/${tool.slug}` },
    openGraph: {
      title,
      description,
      url: `https://aipick.site/tool/${tool.slug}`,
      type: "website",
      images: tool.screenshot_url ? [{ url: tool.screenshot_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.short_description ?? tool.description ?? undefined,
    applicationCategory: "AI Tool",
    url: tool.website_url,
    image: tool.screenshot_url ?? undefined,
    offers: tool.pricing_type
      ? {
          "@type": "Offer",
          price: tool.pricing_type === "free" ? "0" : undefined,
          priceCurrency: "USD",
          category: tool.pricing_type,
        }
      : undefined,
    ...(tool.rating_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: tool.rating_avg,
            reviewCount: tool.rating_count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-14">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="text-sm text-ink/45 mb-6">
        <Link href="/tools" className="hover:text-plum">Tools</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink/70">{tool.name}</span>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-10">
        {/* Main content */}
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <ToolAvatar name={tool.name} logoUrl={tool.logo_url} websiteUrl={tool.website_url} size={56} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
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
              <p className="text-ink/60 mt-1.5 leading-relaxed text-lg">
                {tool.short_description}
              </p>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden border border-line mt-6 aspect-[16/9]">
            <ToolScreenshot
              websiteUrl={tool.website_url}
              overrideUrl={tool.screenshot_url}
              name={tool.name}
              className="w-full h-full"
            />
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

          {tool.description && (
            <section className="mt-10">
              <h2 className="font-display font-bold text-xl mb-3">
                What is {tool.name}?
              </h2>
              <p className="text-[15px] leading-relaxed text-ink/70">{tool.description}</p>
            </section>
          )}

          {tool.highlights?.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display font-bold text-xl mb-4">Key features</h2>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {tool.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] text-ink/70 leading-snug">
                    <span className="text-forest shrink-0 mt-0.5">✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tool.pricing_summary && (
            <section className="mt-10 bg-surface border border-line rounded-lg p-5">
              <h2 className="font-display font-bold text-base mb-1.5">Pricing</h2>
              <p className="text-[15px] text-ink/70">{tool.pricing_summary}</p>
            </section>
          )}

          <ReviewSection
            toolId={tool.id}
            toolName={tool.name}
            isLoggedIn={!!user}
            myReview={myReview}
            otherReviews={otherReviews}
            ratingAvg={tool.rating_avg}
            ratingCount={tool.rating_count}
          />
        </div>

        {/* Sticky sidebar */}
        <aside className="mt-10 lg:mt-0">
          <div className="lg:sticky lg:top-24 bg-surface border border-line rounded-lg p-5 shadow-card">
            <a
              href={tool.website_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block text-center font-medium text-white bg-plum px-4 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
            >
              Visit {tool.name} →
            </a>

            <div className="flex items-center justify-center gap-2 mt-3">
              <VoteButton
                toolId={tool.id}
                initialNetVotes={netVotes}
                initialUserVote={userVote}
                isLoggedIn={!!user}
              />
              <SaveButton toolId={tool.id} initialSaved={isSaved} isLoggedIn={!!user} />
            </div>

            <dl className="mt-5 pt-5 border-t border-line space-y-3 text-sm">
              {tool.pricing_type && (
                <div className="flex items-center justify-between">
                  <dt className="text-ink/50">Pricing</dt>
                  <dd className="font-medium bg-forest-soft text-forest px-2 py-0.5 rounded-full text-xs">
                    {PRICING_LABEL[tool.pricing_type] ?? tool.pricing_type}
                  </dd>
                </div>
              )}
              {tool.rating_count > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-ink/50">Rating</dt>
                  <dd className="font-medium">★ {tool.rating_avg.toFixed(1)} ({tool.rating_count})</dd>
                </div>
              )}
              {upRatio !== null && (
                <div className="flex items-center justify-between">
                  <dt className="text-ink/50">Would recommend</dt>
                  <dd className="font-medium">{upRatio}%</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-ink/50">Net votes</dt>
                <dd className="font-medium">▲ {netVotes}</dd>
              </div>
            </dl>

            <div className="mt-4 pt-4 border-t border-line text-xs">
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
        </aside>
      </div>
    </main>
  );
}
