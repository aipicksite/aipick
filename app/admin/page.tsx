import { requireAdmin } from "@/lib/admin";
import type { Tool } from "@/types/database";
import Link from "next/link";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const { data: tools } = await supabase
    .from("tools")
    .select("*")
    .order("created_at", { ascending: false });

  const toolList = (tools as Tool[] | null) ?? [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-14">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-3xl">Admin — Tools</h1>
        <Link
          href="/admin/tools/new"
          className="bg-ink text-base rounded px-4 py-2 text-sm font-medium hover:bg-ink/90"
        >
          + Add tool
        </Link>
      </div>

      <div className="divide-y divide-line border-t border-b border-line mt-8">
        {toolList.map((tool) => (
          <div key={tool.id} className="flex items-center gap-4 py-4">
            <div className="flex-1 min-w-0">
              <span className="font-medium">{tool.name}</span>
              <span className="text-ink/50 text-sm ml-2">/{tool.slug}</span>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                tool.status === "active"
                  ? "border-line text-ink/60"
                  : "border-red-200 text-red-600"
              }`}
            >
              {tool.status}
            </span>
            <Link
              href={`/admin/tools/${tool.id}/edit`}
              className="text-sm text-violet hover:underline"
            >
              Edit
            </Link>
          </div>
        ))}
        {toolList.length === 0 && (
          <p className="py-8 text-sm text-ink/60">
            No tools yet — add the first one.
          </p>
        )}
      </div>
    </main>
  );
}
