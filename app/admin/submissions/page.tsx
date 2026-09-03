import { requireAdmin } from "@/lib/admin";
import { approveSubmission, rejectSubmission } from "@/app/admin/moderation-actions";
import type { ToolSubmission } from "@/types/database";

export default async function AdminSubmissionsPage() {
  const { supabase } = await requireAdmin();

  const { data: submissions } = await supabase
    .from("tool_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (submissions as ToolSubmission[] | null) ?? [];
  const pending = list.filter((s) => s.status === "pending");
  const reviewed = list.filter((s) => s.status !== "pending");

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Submissions</h1>
      <p className="text-sm text-ink/55 mt-1">
        User-submitted tools waiting for review. Approving creates a live tool.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {pending.map((s) => (
          <div key={s.id} className="bg-surface border border-line rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display font-semibold">{s.name}</h3>
                <a
                  href={s.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-plum hover:underline break-all"
                >
                  {s.website_url}
                </a>
                {s.short_description && (
                  <p className="text-sm text-ink/60 mt-2">{s.short_description}</p>
                )}
                {s.highlights && (
                  <ul className="mt-2 space-y-1">
                    {s.highlights.split("\n").map((h, hi) => (
                      h.trim() && (
                        <li key={hi} className="flex gap-2 text-xs text-ink/60">
                          <span className="text-forest shrink-0">✓</span>
                          <span>{h.trim()}</span>
                        </li>
                      )
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2 text-xs text-ink/45">
                  {s.pricing_type && <span className="border border-line rounded-full px-2 py-0.5">{s.pricing_type}</span>}
                  {s.category_names && <span className="border border-line rounded-full px-2 py-0.5">{s.category_names}</span>}
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full border border-gold/40 text-gold bg-gold-soft shrink-0">
                pending
              </span>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-line">
              <form action={approveSubmission.bind(null, s.id)}>
                <button className="bg-forest text-white text-xs font-medium px-3.5 py-1.5 rounded-md hover:opacity-90">
                  Approve → publish
                </button>
              </form>
              <form action={rejectSubmission.bind(null, s.id, "")} className="flex items-center gap-2">
                <button className="text-coral text-xs font-medium hover:underline">
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <p className="text-sm text-ink/55 py-6">No pending submissions.</p>
        )}
      </div>

      {reviewed.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-medium text-ink/50 uppercase tracking-wide">Reviewed</h2>
          <div className="mt-3 flex flex-col gap-2">
            {reviewed.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-2.5 text-sm">
                <span>{s.name}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    s.status === "approved"
                      ? "border-forest/25 text-forest bg-forest-soft"
                      : "border-coral/25 text-coral bg-coral-soft"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
