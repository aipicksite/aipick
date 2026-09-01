import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import { notFound } from "next/navigation";
import Link from "next/link";

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

  const tools = (toolLinks?.map((t: any) => t.tools) ?? []) as Tool[];

  return (
    <main className="max-w-6xl mx-auto px-4 py-14">
      <h1 className="font-display font-bold text-3xl">{category.name} AI Tools</h1>
      <p className="text-ink/70 mt-2 max-w-xl">{category.description}</p>

      <div className="divide-y divide-line border-t border-b border-line mt-10">
        {tools.map((tool, i) => (
          <Link
            key={tool.id}
            href={`/tool/${tool.slug}`}
            className="flex items-center gap-6 py-5 group"
          >
            <span className="rank-badge text-2xl font-bold text-ink/30 w-10 shrink-0 group-hover:text-accent transition-colors">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-medium text-lg">{tool.name}</h3>
              <p className="text-sm text-ink/60 truncate">{tool.short_description}</p>
            </div>
            <span className="text-sm text-ink/50 shrink-0 hidden sm:block">
              {tool.pricing_summary}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
