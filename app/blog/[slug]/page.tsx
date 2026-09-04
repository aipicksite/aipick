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

  const title = (post as any).meta_title || `${post.title} | AIPick Blog`;
  const description =
    (post as any).meta_description || post.excerpt || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `https://aipick.site/blog/${post.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://aipick.site/blog/${post.slug}`,
      type: "article",
      images: post.cover_image_url
        ? [{ url: post.cover_image_url }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/blog" className="text-sm text-plum hover:underline">
        ← Blog
      </Link>

      <h1 className="font-display font-bold text-3xl mt-4 leading-tight">
        {post.title}
      </h1>

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
          alt={post.title}
          className="w-full aspect-[16/9] object-cover rounded-lg mt-6 border border-line"
        />
      )}

      <article
        className="
          prose prose-neutral mt-8 max-w-none font-body text-[15px] leading-relaxed
          prose-headings:font-display
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:my-5
          prose-ul:my-5 prose-ol:my-5
          prose-li:my-1
          prose-a:text-plum
          prose-strong:text-ink
          prose-table:w-full
          prose-th:bg-surface prose-th:p-3 prose-th:text-left
          prose-td:p-3
          prose-img:rounded-lg prose-img:border prose-img:border-line
        "
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </main>
  );
}
