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
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">{category.name} AI Tools</h1>
      <p className="text-gray-600 mt-2">{category.description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tool/${tool.slug}`}
            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
          >
            <h3 className="font-semibold">{tool.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {tool.short_description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
