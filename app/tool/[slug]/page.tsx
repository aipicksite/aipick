import { createClient } from "@/lib/supabase/server";
import type { Tool } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import VoteButton from "@/components/VoteButton";
import SaveButton from "@/components/SaveButton";
import AddToListButton from "@/components/AddToListButton";
import ToolAvatar from "@/components/ToolAvatar";
import ToolScreenshot from "@/components/ToolScreenshot";
import ReviewSection from "@/components/ReviewSection";
import { trackPageView } from "@/lib/track-view";

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

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ToolPage({ params }: Props) {
  const supabase = createClient();
  const tool = await getTool(params.slug);
  if (!tool) notFound();

  trackPageView(`/tool/${tool.slug}`, tool.id);

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

  const { data: categoryRows } = await supabase
    .from("tool_categories")
    .select("categories(id, name, slug)")
    .eq("tool_id", tool.id);
  const toolCategories = (categoryRows ?? [])
    .map((r: any) => r.categories)
    .filter(Boolean) as { id: string; name: string; slug: string }[];

  // Alternatives: other active tools sharing at least one category, ranked by score.
  let alternatives: Tool[] = [];
  if (toolCategories.length > 0) {
    const categoryIds = toolCategories.map((c) => c.id);
    const { data: altLinkRows } = await supabase
      .from("tool_categories")
      .select("tool_id")
      .in("category_id", categoryIds)
      .neq("tool_id", tool.id);
    const altIds = Array.from(new Set((altLinkRows ?? []).map((r: any) => r.tool_id)));
    if (altIds.length > 0) {
      const { data: altTools } = await supabase
        .from("tools")
        .select("*")
        .in("id", altIds)
        .eq("status", "active")
        .order("score", { ascending: false })
        .limit(4);
      alternatives = (altTools as Tool[] | null) ?? [];
    }
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

  const sections: { id: string; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...(tool.pricing_summary ? [{ id: "pricing", label: "Pricing" }] : []),
    ...(tool.use_cases?.length ? [{ id: "use-cases", label: "Use cases" }] : []),
    ...(tool.audience?.length ? [{ id: "who-for", label: "Who it's for" }] : []),
    { id: "reviews", label: "Reviews" },
    ...(alternatives.length ? [{ id: "alternatives", label: "Alternatives" }] : []),
  ];

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

      {/* Hero */}
      <div className="flex items-start gap-4 flex-wrap">
        <ToolAvatar name={tool.name} logoUrl={tool.logo_url} websiteUrl={tool.website_url} size={64} />
        <div className="min-w-0 flex-1">
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
          <p className="text-ink/60 mt-1.5 leading-relaxed text-lg max-w-2xl">
            {tool.short_description}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-ink/50">
            <span>Updated {formatUpdated(tool.updated_at)}</span>
            {upRatio !== null && (
              <>
                <span className="text-line">·</span>
                <span>
                  <span className="font-medium text-forest">{upRatio}%</span> would recommend
                  <span className="text-ink/40"> ({totalVotes} votes)</span>
                </span>
              </>
            )}
            {tool.rating_count > 0 && (
              <>
                <span className="text-line">·</span>
                <span>★ {tool.rating_avg.toFixed(1)} ({tool.rating_count} reviews)</span>
              </>
            )}
          </div>
        </div>

        <a
          href={tool.website_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="hidden sm:inline-flex items-center font-medium text-white bg-plum px-5 py-3 rounded-md hover:bg-plum-deep transition-colors shrink-0"
        >
          Try {tool.name} →
        </a>
      </div>

      {/* Sticky in-page section nav */}
      <nav className="sticky top-16 z-20 mt-8 -mx-4 px-4 bg-base/95 backdrop-blur border-y border-line overflow-x-auto">
        <div className="flex gap-1 py-1 text-sm whitespace-nowrap">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-3 py-2 rounded-md text-ink/60 hover:text-plum hover:bg-ink/5 transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-10">
        {/* Main content */}
        <div className="min-w-0">
          <div className="rounded-lg overflow-hidden border border-line mt-8 aspect-[16/9] max-h-[320px] sm:max-h-[380px]">
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

          <section id="overview" className="mt-10 scroll-mt-32">
            <h2 className="font-display font-bold text-xl mb-3">
              What is {tool.name}?
            </h2>
            {tool.description && (
              <p className="text-[15px] leading-relaxed text-ink/70">{tool.description}</p>
            )}

            {tool.highlights?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display font-semibold text-base mb-3">Key features</h3>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {tool.highlights.map((h, i) => {
                    const dotColors = ["bg-forest", "bg-gold", "bg-plum", "bg-coral"];
                    return (
                      <li key={i} className="flex gap-2.5 text-[15px] text-ink/70 leading-snug">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${dotColors[i % dotColors.length]}`} />
                        <span>{h}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {tool.pricing_summary && (
            <section
              id="pricing"
              className={`mt-10 scroll-mt-32 bg-surface border-l-4 border border-line rounded-lg p-5 ${
                tool.pricing_type === "free"
                  ? "border-l-forest"
                  : tool.pricing_type === "paid"
                  ? "border-l-plum"
                  : "border-l-gold"
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-display font-bold text-base text-ink">Pricing</h2>
                {tool.pricing_type && (
                  <span className="font-medium bg-forest-soft text-forest px-2.5 py-0.5 rounded-full text-xs">
                    {PRICING_LABEL[tool.pricing_type] ?? tool.pricing_type}
                  </span>
                )}
              </div>
              <p className="text-[15px] text-ink/70 mt-1.5">{tool.pricing_summary}</p>
              <a
                href={tool.website_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-block text-sm text-plum hover:underline mt-3"
              >
                Verify on the official pricing page →
              </a>
            </section>
          )}

          {tool.use_cases?.length > 0 && (
            <section id="use-cases" className="mt-10 scroll-mt-32">
              <h2 className="font-display font-bold text-xl mb-4">
                {tool.name} use cases
              </h2>
              <ul className="flex flex-col gap-3">
                {tool.use_cases.map((u, i) => (
                  <li
                    key={i}
                    className="flex gap-3 items-start text-[15px] text-ink/70 leading-relaxed bg-surface border border-line rounded-lg p-4"
                  >
                    <span className="w-6 h-6 rounded-full bg-plum/10 text-plum text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tool.audience?.length > 0 && (
            <section id="who-for" className="mt-10 scroll-mt-32">
              <h2 className="font-display font-bold text-xl mb-4">
                Who is {tool.name} for?
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {tool.audience.map((a, i) => (
                  <span
                    key={i}
                    className="text-sm font-medium px-3.5 py-2 rounded-full bg-plum-deep/5 text-plum border border-plum/15"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section id="reviews" className="scroll-mt-32">
            <ReviewSection
              toolId={tool.id}
              toolName={tool.name}
              isLoggedIn={!!user}
              myReview={myReview}
              otherReviews={otherReviews}
              ratingAvg={tool.rating_avg}
              ratingCount={tool.rating_count}
            />
          </section>

          {alternatives.length > 0 && (
            <section id="alternatives" className="mt-14 scroll-mt-32">
              <h2 className="font-display font-bold text-xl mb-4">
                Alternatives to {tool.name}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {alternatives.map((alt) => (
                  <Link
                    key={alt.id}
                    href={`/tool/${alt.slug}`}
                    className="flex items-start gap-3 bg-surface border border-line rounded-lg p-4 hover:border-plum transition-colors"
                  >
                    <ToolAvatar name={alt.name} logoUrl={alt.logo_url} websiteUrl={alt.website_url} size={36} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{alt.name}</p>
                      <p className="text-sm text-ink/55 mt-0.5 line-clamp-2">{alt.short_description}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href={`/compare?a=${tool.slug}`}
                className="inline-block text-sm text-plum hover:underline mt-4"
              >
                ⇄ Build a side-by-side comparison →
              </Link>
            </section>
          )}
        </div>

        {/* Sticky sidebar */}
        <aside className="mt-10 lg:mt-8">
          <div className="lg:sticky lg:top-40 bg-surface border border-line rounded-lg overflow-hidden shadow-card">
            <div className="h-1.5 bg-gradient-to-r from-plum via-gold to-forest" />
            <div className="p-5">
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
              <AddToListButton toolId={tool.id} isLoggedIn={!!user} />
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
              <div className="flex items-center justify-between">
                <dt className="text-ink/50">Last updated</dt>
                <dd className="font-medium">{formatUpdated(tool.updated_at)}</dd>
              </div>
            </dl>

            {toolCategories.length > 0 && (
              <div className="mt-4 pt-4 border-t border-line">
                <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">
                  Categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {toolCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="text-xs font-medium px-2.5 py-1 rounded-full border border-line text-ink/60 hover:border-plum hover:text-plum transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-line text-xs flex items-center justify-between gap-2">
              <Link href={`/compare?a=${tool.slug}`} className="text-ink/40 hover:text-plum">
                ⇄ Compare with another tool
              </Link>
            </div>

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
          </div>
        </aside>
      </div>
    </main>
  );
}
