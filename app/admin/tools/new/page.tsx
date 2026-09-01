import { requireAdmin } from "@/lib/admin";
import { createTool } from "@/app/admin/actions";
import ToolForm from "@/components/ToolForm";
import type { Category } from "@/types/database";

export default async function NewToolPage() {
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <main className="max-w-2xl mx-auto px-4 py-14">
      <h1 className="font-display font-bold text-3xl">Add a tool</h1>
      <ToolForm
        categories={(categories as Category[] | null) ?? []}
        action={createTool}
        submitLabel="Create tool"
      />
    </main>
  );
}
