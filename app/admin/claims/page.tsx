import { requireAdmin } from "@/lib/admin";
import { approveClaim, rejectClaim } from "@/app/admin/moderation-actions";

export default async function AdminClaimsPage() {
  const { supabase } = await requireAdmin();

  const { data: claims } = await supabase
    .from("tool_claims")
    .select("*, tools(name, slug)")
    .order("created_at", { ascending: false });

  const list = (claims as any[]) ?? [];
  const pending = list.filter((c) => c.status === "pending");
  const reviewed = list.filter((c) => c.status !== "pending");

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Ownership claims</h1>
      <p className="text-sm text-ink/55 mt-1">
        Approving marks the tool verified and hands editing rights to that user.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {pending.map((c) => (
          <div key={c.id} className="bg-surface border border-line rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display font-semibold">{c.tools?.name ?? "Unknown tool"}</h3>
                <p className="text-sm text-ink/60 mt-1">
                  {c.business_email} {c.role && <span className="text-ink/40">· {c.role}</span>}
                </p>
                {c.note && <p className="text-sm text-ink/55 mt-2">{c.note}</p>}
              </div>
              <span className="text-xs px-2 py-1 rounded-full border border-gold/40 text-gold bg-gold-soft shrink-0">
                pending
              </span>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-line">
              <form action={approveClaim.bind(null, c.id)}>
                <button className="bg-forest text-white text-xs font-medium px-3.5 py-1.5 rounded-md hover:opacity-90">
                  Approve & verify
                </button>
              </form>
              <form action={rejectClaim.bind(null, c.id, "")}>
                <button className="text-coral text-xs font-medium hover:underline">Reject</button>
              </form>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <p className="text-sm text-ink/55 py-6">No pending claims.</p>
        )}
      </div>

      {reviewed.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-medium text-ink/50 uppercase tracking-wide">Reviewed</h2>
          <div className="mt-3 flex flex-col gap-2">
            {reviewed.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-2.5 text-sm">
                <span>{c.tools?.name ?? "Unknown tool"} — {c.business_email}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    c.status === "approved"
                      ? "border-forest/25 text-forest bg-forest-soft"
                      : "border-coral/25 text-coral bg-coral-soft"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
