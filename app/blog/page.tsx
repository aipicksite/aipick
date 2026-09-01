import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/database";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog | AIPick",
  description: "AI tool guides, comparisons, and community picks from AIPick.",
};

export default async function BlogIndexPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .lte("published_at", new Date().toISOString())
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  const posts = (data as BlogPost[] | null) ?? [];

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Blog</span>
      <h1 className="font-display font-bold text-3xl mt-1">Guides, comparisons & picks</h1>
      <p className="text-ink/60 mt-3">Community-driven writing on choosing and using AI tools well.</p>

      <div className="mt-10 flex flex-col gap-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="block bg-surface border border-line rounded-lg p-5 hover:border-plum transition-colors"
          >
            <h2 className="font-display font-semibold text-lg group-hover:text-plum">{post.title}</h2>
            {post.excerpt && <p className="text-sm text-ink/60 mt-2 leading-relaxed">{post.excerpt}</p>}
            {post.published_at && (
              <p className="text-xs text-ink/40 mt-3">
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </Link>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-16 bg-surface border border-dashed border-line rounded-lg">
            <p className="text-ink/55 text-sm">
              First posts are on the way — check back soon.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
