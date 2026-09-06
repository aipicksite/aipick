import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/database";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog | AIPick — Guides, Comparisons & Picks",
  description:
    "Practical guides and comparisons for choosing, evaluating, and getting the most out of AI tools — written to help you decide, not just to rank.",
  alternates: { canonical: "https://aipick.site/blog" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogIndexPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .lte("published_at", new Date().toISOString())
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  const posts = (data as BlogPost[] | null) ?? [];
  const [featured, ...rest] = posts;

  const jsonLd = posts.length
    ? {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "AIPick Blog",
        url: "https://aipick.site/blog",
        blogPost: posts.slice(0, 20).map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: `https://aipick.site/blog/${post.slug}`,
          datePublished: post.published_at,
          image: post.cover_image_url ?? undefined,
        })),
      }
    : null;

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      {jsonLd && (
        // eslint-disable-next-line react/no-danger
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <span className="text-xs font-medium text-plum uppercase tracking-wide">Blog</span>
      <h1 className="font-display font-bold text-3xl md:text-4xl mt-1.5 max-w-2xl">
        Guides and comparisons for picking the right AI tool
      </h1>
      <p className="text-ink/60 mt-3 max-w-xl leading-relaxed">
        Written from real votes and reviews on AIPick — not sponsored placements.
      </p>

      {posts.length === 0 && (
        <div className="text-center py-16 mt-10 bg-surface border border-dashed border-line rounded-lg">
          <p className="text-ink/55 text-sm">
            First posts are on the way — check back soon.
          </p>
        </div>
      )}

      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          className="mt-10 grid md:grid-cols-[1.1fr_0.9fr] gap-6 bg-surface border border-line rounded-lg overflow-hidden hover:border-plum transition-colors group"
        >
          {featured.cover_image_url ? (
            <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
              <img
                src={featured.cover_image_url}
                alt={featured.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/10] md:aspect-auto bg-gradient-to-br from-plum to-plum-deep" />
          )}
          <div className="p-6 md:pr-8 flex flex-col justify-center">
            <span className="text-xs font-medium text-ink/40">Latest</span>
            <h2 className="font-display font-bold text-2xl mt-1.5 leading-snug group-hover:text-plum transition-colors">
              {featured.title}
            </h2>
            {featured.excerpt && (
              <p className="text-sm text-ink/60 mt-3 leading-relaxed">{featured.excerpt}</p>
            )}
            {featured.published_at && (
              <p className="text-xs text-ink/40 mt-4">{formatDate(featured.published_at)}</p>
            )}
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="flex flex-col bg-surface border border-line rounded-lg overflow-hidden hover:border-plum transition-colors group"
            >
              {post.cover_image_url ? (
                <div className="aspect-[16/9] overflow-hidden border-b border-line">
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gradient-to-br from-plum to-plum-deep border-b border-line" />
              )}
              <div className="p-5 flex-1 flex flex-col">
                <h2 className="font-display font-semibold text-lg leading-snug group-hover:text-plum transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-ink/60 mt-2 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
                {post.published_at && (
                  <p className="text-xs text-ink/40 mt-4">{formatDate(post.published_at)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
