import { createClient } from "@/lib/supabase/server";
import type { Tool, Category, BlogPost } from "@/types/database";
import type { Metadata } from "next";
import Link from "next/link";
import ToolRow from "@/components/ToolRow";
import ToolSearchBox from "@/components/ToolSearchBox";
import FeaturedThumb from "@/components/FeaturedThumb";
import ToolAvatar from "@/components/ToolAvatar";
import { currentlyFeaturedIds } from "@/lib/featured-queue";
import PageViewTracker from "@/components/PageViewTracker";

const POPULAR_SEARCHES = [
  "AI chatbot",
  "Image generator",
  "Coding assistant",
  "Writing assistant",
  "Video generator",
  "AI SEO tool",
];

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
    icon: "👍",
    color: "plum",
  },
  {
    title: "Compare side by side",
    body: "Line up pricing, platforms and ratings before you commit to one tool.",
    icon: "⚖️",
    color: "gold",
  },
  {
    title: "Verified by owners",
    body: "Claimed listings are kept accurate by the people who actually run the tool.",
    icon: "✅",
    color: "forest",
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
    { data: reviewsForTestimonials },
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
    // Real community reviews for the homepage testimonials strip — never
    // fabricated. Only published, high-rated reviews with actual written
    // feedback qualify; genuinely empty if none exist yet.
    supabase
      .from("reviews")
      .select("*, profiles(username), tools(name, slug)")
      .eq("status", "published")
      .gte("rating", 4)
      .not("body", "is", null)
      .order("helpful_count", { ascending: false })
      .limit(9),
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

  // 2-level category tree for the homepage "Browse by category" section —
  // falls back gracefully to a flat list of top-level cards if parent_id
  // isn't set on any category yet (e.g. before the restructure migration
  // has been run).
  const childCategories = new Map<string, Category[]>();
  for (const cat of categoryList) {
    if (cat.parent_id) {
      const list = childCategories.get(cat.parent_id) ?? [];
      list.push(cat);
      childCategories.set(cat.parent_id, list);
    }
  }
  const parentCategories = categoryList
    .filter((c) => !c.parent_id)
    .sort((a, b) => {
      const countA = (categoryCounts.get(a.id) ?? 0) +
        (childCategories.get(a.id) ?? []).reduce((s, c) => s + (categoryCounts.get(c.id) ?? 0), 0);
      const countB = (categoryCounts.get(b.id) ?? 0) +
        (childCategories.get(b.id) ?? []).reduce((s, c) => s + (categoryCounts.get(c.id) ?? 0), 0);
      return countB - countA;
    })
    .slice(0, 8);

  const testimonialReviews = ((reviewsForTestimonials as any[] | null) ?? [])
    .filter((r) => r.body && r.body.trim().length > 0)
    .slice(0, 6);

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
      {
        "@type": "ItemList",
        name: "Top Ranked AI Tools on AIPick",
        itemListElement: toolList.slice(0, 12).map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://aipick.site/tool/${tool.slug}`,
          name: tool.name,
        })),
      },
    ],
  };

  return (
    <main>
      <PageViewTracker path="/" />
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
              "radial-gradient(60% 50% at 8% -5%, rgba(62,42,92,0.16), transparent), radial-gradient(50% 45% at 95% 10%, rgba(198,138,40,0.18), transparent), radial-gradient(45% 40% at 60% 105%, rgba(196,90,74,0.12), transparent), radial-gradient(35% 35% at 30% 60%, rgba(45,106,79,0.08), transparent)",
          }}
        />
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-5 text-center">
          <h1 className="font-display font-bold text-xl sm:text-3xl md:text-4xl leading-tight tracking-tight whitespace-nowrap">
            Find AI tools that work.
          </h1>
          <p className="mt-2 text-xs sm:text-base text-ink/65 max-w-xl mx-auto leading-relaxed whitespace-nowrap">
            Real reviews. Never pay-to-rank listings.
          </p>

          <div className="mt-5 max-w-2xl mx-auto">
            <ToolSearchBox
              variant="hero"
              placeholder={`Search ${totalTools ?? toolList.length}+ AI tools — “image generator”, “SEO”…`}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {POPULAR_SEARCHES.map((term) => (
              <Link
                key={term}
                href={`/tools?q=${encodeURIComponent(term)}`}
                className="text-xs px-3 py-1.5 rounded-full border border-line text-ink/55 hover:border-plum hover:text-plum transition-colors bg-surface"
              >
                {term}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-6 text-sm">
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
        </div>
      </section>

      {featuredTools.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mb-16">
          <span className="inline-block text-xs font-semibold text-gold bg-gold/15 px-2.5 py-1 rounded-full mb-2">Spotlight</span>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display font-bold text-2xl">
              <span className="text-gold">★</span> Featured
            </h2>
          </div>
          <p className="text-sm text-ink/50 mb-6">
            A rotating spotlight of standout tools. This is a labeled paid placement — it
            never changes a tool's AIPick Score or organic rank below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {featuredTools.slice(0, 15).map((tool, i) => {
              const accents = ["border-plum/25", "border-gold/35", "border-forest/25", "border-coral/25"];
              const accent = accents[i % accents.length];
              return (
                <Link
                  key={tool.id}
                  href={`/tool/${tool.slug}`}
                  className={`group flex sm:flex-col items-center sm:items-stretch gap-3 sm:gap-0 bg-surface border ${accent} rounded-xl overflow-hidden hover:shadow-lift transition-shadow p-2.5 sm:p-0`}
                >
                  <div className="w-16 h-16 sm:w-auto sm:h-auto shrink-0 rounded-lg sm:rounded-none overflow-hidden sm:aspect-[16/10] sm:border-b sm:border-line bg-ink/5">
                    <FeaturedThumb
                      websiteUrl={tool.website_url}
                      overrideUrl={tool.screenshot_url}
                      name={tool.name}
                      priority={i < 5}
                    />
                  </div>
                  <div className="min-w-0 flex-1 sm:p-4 sm:flex sm:flex-col sm:flex-1">
                    <h3 className="font-display font-semibold text-sm group-hover:text-plum leading-snug truncate sm:whitespace-normal sm:line-clamp-none">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-ink/50 mt-0.5 sm:mt-1 leading-snug line-clamp-2 sm:flex-1">
                      {tool.short_description}
                    </p>
                    {tool.rating_count > 0 && (
                      <span className="text-xs text-gold mt-1 sm:mt-2 block">
                        ★ {tool.rating_avg.toFixed(1)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const styles: Record<string, { bg: string; ring: string; text: string }> = {
              plum: { bg: "bg-plum/10", ring: "ring-plum/20", text: "text-plum" },
              gold: { bg: "bg-gold/15", ring: "ring-gold/25", text: "text-gold" },
              forest: { bg: "bg-forest/10", ring: "ring-forest/20", text: "text-forest" },
            };
            const s = styles[f.color] ?? styles.plum;
            return (
              <div
                key={f.title}
                className={`bg-surface border border-line rounded-xl p-5 hover:shadow-lift hover:-translate-y-0.5 transition-all ${s.bg}`}
              >
                <span
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-full ${s.bg} ring-1 ${s.ring} text-xl mb-3`}
                >
                  {f.icon}
                </span>
                <h3 className={`font-display font-semibold text-sm ${s.text}`}>{f.title}</h3>
                <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mb-16">
        <span className="inline-block text-xs font-semibold text-forest bg-forest/10 px-2.5 py-1 rounded-full mb-2">Explore</span>
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display font-bold text-2xl">Browse by category</h2>
        </div>
        <p className="text-sm text-ink/50 mb-6">
          From image generators to sales tools — find AI built for the job you&apos;re actually trying to do.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {parentCategories.map((parent, i) => {
            const bg = ["bg-plum/10", "bg-gold/15", "bg-forest/10", "bg-coral/10"][i % 4];
            const children = childCategories.get(parent.id) ?? [];
            const parentCount =
              (categoryCounts.get(parent.id) ?? 0) +
              children.reduce((sum, c) => sum + (categoryCounts.get(c.id) ?? 0), 0);
            return (
              <div
                key={parent.id}
                className="bg-surface border border-line rounded-lg p-4 hover:border-plum transition-colors"
              >
                <Link href={`/category/${parent.slug}`} className="flex items-start gap-3">
                  {parent.icon && (
                    <span className={`text-xl leading-none shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${bg}`}>
                      {parent.icon}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-medium text-[15px]">{parent.name}</h3>
                      <span className="text-xs text-ink/40 tabular-nums shrink-0">{parentCount}</span>
                    </div>
                    {parent.description && (
                      <p className="text-sm text-ink/55 mt-1 leading-snug line-clamp-2">
                        {parent.description}
                      </p>
                    )}
                  </div>
                </Link>
                {children.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pl-12">
                    {children.slice(0, 6).map((child) => (
                      <Link
                        key={child.id}
                        href={`/category/${child.slug}`}
                        className="text-xs px-2.5 py-1 rounded-full border border-line text-ink/55 hover:border-plum hover:text-plum transition-colors"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <span className="inline-block text-xs font-semibold text-plum bg-plum/10 px-2.5 py-1 rounded-full mb-2">Rankings</span>
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

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div
          className="relative overflow-hidden rounded-xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 justify-between"
          style={{ background: "linear-gradient(120deg, rgba(62,42,92,0.95), rgba(45,106,79,0.9))" }}
        >
          <div
            className="absolute inset-0 -z-10 opacity-40"
            style={{ background: "radial-gradient(60% 80% at 90% 0%, rgba(198,138,40,0.55), transparent)" }}
          />
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
              Not sure which tool fits? Compare them side by side.
            </h2>
            <p className="text-sm text-white/80 mt-2 max-w-lg leading-relaxed">
              Line up pricing, platforms, ratings and features for any two or more tools
              before you commit — no guessing, no sales pitch.
            </p>
          </div>
          <Link
            href="/compare"
            className="shrink-0 bg-gold text-plum-deep px-6 py-3 rounded-md text-sm font-semibold hover:brightness-105 transition-all shadow-lift"
          >
            Compare tools →
          </Link>
        </div>
      </section>

      {testimonialReviews.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-24">
          <span className="inline-block text-xs font-semibold text-coral bg-coral/10 px-2.5 py-1 rounded-full mb-2">Community</span>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display font-bold text-2xl">What the community is saying</h2>
          </div>
          <p className="text-sm text-ink/50 mb-6">
            Real reviews from real users — pulled straight from the ratings on each tool&apos;s page.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonialReviews.map((review) => (
              <Link
                key={review.id}
                href={`/tool/${review.tools?.slug}#reviews`}
                className="flex flex-col bg-surface border border-line rounded-lg p-5 hover:border-plum transition-colors"
              >
                <span className="text-gold text-sm">
                  {"★".repeat(review.rating)}
                  <span className="text-ink/20">{"★".repeat(5 - review.rating)}</span>
                </span>
                <p className="text-sm text-ink/70 mt-3 leading-relaxed line-clamp-4">
                  &ldquo;{review.body}&rdquo;
                </p>
                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-ink/45">
                  <span>{review.profiles?.username ?? "AIPick user"}</span>
                  <span className="font-medium text-plum">{review.tools?.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentToolList.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-24">
          <span className="inline-block text-xs font-semibold text-forest bg-forest/10 px-2.5 py-1 rounded-full mb-2">Fresh</span>
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
                className="flex items-center gap-3 bg-surface border border-line rounded-lg p-4 hover:border-plum transition-colors"
              >
                <ToolAvatar name={tool.name} logoUrl={tool.logo_url} websiteUrl={tool.website_url} size={40} />
                <div className="min-w-0">
                  <h3 className="font-display font-medium text-[15px] truncate">{tool.name}</h3>
                  <p className="text-sm text-ink/55 mt-0.5 leading-snug line-clamp-2">
                    {tool.short_description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentPostList.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-24">
          <span className="inline-block text-xs font-semibold text-plum bg-plum/10 px-2.5 py-1 rounded-full mb-2">From the blog</span>
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      width={640}
                      height={360}
                      loading="lazy"
                      decoding="async"
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

      <section className="max-w-3xl mx-auto px-4 pb-24">
        <span className="inline-block text-xs font-semibold text-plum bg-plum/10 px-2.5 py-1 rounded-full mb-2">About AIPick</span>
        <h2 className="font-display font-bold text-2xl mb-4">
          A community-ranked directory for finding AI tools that actually work
        </h2>
        <div className="text-sm text-ink/65 leading-relaxed space-y-4">
          <p>
            Most "best AI tools" lists online are really just paid placements dressed up as
            recommendations. AIPick works differently: every tool in the{" "}
            <Link href="/tools" className="text-plum hover:underline">directory</Link> earns its
            position through the same signals that matter to real users — upvotes, written
            reviews, and how active a listing has stayed over time. That combination is what we
            call the{" "}
            <Link href="/how-it-works" className="text-plum hover:underline">AIPick Score</Link>,
            and it's calculated the same way for every tool, whether it's a scrappy new launch or
            an established name people already know.
          </p>
          <p>
            Paid placement still exists on AIPick — tool owners can request a{" "}
            <Link href="/submit" className="text-plum hover:underline">Featured spot</Link> on the
            homepage — but it's rotated on a fair queue and clearly labeled, and it never touches
            a tool's organic score or its rank on the{" "}
            <Link href="/tools" className="text-plum hover:underline">full tools page</Link>. If
            you'd rather browse by use case than scroll a single long list, the{" "}
            <Link href="/category" className="text-plum hover:underline">category pages</Link>{" "}
            group tools by what they're actually for — writing, coding, image and video
            generation, SEO, productivity, and more — so you can go straight to the tools built
            for the job you're trying to do.
          </p>
          <h3 className="font-display font-semibold text-base text-ink pt-2">
            Comparing tools instead of guessing
          </h3>
          <p>
            Picking between two or three similar tools from their marketing pages alone is
            genuinely hard — pricing pages are written to flatter, not to inform. The{" "}
            <Link href="/compare" className="text-plum hover:underline">compare tool</Link> lines
            up pricing, platform support, and community ratings for any set of tools side by
            side, using the same review and voting data that powers the rankings above, so you're
            comparing like for like instead of piecing it together from separate tabs.
          </p>
          <p>
            Once you've found tools worth revisiting, you can{" "}
            <Link href="/saved" className="text-plum hover:underline">save them</Link> to your
            account, or group a handful into a shareable{" "}
            <Link href="/lists" className="text-plum hover:underline">custom list</Link> — a
            "best AI tools for freelancers" collection, say — that other visitors can browse,
            like, and comment on. And if you actually run one of the tools listed here, claiming
            it is free: a{" "}
            <Link href="/claim" className="text-plum hover:underline">verified owner</Link> can
            keep pricing and descriptions accurate as the product changes, which is part of why
            AIPick listings tend to stay more current than a lot of static "best of" roundups.
          </p>
          <p>
            None of this is static, either. New tools land in the directory regularly (see{" "}
            <span className="text-ink/50">Newest additions</span> above), rankings shift as more
            people vote and review, and the{" "}
            <Link href="/blog" className="text-plum hover:underline">blog</Link> covers
            comparisons and guides for picking the right tool in categories where the choice
            isn't obvious. The goal is the same one AIPick started with: a directory that reflects
            what real users think, not what advertisers paid for.
          </p>
          <h3 className="font-display font-semibold text-base text-ink pt-2">
            Why votes and reviews, not payment, decide rank
          </h3>
          <p>
            Anyone can leave a review or cast a vote once they've created a free account, and
            every rating is tied to that account rather than an anonymous form submission — the
            same friction that makes it harder for a tool owner to quietly inflate their own
            numbers also makes the signal more trustworthy for everyone reading it. Reviews with
            genuinely low or mixed ratings stay visible right alongside the positive ones; nothing
            gets hidden just because a tool owner would rather it weren't there. That's also why
            claimed, owner-verified listings carry a visible badge instead of a quiet promise —
            you can tell at a glance whether the pricing and feature list in front of you came
            from the team that built the tool or from the last time someone on AIPick's side
            checked in on it.
          </p>
          <p>
            If you're weighing a purchase or a subscription and want more than a single tool's
            page to go on, that's really the shortest path through AIPick: start broad on the{" "}
            <Link href="/tools" className="text-plum hover:underline">full directory</Link> or a
            relevant{" "}
            <Link href="/category" className="text-plum hover:underline">category</Link>, narrow
            it down with the{" "}
            <Link href="/compare" className="text-plum hover:underline">comparison tool</Link>{" "}
            once you've got two or three finalists, and read what actual users wrote before you
            commit. You can read more about how the whole project got started on the{" "}
            <Link href="/about" className="text-plum hover:underline">About page</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
