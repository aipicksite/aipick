import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import CreateListForm from "@/components/CreateListForm";

export const metadata: Metadata = {
  title: "Your Lists | AIPick",
  description: "Create and manage your own curated lists of AI tools.",
};

export default async function ListsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/lists");

  const { data: lists } = await supabase
    .from("custom_lists")
    .select("id, title, description, is_public, created_at, list_items(tool_id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Lists</span>
      <h1 className="font-display font-bold text-3xl mt-1">Your lists</h1>
      <p className="text-ink/60 mt-2">
        Curate your own collections — "Best free tools for students", "My marketing stack", anything.
      </p>

      <CreateListForm />

      <div className="mt-8 flex flex-col gap-3">
        {(lists ?? []).map((list: any) => (
          <Link
            key={list.id}
            href={`/lists/${list.id}`}
            className="block border border-line rounded-lg p-4 hover:border-plum transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{list.title}</span>
              <span className="text-xs text-ink/45 shrink-0">
                {list.list_items?.length ?? 0} tool{(list.list_items?.length ?? 0) === 1 ? "" : "s"}
                {!list.is_public && " · Private"}
              </span>
            </div>
            {list.description && (
              <p className="text-sm text-ink/60 mt-1 line-clamp-2">{list.description}</p>
            )}
          </Link>
        ))}

        {(lists ?? []).length === 0 && (
          <p className="text-sm text-ink/55 py-6">
            No lists yet — create your first one above.
          </p>
        )}
      </div>
    </main>
  );
}
