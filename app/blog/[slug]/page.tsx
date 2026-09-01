import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

type Props = { params: { slug: string } };

async function getPost(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  return data as BlogPost | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | AIPick Blog`,
    description: post.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <Link href="/blog" className="text-sm text-plum hover:underline">← Blog</Link>
      <h1 className="font-display font-bold text-3xl mt-4 leading-tight">{post.title}</h1>
      {post.published_at && (
        <p className="text-sm text-ink/45 mt-2">
          {new Date(post.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt=""
          className="w-full aspect-[16/9] object-cover rounded-lg mt-6 border border-line"
        />
      )}

      <article className="prose prose-neutral mt-8 max-w-none font-body text-[15px] leading-relaxed whitespace-pre-line">
        {post.body}
      </article>
    </main>
  );
}
