import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import MarkdownContent from "@/components/MarkdownContent";
import TableOfContents from "@/components/TableOfContents";
import ArticleSidebar from "@/components/ArticleSidebar";
import { extractHeadings, splitAfterParagraphs } from "@/lib/article-toc";
import { extractFaqs } from "@/lib/article-schema";
import PageViewTracker from "@/components/PageViewTracker";

export const revalidate = 60; // short ISR window as a safety net alongside on-demand revalidatePath from admin edits

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
  const description = (post as any).meta_description || post.excerpt || undefined;
  return {
    title,
    description,
    alternates: { canonical: `https://aipick.site/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `https://aipick.site/blog/${post.slug}`,
      type: "article",
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at || undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const toc = extractHeadings(post.body);
  const { intro, rest } = splitAfterParagraphs(post.body, 2);
  const shareUrl = `https://aipick.site/blog/${post.slug}`;
  const faqs = extractFaqs(post.body);

  // Structured data: Article (so Google can show it as a rich article
  // result with the real cover image and publish/update dates), a
  // BreadcrumbList (Home > Blog > this post), and — only when the article
  // actually has a "Frequently Asked Questions" section — FAQPage, which
  // is what lets individual Q&As show up directly in search results.
  // Pulled straight from the same markdown body already rendered on the
  // page, so this stays in sync automatically as posts are edited.
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: { "@type": "Organization", name: "AIPick" },
    publisher: {
      "@type": "Organization",
      name: "AIPick",
      logo: { "@type": "ImageObject", url: "https://aipick.site/icon.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": shareUrl },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://aipick.site/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://aipick.site/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: shareUrl },
    ],
  };
  const faqLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-16">
      <PageViewTracker path={`/blog/${post.slug}`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      <div className="max-w-2xl mx-auto lg:max-w-none">
        <Link href="/blog" className="text-sm text-plum hover:underline">← Blog</Link>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10 mt-4">
        {/* Main content */}
        <div className="min-w-0 max-w-2xl mx-auto lg:mx-0 w-full">
          <h1 className="font-display font-bold text-3xl leading-tight">{post.title}</h1>

          {post.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full aspect-[16/9] object-cover rounded-lg mt-6 border border-line"
            />
          )}

          <article className="mt-8 max-w-none">
            <MarkdownContent content={intro} />

            {/* Inline TOC, dropped in after ~2 paragraphs so mobile readers
                (who don't see the sidebar) still get a jump-to-section list. */}
            {rest && toc.length > 0 && <TableOfContents items={toc} variant="inline" />}

            {rest && <MarkdownContent content={rest} />}
          </article>
        </div>

        {/* Sidebar — hidden on mobile, sticky on desktop */}
        <div className="hidden lg:block">
          <ArticleSidebar shareUrl={shareUrl} />
        </div>
      </div>
    </main>
  );
}
