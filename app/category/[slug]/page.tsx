import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ToolListicle from "@/components/ToolListicle";
import Pagination from "@/components/Pagination";

export const revalidate = 21600;

const PAGE_SIZE = 10;

type Props = { params: { slug: string }; searchParams: { page?: string } };

async function getCategory(slug: string) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single<Category>();

  if (!category) return null;

  const { data: toolLinks } = await supabase
    .from("tool_categories")
    .select("tool_id, tools(*)")
    .eq("category_id", category.id);

  const tools = ((toolLinks?.map((t: any) => t.tools) ?? []) as Tool[])
    .filter((t) => t.status === "active")
    .sort((a, b) => b.score - a.score);

  return { category, tools };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getCategory(params.slug);
  if (!result) return {};
  const title = `Best ${result.category.name} AI Tools | AIPick`;
  const description = result.category.description ?? `Community-ranked ${result.category.name.toLowerCase()} AI tools.`;
  return {
    title,
    description,
    alternates: { canonical: `https://aipick.site/category/${params.slug}` },
    openGraph: { title, description, url: `https://aipick.site/category/${params.slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const result = await getCategory(params.slug);
  if (!result) notFound();
  const { category, tools } = result;

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(tools.length / PAGE_SIZE));
  const pageTools = tools.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} AI Tools`,
    itemListElement: pageTools.map((t, i) => ({
      "@type": "ListItem",
      position: (page - 1) * PAGE_SIZE + i + 1,
      url: `https://aipick.site/tool/${t.slug}`,
      name: t.name,
    })),
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Category</span>
      <h1 className="font-display font-bold text-3xl mt-1">{category.name} AI Tools</h1>
      {category.description && (
        <p className="text-ink/65 mt-2 leading-relaxed max-w-xl">{category.description}</p>
      )}
      <p className="text-xs text-ink/40 mt-2">
        {tools.length} tool{tools.length === 1 ? "" : "s"} · ranked by community votes and reviews
      </p>

      <ToolListicle tools={pageTools} rankOffset={(page - 1) * PAGE_SIZE} />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        buildUrl={(p) => (p === 1 ? `/category/${category.slug}` : `/category/${category.slug}?page=${p}`)}
      />
    </main>
  );
}
