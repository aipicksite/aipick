import { requireAdmin } from "@/lib/admin";
import { updateCategory, deleteCategory } from "@/app/admin/categories/actions";
import type { Category } from "@/types/database";
import { notFound } from "next/navigation";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const { supabase } = await requireAdmin();

  const [{ data: category }, { data: parents }] = await Promise.all([
    supabase.from("categories").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("categories").select("*").is("parent_id", null).order("name"),
  ]);

  if (!category) notFound();

  const cat = category as Category;
  const parentOptions = ((parents ?? []) as Category[]).filter((p) => p.id !== cat.id);
  const boundUpdate = updateCategory.bind(null, cat.id);

  return (
    <main className="max-w-xl">
      <h1 className="font-display font-bold text-2xl">Edit category</h1>

      {searchParams.error && (
        <div className="bg-coral/10 border border-coral/30 text-coral text-sm rounded-md px-4 py-3 mt-4">
          {searchParams.error}
        </div>
      )}

      <form action={boundUpdate} className="flex flex-col gap-4 mt-6">
        <div>
          <label className="text-sm font-medium block mb-1">Name</label>
          <input name="name" required defaultValue={cat.name} className="w-full border border-line rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Slug</label>
          <input name="slug" defaultValue={cat.slug} className="w-full border border-line rounded px-3 py-2 text-sm" />
          <p className="text-xs text-ink/40 mt-1">
            Changing this changes the category's URL — anything linking to the old /category/{cat.slug} will 404.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Icon (single emoji)</label>
          <input name="icon" defaultValue={cat.icon ?? ""} maxLength={4} className="w-full max-w-[8rem] border border-line rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Parent category</label>
          <select name="parent_id" defaultValue={cat.parent_id ?? ""} className="w-full border border-line rounded px-3 py-2 text-sm">
            <option value="">— None (top-level) —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon} {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Description</label>
          <textarea name="description" rows={3} defaultValue={cat.description ?? ""} className="w-full border border-line rounded px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <button type="submit" className="text-sm font-medium px-4 py-2.5 rounded-md bg-plum text-white hover:bg-plum-deep transition-colors">
            Save changes
          </button>
          <a href="/admin/categories" className="text-sm text-ink/50 hover:text-ink">Cancel</a>
        </div>
      </form>

      <form action={deleteCategory.bind(null, cat.id)} className="mt-8 pt-6 border-t border-line">
        <p className="text-xs text-ink/45 mb-2">
          Deleting only works if this category has no subcategories and no tools attached.
        </p>
        <button type="submit" className="text-sm font-medium text-coral hover:underline">
          Delete this category
        </button>
      </form>
    </main>
  );
}
