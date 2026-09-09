import { createClient } from "@/lib/supabase/server";
import type { Tool, Category, BlogPost } from "@/types/database";
import type { Metadata } from "next";
import Link from "next/link";
import ToolRow from "@/components/ToolRow";
import ToolAvatar from "@/components/ToolAvatar";
import CreditedImage from "@/components/CreditedImage";
import { getPexelsImage } from "@/lib/pexels";
import { trackPageView } from "@/lib/track-view";
import { currentlyFeaturedIds } from "@/lib/featured-queue";

export const revalidate = 3600; // ISR: refresh homepage hourly

export const metadata: Metadata = {
  title: "AIPick — Discover, Vote, and Pick the Best AI Tools",
  description:
    "A community-powered directory to discover, compare, and rank the best AI tools. Real votes and reviews, not pay-to-rank listings.",
  alternates: { canonical: "https://aipick.site" },
  openGraph: {
    title: "AIPick — Discover, Vote, and Pick the Best AI Tools",
    description:
      "A community-powered directory to discover, compare, and rank the best AI tools. Real votes and reviews, not pay-to-rank listings.",
    url: "https://aipick.site",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIPick — Discover, Vote, and Pick the Best AI Tools",
    description:
      "A community-powered directory to discover, compare, and rank the best AI tools.",
  },
};

const FEATURES = [
  {
    title: "Vote, don't guess",
    body: "Every tool's rank comes from real upvotes and reviews — not ad spend.",
  },
  {
    title: "Compare side by side",
    body: "Line up pricing, platforms and ratings before you commit to one tool.",
  },
  {
    title: "Verified by owners",
    body: "Claimed listings are kept accurate by the people who actually run the tool.",
  },
];

const FAQS = [
  {
    q: "Is AIPick free to use?",
    a: "Yes. Browsing, searching, voting, and writing reviews are always free for everyone. Tool owners can also claim their listing at no cost. Submitting a new tool and requesting paid enrichments (screenshots, video, priority review) carry a small one-time fee — see below.",
  },
  {
    q: "How is a tool's rank calculated?",
    a: "The AIPick Score combines real community upvotes, published reviews, and recent activity — never payment. Featured placements are clearly labelled and never affect a tool's organic score. See the full breakdown on the How Ranking Works page.",
  },
  {
    q: "Can I add my own AI tool to the directory, and does it cost anything?",
    a: "Yes — submit it from the Submit a Tool page. A one-time listing fee applies (from $19.99, with a Featured tier at $99 for homepage placement). Every submission is still reviewed before it goes live to keep listings accurate and spam-free.",
  },
  {
    q: "I already run one of the listed tools — can I manage its page?",
    a: "Claiming to verify ownership is free. If you'd also like to update the description, pricing, add a screenshot, or add a YouTube overview video, do that from the Update a Listing page for a small one-time fee.",
  },
  {
    q: "How often are new tools added?",
    a: "New tools are added on an ongoing basis across categories like writing, image and video generation, coding, and productivity — see what's newest below.",
  },
];

