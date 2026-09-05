import { requireAdmin } from "@/lib/admin";
import type { Tool } from "@/types/database";
import Link from "next/link";

const PAGE_SIZE = 30;

type Props = {
  searchParams: { page?: string; q?: string; status?: string };
};

function buildPageHref(page: number, q: string, status: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export default async function AdminPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin();

  const q = (searchParams.q ?? "").trim();
  const status = (searchParams.status ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("tools")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data: tools, count } = await query.range(from, to);

  const toolList = (tools as Tool[] | null) ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx = total === 0 ? 0 : from + 1;
  const endIdx = Math.min(total, from + toolList.length);

  return (
    <main>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl">
          Tools <span className="text-ink/40 font-normal text-lg">({total})</span>
        </h1>
        <Link
          href="/admin/tools/new"
          className="bg-plum text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-plum-deep transition-colors"
        >
          + Add tool
        </Link>
      </div>

      <form method="get" className="flex gap-2 mt-5 flex-wrap">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or slug…"
          className="flex-1 min-w-[200px] border border-line rounded px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="border border-line rounded px-3 py-2 text-sm bg-white"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          type="submit"
          className="border border-line rounded px-4 py-2 text-sm font-medium hover:bg-ink/5 transition-colors"
        >
          Filter
        </button>
        {(q || status) && (
          <Link
            href="/admin"
            className="text-sm text-ink/45 hover:text-plum self-center"
          >
            Clear
          </Link>
        )}
      </form>

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
            {q || status ? "No tools match this filter." : "No tools yet — add the first one."}
          </p>
        )}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-line text-sm">
          <span className="text-ink/45">
            Showing {startIdx}–{endIdx} of {total}
          </span>
          <div className="flex items-center gap-1.5">
            {page > 1 ? (
              <Link
                href={buildPageHref(page - 1, q, status)}
                className="px-3 py-1.5 rounded-md border border-line hover:bg-ink/5 transition-colors"
              >
                ← Prev
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-md border border-line text-ink/25">
                ← Prev
              </span>
            )}
            <span className="px-3 py-1.5 text-ink/60">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildPageHref(page + 1, q, status)}
                className="px-3 py-1.5 rounded-md border border-line hover:bg-ink/5 transition-colors"
              >
                Next →
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-md border border-line text-ink/25">
                Next →
              </span>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
