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
    <main>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">Tools</h1>
        <Link
          href="/admin/tools/new"
          className="bg-plum text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-plum-deep transition-colors"
        >
          + Add tool
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {toolList.map((tool) => (
          <div
            key={tool.id}
            className="flex items-center gap-4 bg-surface border border-line rounded-lg px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <span className="font-medium">{tool.name}</span>
              <span className="text-ink/45 text-sm ml-2">/{tool.slug}</span>
            </div>
            {tool.rating_count > 0 && (
              <span className="text-xs text-ink/45 shrink-0">
                ★ {tool.rating_avg.toFixed(1)} ({tool.rating_count})
              </span>
            )}
            <span
              className={`text-xs px-2 py-1 rounded-full border shrink-0 ${
                tool.status === "active"
                  ? "border-forest/25 text-forest bg-forest-soft"
                  : "border-coral/25 text-coral bg-coral-soft"
              }`}
            >
              {tool.status}
            </span>
            <Link
              href={`/admin/tools/${tool.id}/edit`}
              className="text-sm text-plum hover:underline shrink-0"
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