export default async function HomePage() {
  trackPageView("/");
  const supabase = createClient();

  const [
    { data: tools },
    { count: totalTools },
    { data: voteRows },
    { data: categories },
    { data: activeToolIds },
    { data: categoryLinks },
    { data: recentTools },
    { data: recentPosts },
    { data: featuredCandidatesRaw },
    heroImage,
  ] = await Promise.all([
    supabase
      .from("tools")
      .select("*")
      .eq("status", "active")
      .order("score", { ascending: false })
      .limit(12),
    supabase.from("tools").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tools").select("upvotes, downvotes").eq("status", "active"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("tools").select("id").eq("status", "active"),
    supabase.from("tool_categories").select("tool_id, category_id"),
    supabase
      .from("tools")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("blog_posts")
      .select("*")
      .lte("published_at", new Date().toISOString())
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(3),
    // Featured homepage placements — a fair FIFO queue of up to 15 tools at
    // once (lib/featured-queue.ts), joined either by an admin manually
    // marking a tool "Featured" or by an approved paid submit_featured
    // submission. We fetch every candidate (small table) and let the queue
    // function figure out who's actually visible right now.
    supabase
      .from("tools")
      .select("*")
      .eq("status", "active")
      .not("featured_requested_at", "is", null)
      .order("featured_requested_at", { ascending: true })
      .limit(200),
    getPexelsImage("futuristic technology gradient abstract", "landscape"),
  ]);

  const toolList = (tools as Tool[] | null) ?? [];
  const categoryList = (categories as Category[] | null) ?? [];
  const recentToolList = (recentTools as Tool[] | null) ?? [];
  const recentPostList = (recentPosts as BlogPost[] | null) ?? [];

  const featuredCandidates = (featuredCandidatesRaw as Tool[] | null) ?? [];
  const visibleFeaturedIds = new Set(
    currentlyFeaturedIds(
      featuredCandidates.map((t) => ({ id: t.id, featured_requested_at: t.featured_requested_at as string }))
    )
  );
  const featuredTools = featuredCandidates.filter((t) => visibleFeaturedIds.has(t.id));

  const totalVotes = (voteRows ?? []).reduce(
    (sum: number, t: { upvotes: number; downvotes: number }) => sum + t.upvotes + t.downvotes,
    0
  );

  const activeIdSet = new Set((activeToolIds ?? []).map((t: { id: string }) => t.id));
  const categoryCounts = new Map<string, number>();
  for (const link of (categoryLinks ?? []) as { tool_id: string; category_id: string }[]) {
    if (activeIdSet.has(link.tool_id)) {
      categoryCounts.set(link.category_id, (categoryCounts.get(link.category_id) ?? 0) + 1);
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "AIPick",
        url: "https://aipick.site",
        description:
          "A community-powered directory to discover, compare, and rank the best AI tools.",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://aipick.site/tools?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: "AIPick",
        url: "https://aipick.site",
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <main>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(55% 45% at 10% 0%, rgba(62,42,92,0.10), transparent), radial-gradient(45% 40% at 95% 15%, rgba(198,138,40,0.12), transparent), radial-gradient(40% 35% at 60% 100%, rgba(196,90,74,0.06), transparent)",
          }}
        />
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-14 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div>
          <h1 className="font-display font-bold text-4xl md:text-[3.25rem] leading-[1.05] tracking-tight">
            Find the AI tool that actually gets the job done.
          </h1>
          <p className="mt-5 text-lg text-ink/65 max-w-lg leading-relaxed">
            Ranked by the people who use them — not by whoever pays the most.
            Vote, review, and compare the tools worth your time.
          </p>

          <form action="/tools" method="get" className="mt-8 flex max-w-lg">
            <input
              type="text"
              name="q"
              placeholder={`Search ${totalTools ?? toolList.length}+ AI tools — “image generator”, “SEO”…`}
              className="flex-1 bg-surface border border-line rounded-l-md px-4 py-3 text-sm focus:outline-none focus:border-plum"
            />
            <button
              type="submit"
              className="bg-plum text-white px-5 py-3 rounded-r-md text-sm font-medium hover:bg-plum-deep transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          <div className="flex gap-8 mt-9 text-sm">
            <div>
              <span className="rank-badge block text-2xl font-bold text-plum">{totalTools ?? toolList.length}</span>
              <span className="text-ink/50">Tools ranked</span>
            </div>
            <div>
              <span className="rank-badge block text-2xl font-bold text-gold">{categoryList.length}</span>
              <span className="text-ink/50">Categories</span>
            </div>
            <div>
              <span className="rank-badge block text-2xl font-bold text-forest">{totalVotes}</span>
              <span className="text-ink/50">Community votes</span>
            </div>
          </div>

          <p className="mt-5 text-xs text-ink/40">
            New tools added every week · No pay-to-rank listings, ever
          </p>
        </div>

        <div className="hidden lg:block rounded-xl overflow-hidden border border-line shadow-lift aspect-[4/3]">
          {heroImage ? (
            <CreditedImage image={heroImage} className="w-full h-full" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-plum to-plum-deep" />
          )}
        </div>
        </div>
      </section>

      {featuredTools.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mb-16">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display font-bold text-2xl">
              <span className="text-gold">★</span> Featured
            </h2>
            <span className="text-xs text-ink/40">Paid placement — never affects AIPick Score</span>
          </div>
          <p className="text-sm text-ink/50 mb-6">
            A rotating spotlight of up to 15 tools at a time. This is a labeled paid placement — it
            never changes a tool's AIPick Score or organic rank below.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {featuredTools.slice(0, 15).map((tool, i) => {
              const accents = ["border-plum/25", "border-gold/35", "border-forest/25", "border-coral/25"];
              const accent = accents[i % accents.length];
              return (
                <Link
                  key={tool.id}
                  href={`/tool/${tool.slug}`}
                  className={`group flex flex-col bg-surface border ${accent} rounded-xl p-4 hover:shadow-lift transition-shadow`}
                >
                  <ToolAvatar name={tool.name} logoUrl={tool.logo_url} websiteUrl={tool.website_url} size={40} />
                  <h3 className="font-display font-semibold text-sm mt-3 group-hover:text-plum leading-snug">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-ink/50 mt-1 leading-snug line-clamp-2 flex-1">
                    {tool.short_description}
                  </p>
                  {tool.rating_count > 0 && (
                    <span className="text-xs text-gold mt-2">
                      ★ {tool.rating_avg.toFixed(1)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const dots = ["bg-plum", "bg-gold", "bg-forest"];
            return (
              <div key={f.title} className="bg-surface border border-line rounded-lg p-5">
                <span className={`inline-block w-2 h-2 rounded-full ${dots[i % dots.length]} mb-2`} />
                <h3 className="font-display font-semibold text-sm">{f.title}</h3>
                <p className="text-sm text-ink/55 mt-1.5 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display font-bold text-2xl">Browse by category</h2>
        </div>
        <p className="text-sm text-ink/50 mb-6">
          From image generators to sales tools — find AI built for the job you&apos;re actually trying to do.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryList.map((cat, i) => {
            const bg = ["bg-plum/10", "bg-gold/15", "bg-forest/10", "bg-coral/10"][i % 4];
            return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex items-start gap-3 bg-surface border border-line rounded-lg p-4 hover:border-plum transition-colors"
            >
              {cat.icon && (
                <span className={`text-xl leading-none shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${bg}`}>
                  {cat.icon}
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-medium text-[15px]">{cat.name}</h3>
                  <span className="text-xs text-ink/40 tabular-nums shrink-0">
                    {categoryCounts.get(cat.id) ?? 0}
                  </span>
                </div>
                {cat.description && (
                  <p className="text-sm text-ink/55 mt-1 leading-snug line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>
            </Link>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display font-bold text-2xl">Top Ranked</h2>
          <Link href="/tools" className="text-sm font-medium text-plum hover:underline">
            View all tools
          </Link>
        </div>
        <p className="text-sm text-ink/50 mb-6">
          The 12 highest by <Link href="/how-it-works" className="text-plum hover:underline">AIPick Score</Link> — votes, reviews and recent activity combined, not just newest or cheapest.
        </p>
        <div className="flex flex-col">
          {toolList.map((tool, i) => (
            <ToolRow key={tool.id} tool={tool} rank={i + 1} />
          ))}
          {toolList.length === 0 && (
            <p className="text-sm text-ink/55 py-10">
              No tools yet — the first ranking will appear as soon as tools are added.
            </p>
          )}
        </div>
      </section>

      {recentToolList.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-24">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display font-bold text-2xl">Newest additions</h2>
          </div>
          <p className="text-sm text-ink/50 mb-6">
            Freshly added to the directory — not yet ranked, but worth a look.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentToolList.map((tool) => (
              <Link
                key={tool.id}
                href={`/tool/${tool.slug}`}
                className="bg-surface border border-line rounded-lg p-4 hover:border-plum transition-colors"
              >
                <h3 className="font-display font-medium text-[15px]">{tool.name}</h3>
                <p className="text-sm text-ink/55 mt-1 leading-snug line-clamp-2">
                  {tool.short_description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentPostList.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-24">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display font-bold text-2xl">From the blog</h2>
            <Link href="/blog" className="text-sm font-medium text-plum hover:underline">
              View all posts
            </Link>
          </div>
          <p className="text-sm text-ink/50 mb-6">
            Guides and comparisons for picking the right AI tool.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {recentPostList.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block bg-surface border border-line rounded-lg overflow-hidden hover:border-plum transition-colors"
              >
                {post.cover_image_url && (
                  <div className="aspect-[16/9] overflow-hidden border-b border-line">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-display font-semibold text-[15px] leading-snug">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-ink/55 mt-1.5 leading-snug line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="font-display font-bold text-2xl mb-6">Frequently asked questions</h2>
        <div className="flex flex-col divide-y divide-line border-y border-line">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group py-4">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-display font-medium text-[15px]">
                {faq.q}
                <span className="text-ink/40 group-open:rotate-45 transition-transform text-lg shrink-0">+</span>
              </summary>
              <p className="text-sm text-ink/60 mt-2.5 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
