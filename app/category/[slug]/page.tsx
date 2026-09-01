import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import { notFound } from "next/navigation";
import ToolRow from "@/components/ToolRow";

type Props = { params: { slug: string } };

export default async function CategoryPage({ params }: Props) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .single<Category>();

  if (!category) notFound();

  const { data: toolLinks } = await supabase
    .from("tool_categories")
    .select("tool_id, tools(*)")
    .eq("category_id", category.id);

  const tools = ((toolLinks?.map((t: any) => t.tools) ?? []) as Tool[]).sort(
    (a, b) => b.score - a.score
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-14">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Category</span>
      <h1 className="font-display font-bold text-3xl mt-1">{category.name} AI Tools</h1>
      <p className="text-ink/60 mt-2 max-w-xl">{category.description}</p>

      <div className="flex flex-col mt-10">
        {tools.map((tool, i) => (
          <ToolRow key={tool.id} tool={tool} rank={i + 1} />
        ))}
        {tools.length === 0 && (
          <p className="text-sm text-ink/55 py-10">No tools in this category yet.</p>
        )}
      </div>
    </main>
  );
}
