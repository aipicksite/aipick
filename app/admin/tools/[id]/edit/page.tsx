import { requireAdmin } from "@/lib/admin";
import { updateTool, deleteTool } from "@/app/admin/actions";
import ToolForm from "@/components/ToolForm";
import type { Category, Tool } from "@/types/database";
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

  const selectedCategoryIds = (links ?? []).map((l) => l.category_id);

  const updateToolWithId = updateTool.bind(null, params.id);
  const deleteToolWithId = deleteTool.bind(null, params.id);

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
    </main>
  );
}
