import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Tool } from "@/types/database";
import ToolRow from "@/components/ToolRow";

export default async function SavedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/saved");

  const { data } = await supabase
    .from("saved_tools")
    .select("created_at, tools(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const tools = ((data?.map((row: any) => row.tools) ?? []) as Tool[]).filter(Boolean);

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Saved</span>
      <h1 className="font-display font-bold text-3xl mt-1">Your saved tools</h1>
      <p className="text-ink/60 mt-2">Tools you've bookmarked for later.</p>

      <div className="mt-8 flex flex-col">
        {tools.map((tool) => (
          <ToolRow key={tool.id} tool={tool} />
        ))}
        {tools.length === 0 && (
          <p className="text-sm text-ink/55 py-10">
            Nothing saved yet — tap the ☆ on any tool page to save it here.
          </p>
        )}
      </div>
    </main>
  );
}
