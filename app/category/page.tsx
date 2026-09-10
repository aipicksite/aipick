import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";
import type { Metadata } from "next";
import Link from "next/link";
import PageViewTracker from "@/components/PageViewTracker";

export const revalidate = 21600; // 6 hours — matches other ranking/category pages

export const metadata: Metadata = {
  title: "Browse AI Tool Categories | AIPick",
  description: "Every AI tool category on AIPick, from writing and image generation to sales, dev tools, and more — with how many tools are ranked in each.",
  alternates: { canonical: "https://aipick.site/category" },
};

export default async function CategoryIndexPage() {
  const supabase = createClient();

  const [{ data: categories }, { data: activeToolIds }, { data: categoryLinks }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("tools").select("id").eq("status", "active"),
    supabase.from("tool_categories").select("tool_id, category_id"),
  ]);

  const categoryList = (categories as Category[] | null) ?? [];
  const activeIdSet = new Set((activeToolIds ?? []).map((t: { id: string }) => t.id));
  const categoryCounts = new Map<string, number>();
  for (const link of (categoryLinks ?? []) as { tool_id: string; category_id: string }[]) {
    if (activeIdSet.has(link.tool_id)) {
      categoryCounts.set(link.category_id, (categoryCounts.get(link.category_id) ?? 0) + 1);
    }
  }

  const childCategories = new Map<string, Category[]>();
  for (const cat of categoryList) {
    if (cat.parent_id) {
      const list = childCategories.get(cat.parent_id) ?? [];
      list.push(cat);
      childCategories.set(cat.parent_id, list);
    }
  }

  function totalCount(cat: Category): number {
    const own = categoryCounts.get(cat.id) ?? 0;
    const children = childCategories.get(cat.id) ?? [];
    return own + children.reduce((sum, c) => sum + (categoryCounts.get(c.id) ?? 0), 0);
  }

  const parentCategories = categoryList
    .filter((c) => !c.parent_id)
    .sort((a, b) => totalCount(b) - totalCount(a));

  return (
    <main className="max-w-5xl mx-auto px-4 py-14">
      <PageViewTracker path="/category" />
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Browse</span>
      <h1 className="font-display font-bold text-3xl mt-1">AI tool categories</h1>
      <p className="text-ink/65 mt-2 leading-relaxed max-w-xl">
        Every category on AIPick, ranked by how many active tools are in it. Pick one to see
        the community-ranked list.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-10">
        {parentCategories.map((parent, i) => {
          const bg = ["bg-plum/10", "bg-gold/15", "bg-forest/10", "bg-coral/10"][i % 4];
          const children = (childCategories.get(parent.id) ?? []).sort(
            (a, b) => (categoryCounts.get(b.id) ?? 0) - (categoryCounts.get(a.id) ?? 0)
          );
          const count = totalCount(parent);
          return (
            <div
              key={parent.id}
              className="bg-surface border border-line rounded-lg p-4 hover:border-plum transition-colors"
            >
              <Link href={`/category/${parent.slug}`} className="flex items-start gap-3">
                {parent.icon && (
                  <span className={`text-xl leading-none shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${bg}`}>
                    {parent.icon}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-medium text-[15px]">{parent.name}</h2>
                    <span className="text-xs text-ink/40 tabular-nums shrink-0">{count}</span>
                  </div>
                  {parent.description && (
                    <p className="text-sm text-ink/55 mt-1 leading-snug line-clamp-2">
                      {parent.description}
                    </p>
                  )}
                </div>
              </Link>
              {children.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pl-12">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/category/${child.slug}`}
                      className="text-xs px-2.5 py-1 rounded-full border border-line text-ink/55 hover:border-plum hover:text-plum transition-colors"
                    >
                      {child.name} · {categoryCounts.get(child.id) ?? 0}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {parentCategories.length === 0 && (
          <p className="text-sm text-ink/55 py-10">No categories yet.</p>
        )}
      </div>
    </main>
  );
}
