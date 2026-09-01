import { createClient } from "@/lib/supabase/server";
import type { Tool, Category } from "@/types/database";
import Link from "next/link";

export const revalidate = 3600; // ISR: refresh homepage hourly

export default async function HomePage() {
  const supabase = createClient();

  const { data: tools } = await supabase
    .from("tools")
    .select("*")
    .eq("status", "active")
    .order("score", { ascending: false })
    .limit(12);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Discover the Best AI Tools
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Community-voted rankings across every category of AI tool.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {(categories as Category[] | null)?.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 text-sm"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Top Ranked Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(tools as Tool[] | null)?.map((tool) => (
            <Link
              key={tool.id}
              href={`/tool/${tool.slug}`}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
            >
              <h3 className="font-semibold">{tool.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {tool.short_description}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{tool.pricing_summary}</span>
                <span>▲ {tool.upvotes - tool.downvotes}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
