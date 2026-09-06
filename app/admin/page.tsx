import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

function StatCard({
  label,
  value,
  href,
  urgent,
}: {
  label: string;
  value: number;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`bg-surface border rounded-lg p-5 hover:border-plum transition-colors ${
        urgent && value > 0 ? "border-gold/40" : "border-line"
      }`}
    >
      <p className="text-xs font-medium text-ink/45 uppercase tracking-wide">{label}</p>
      <p className="font-display font-bold text-3xl mt-1.5">{value}</p>
      {urgent && value > 0 && (
        <p className="text-xs text-gold mt-1">needs review</p>
      )}
    </Link>
  );
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();

  const [
    { count: totalTools },
    { count: activeTools },
    { count: pendingSubmissions },
    { count: pendingClaims },
    { count: flaggedReviews },
    { count: totalPosts },
    { count: draftPosts },
    { count: totalUsers },
    { data: recentSubmissions },
    { data: recentClaims },
  ] = await Promise.all([
    supabase.from("tools").select("*", { count: "exact", head: true }),
    supabase.from("tools").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tool_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("tool_claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "flagged"),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).is("published_at", null),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("tool_submissions")
      .select("name, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("tool_claims")
      .select("business_email, created_at, tools(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const needsAttention = (pendingSubmissions ?? 0) + (pendingClaims ?? 0) + (flaggedReviews ?? 0);

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Overview</h1>
      <p className="text-sm text-ink/55 mt-1.5">
        {needsAttention > 0
          ? `${needsAttention} item${needsAttention === 1 ? "" : "s"} waiting on your review.`
          : "Everything's caught up — nothing waiting on review right now."}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <StatCard label="Pending submissions" value={pendingSubmissions ?? 0} href="/admin/submissions" urgent />
        <StatCard label="Pending claims" value={pendingClaims ?? 0} href="/admin/claims" urgent />
        <StatCard label="Flagged reviews" value={flaggedReviews ?? 0} href="/admin/reviews" urgent />
        <StatCard label="Draft posts" value={draftPosts ?? 0} href="/admin/blog" />
        <StatCard label="Active tools" value={activeTools ?? 0} href="/admin/tools" />
        <StatCard label="Total tools" value={totalTools ?? 0} href="/admin/tools" />
        <StatCard label="Published posts" value={(totalPosts ?? 0) - (draftPosts ?? 0)} href="/admin/blog" />
        <StatCard label="Registered users" value={totalUsers ?? 0} href="/admin/analytics" />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg">Latest submissions</h2>
            <Link href="/admin/submissions" className="text-sm text-plum hover:underline">
              Review all →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {(recentSubmissions ?? []).map((s: any, i: number) => (
              <div key={i} className="bg-surface border border-line rounded-lg px-4 py-3 text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="text-ink/40 ml-2">
                  {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
            {(recentSubmissions ?? []).length === 0 && (
              <p className="text-sm text-ink/50">No pending submissions.</p>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg">Latest ownership claims</h2>
            <Link href="/admin/claims" className="text-sm text-plum hover:underline">
              Review all →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {(recentClaims ?? []).map((c: any, i: number) => (
              <div key={i} className="bg-surface border border-line rounded-lg px-4 py-3 text-sm">
                <span className="font-medium">{c.tools?.name ?? "Unknown tool"}</span>
                <span className="text-ink/40 ml-2">{c.business_email}</span>
              </div>
            ))}
            {(recentClaims ?? []).length === 0 && (
              <p className="text-sm text-ink/50">No pending claims.</p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-line">
        <h2 className="font-display font-bold text-lg mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/tools/new" className="text-sm border border-line rounded-md px-3.5 py-2 hover:border-plum transition-colors">+ Add a tool</Link>
          <Link href="/admin/blog/new" className="text-sm border border-line rounded-md px-3.5 py-2 hover:border-plum transition-colors">+ Write a blog post</Link>
          <Link href="/admin/tools/export" className="text-sm border border-line rounded-md px-3.5 py-2 hover:border-plum transition-colors">Export tool list</Link>
          <Link href="/admin/analytics" className="text-sm border border-line rounded-md px-3.5 py-2 hover:border-plum transition-colors">View analytics</Link>
          <Link href="/admin/seo" className="text-sm border border-line rounded-md px-3.5 py-2 hover:border-plum transition-colors">SEO settings</Link>
        </div>
      </div>
    </main>
  );
}
