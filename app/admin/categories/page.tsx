import { requireAdmin } from "@/lib/admin";
import { createCategory, deleteCategory } from "@/app/admin/categories/actions";
import Link from "next/link";
import type { Category } from "@/types/database";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: { error?: string; warn?: string };
}) {
  const { supabase } = await requireAdmin();

  const [{ data: categories }, { data: counts }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    // One row per (category_id) — counted client-side below — cheaper than
    // N+1 count queries per category on a taxonomy that's about to get
    // several times bigger.
    supabase.from("tool_categories").select("category_id"),
  ]);

  const allCategories = (categories ?? []) as Category[];
  const parents = allCategories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of allCategories) {
    if (c.parent_id) {
      const list = childrenByParent.get(c.parent_id) ?? [];
      list.push(c);
      childrenByParent.set(c.parent_id, list);
    }
  }
  const toolCountByCategory = new Map<string, number>();
  for (const row of (counts ?? []) as { category_id: string }[]) {
    toolCountByCategory.set(row.category_id, (toolCountByCategory.get(row.category_id) ?? 0) + 1);
  }

  function CategoryRow({ cat, isChild }: { cat: Category; isChild?: boolean }) {
    const toolCount = toolCountByCategory.get(cat.id) ?? 0;
    return (
      <div className={`flex items-center justify-between gap-3 py-2.5 ${isChild ? "pl-8" : "px-1"}`}>
        <div className="flex items-center gap-2 min-w-0">
          {cat.icon && <span>{cat.icon}</span>}
          <span className="text-sm font-medium truncate">{cat.name}</span>
          <span className="text-xs text-ink/40 shrink-0">/{cat.slug}</span>
          <span className="text-xs text-ink/40 shrink-0">
            {toolCount} tool{toolCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs font-medium">
          <Link href={`/category/${cat.slug}`} target="_blank" className="text-ink/45 hover:text-plum">
            View
          </Link>
          <Link href={`/admin/categories/${cat.id}/edit`} className="text-plum hover:underline">
            Edit
          </Link>
          <form action={deleteCategory.bind(null, cat.id)}>
            <button type="submit" className="text-coral hover:underline">
              Delete
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Categories</h1>
      <p className="text-sm text-ink/55 mt-1.5">
        {allCategories.length} categories total. Subcategories nest one level under a parent —
        the same structure the homepage and /category pages already use.
      </p>

      {searchParams.error && (
        <div className="bg-coral/10 border border-coral/30 text-coral text-sm rounded-md px-4 py-3 mt-4">
          {searchParams.error}
        </div>
      )}
      {searchParams.warn && (
        <div className="bg-gold/10 border border-gold/30 text-ink/70 text-sm rounded-md px-4 py-3 mt-4">
          {searchParams.warn}{" "}
          <span className="text-ink/45">Re-submit the same form to add it anyway (rare — most of the time this means it already exists).</span>
        </div>
      )}

      <div className="bg-surface border border-line rounded-lg p-5 mt-6">
        <h2 className="font-display font-bold text-base mb-4">Add a category or subcategory</h2>
        <form action={createCategory} className="grid sm:grid-cols-2 gap-4">
          <input type="hidden" name="confirm_duplicate" value={searchParams.warn ? "1" : "0"} />
          <div>
            <label className="text-sm font-medium block mb-1">Name</label>
            <input name="name" required placeholder="e.g. Anime & Character Generation" className="w-full border border-line rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Slug (optional — auto-generated from name)</label>
            <input name="slug" placeholder="anime-character-generation" className="w-full border border-line rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Icon (single emoji)</label>
            <input name="icon" placeholder="🎴" maxLength={4} className="w-full border border-line rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Parent category (leave blank for a top-level category)</label>
            <select name="parent_id" defaultValue="" className="w-full border border-line rounded px-3 py-2 text-sm">
              <option value="">— None (top-level) —</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">Description (optional — shown on the category page)</label>
            <textarea name="description" rows={2} className="w-full border border-line rounded px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="text-sm font-medium px-4 py-2.5 rounded-md bg-plum text-white hover:bg-plum-deep transition-colors">
              Add category
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 flex flex-col divide-y divide-line">
        {parents.map((parent) => (
          <div key={parent.id}>
            <CategoryRow cat={parent} />
            {(childrenByParent.get(parent.id) ?? []).map((child) => (
              <CategoryRow key={child.id} cat={child} isChild />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
