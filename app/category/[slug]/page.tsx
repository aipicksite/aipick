import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ToolListicle from "@/components/ToolListicle";

export const revalidate = 21600;

type Props = { params: { slug: string } };

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
  return {
    title: `Best ${result.category.name} AI Tools | AIPick`,
    description: result.category.description ?? `Community-ranked ${result.category.name.toLowerCase()} AI tools.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const result = await getCategory(params.slug);
  if (!result) notFound();
  const { category, tools } = result;

  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Category</span>
      <h1 className="font-display font-bold text-3xl mt-1">{category.name} AI Tools</h1>
      {category.description && (
        <p className="text-ink/65 mt-2 leading-relaxed max-w-xl">{category.description}</p>
      )}
      <p className="text-xs text-ink/40 mt-2">
        Ranked by community votes and reviews · updated every few hours
      </p>

      <ToolListicle tools={tools} />
    </main>
  );
}
