import { requireAdmin } from "@/lib/admin";
import { setReviewStatus } from "@/app/admin/moderation-actions";
import StarRating from "@/components/StarRating";

export default async function AdminReviewsPage() {
  const { supabase } = await requireAdmin();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, tools(name, slug), profiles(username)")
    .order("created_at", { ascending: false })
    .limit(100);

  const reviewList = (reviews as any[]) ?? [];

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
                  <button className="text-forest hover:underline">Publish</button>
                </form>
              )}
              {r.status !== "flagged" && (
                <form action={setReviewStatus.bind(null, r.id, "flagged")}>
                  <button className="text-gold hover:underline">Flag</button>
                </form>
              )}
              {r.status !== "removed" && (
                <form action={setReviewStatus.bind(null, r.id, "removed")}>
                  <button className="text-coral hover:underline">Remove</button>
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
