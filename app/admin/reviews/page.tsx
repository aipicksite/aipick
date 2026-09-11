import SubmitButton from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { setReviewStatus, dismissReviewReports } from "@/app/admin/moderation-actions";
import StarRating from "@/components/StarRating";

export default async function AdminReviewsPage() {
  const { supabase } = await requireAdmin();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, tools(name, slug), profiles(username)")
    .order("created_at", { ascending: false })
    .limit(100);

  const reviewList = (reviews as any[]) ?? [];

  // review_reports has no public RLS policy, so it needs the service
  // client even from this admin page.
  const admin = createServiceClient();
  const { data: pendingReports } = await admin
    .from("review_reports")
    .select("review_id")
    .eq("status", "pending");
  const reportCounts = new Map<string, number>();
  for (const r of (pendingReports as { review_id: string }[] | null) ?? []) {
    reportCounts.set(r.review_id, (reportCounts.get(r.review_id) ?? 0) + 1);
  }

  // Reported reviews first so admins see them without having to hunt.
  reviewList.sort((a, b) => (reportCounts.get(b.id) ?? 0) - (reportCounts.get(a.id) ?? 0));

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Reviews</h1>
      <p className="text-sm text-ink/55 mt-1">
        Reviews publish immediately. Flag or remove anything that breaks the
        content guidelines.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {reviewList.map((r) => (
          <div key={r.id} className="bg-surface border border-line rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{r.tools?.name ?? "Unknown tool"}</span>
                  <span className="text-ink/40">— @{r.profiles?.username ?? "user"}</span>
                  {(reportCounts.get(r.id) ?? 0) > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-coral/30 text-coral bg-coral-soft">
                      🚩 Reported ({reportCounts.get(r.id)})
                    </span>
                  )}
                </div>
                <div className="mt-1"><StarRating value={r.rating} readOnly size={14} /></div>
                {r.body && <p className="text-sm text-ink/65 mt-2 leading-relaxed">{r.body}</p>}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full border shrink-0 ${
                  r.status === "published"
                    ? "border-forest/25 text-forest bg-forest-soft"
                    : r.status === "flagged"
                    ? "border-gold/40 text-gold bg-gold-soft"
                    : "border-coral/25 text-coral bg-coral-soft"
                }`}
              >
                {r.status}
              </span>
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              {r.status !== "published" && (
                <form action={setReviewStatus.bind(null, r.id, "published")}>
                  <SubmitButton pendingText="…" className="text-forest hover:underline">Publish</SubmitButton>
                </form>
              )}
              {r.status !== "flagged" && (
                <form action={setReviewStatus.bind(null, r.id, "flagged")}>
                  <SubmitButton pendingText="…" className="text-gold hover:underline">Flag</SubmitButton>
                </form>
              )}
              {r.status !== "removed" && (
                <form action={setReviewStatus.bind(null, r.id, "removed")}>
                  <SubmitButton pendingText="…" className="text-coral hover:underline">Remove</SubmitButton>
                </form>
              )}
              {(reportCounts.get(r.id) ?? 0) > 0 && (
                <form action={dismissReviewReports.bind(null, r.id)}>
                  <SubmitButton pendingText="…" className="text-ink/50 hover:underline">
                    Dismiss report{(reportCounts.get(r.id) ?? 0) > 1 ? "s" : ""}
                  </SubmitButton>
                </form>
              )}
            </div>
          </div>
        ))}
        {reviewList.length === 0 && (
          <p className="text-sm text-ink/55 py-8">No reviews yet.</p>
        )}
      </div>
    </main>
  );
}
