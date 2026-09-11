import { requireAdmin } from "@/lib/admin";
import { updateTool, deleteTool, addToolUpdate, deleteToolUpdate } from "@/app/admin/actions";
import ToolForm from "@/components/ToolForm";
import type { Category, Tool, ToolUpdate } from "@/types/database";
import { notFound } from "next/navigation";

type Props = { params: { id: string } };

export default async function EditToolPage({ params }: Props) {
  const { supabase } = await requireAdmin();

  const { data: tool } = await supabase
    .from("tools")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!tool) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const { data: links } = await supabase
    .from("tool_categories")
    .select("category_id")
    .eq("tool_id", params.id);

  const { data: updates } = await supabase
    .from("tool_updates")
    .select("*")
    .eq("tool_id", params.id)
    .order("created_at", { ascending: false });

  const selectedCategoryIds = (links ?? []).map((l) => l.category_id);

  const updateToolWithId = updateTool.bind(null, params.id);
  const deleteToolWithId = deleteTool.bind(null, params.id);
  const addToolUpdateWithId = addToolUpdate.bind(null, params.id);

  return (
    <main className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-3xl">
          Edit {(tool as Tool).name}
        </h1>
        <form action={deleteToolWithId}>
          <button
            type="submit"
            className="text-sm text-red-600 hover:underline"
          >
            Delete tool
          </button>
        </form>
      </div>
      <ToolForm
        tool={tool as Tool}
        categories={(categories as Category[] | null) ?? []}
        selectedCategoryIds={selectedCategoryIds}
        action={updateToolWithId}
        submitLabel="Save changes"
      />

      <section className="mt-12 pt-8 border-t border-line">
        <h2 className="font-display font-bold text-xl mb-1">Changelog</h2>
        <p className="text-sm text-ink/50 mb-4">
          Shown as &quot;Recent updates&quot; on the public tool page. Entries from an
          approved paid claim are added automatically — add one here for anything else
          (a manual fix, or a real product update you heard about directly).
        </p>

        <form action={addToolUpdateWithId} className="space-y-2 mb-6 bg-ink/[0.02] border border-line rounded-lg p-4">
          <input
            name="title"
            required
            placeholder='Title (e.g. "Added a new pricing tier")'
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Optional details"
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-plum text-white rounded px-4 py-1.5 text-sm font-medium hover:bg-plum-deep"
          >
            Add entry
          </button>
        </form>

        {((updates as ToolUpdate[] | null) ?? []).length === 0 ? (
          <p className="text-sm text-ink/40">No changelog entries yet.</p>
        ) : (
          <ul className="space-y-3">
            {((updates as ToolUpdate[] | null) ?? []).map((u) => (
              <li key={u.id} className="flex items-start justify-between gap-3 text-sm border-b border-line pb-3">
                <div>
                  <div className="font-medium">{u.title}</div>
                  {u.description && <div className="text-ink/55 mt-0.5">{u.description}</div>}
                  <div className="text-xs text-ink/40 mt-1">
                    {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
                <form action={deleteToolUpdate.bind(null, params.id, u.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline shrink-0">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
