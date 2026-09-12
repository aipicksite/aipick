import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

function StatCard({
  label,
  value,
  href,
  urgent,
  sub,
}: {
  label: string;
  value: number | string;
  href?: string;
  urgent?: boolean;
  sub?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-medium text-ink/45 uppercase tracking-wide">{label}</p>
      <p className="font-display font-bold text-2xl sm:text-3xl mt-1.5">{value}</p>
      {urgent && Number(value) > 0 && <p className="text-xs text-gold mt-1">needs review</p>}
      {sub && <p className="text-xs text-ink/45 mt-1">{sub}</p>}
    </>
  );
  const cls = `bg-surface border rounded-lg p-4 sm:p-5 ${
    urgent && Number(value) > 0 ? "border-gold/40" : "border-line"
  } ${href ? "hover:border-plum transition-colors" : ""}`;

  return href ? (
    <Link href={href} className={cls}>
      {content}
    </Link>
  ) : (
    <div className={cls}>{content}</div>
  );
}

function Bar({ label, value, max, href }: { label: string; value: number; max: number; href?: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  const inner = (
    <>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="truncate max-w-[70%]" title={label}>{label}</span>
        <span className="text-ink/50 font-medium shrink-0">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-ink/5 overflow-hidden">
        <div className="h-full bg-plum rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  );
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();
  // page_views reads use the service-role client, not the RLS-scoped one —
  // if that table's Row Level Security has no (or too narrow a) SELECT
  // policy for regular authenticated users, admin queries against it would
  // silently return zero rows (RLS denial isn't an error, just empty
  // results), which is exactly what "Traffic sources shows no data" looks
  // like. Service role bypasses RLS entirely, so this works regardless of
  // how that table's policies are set up.
  const admin = createAdminClient();

  const now = Date.now();
  const day = 86400000;

  const [
    { count: totalTools },
    { count: activeTools },
    { count: pendingSubmissions },
    { count: pendingClaims },
    { count: flaggedReviews },
    { count: totalPosts },
    { count: draftPosts },
    { count: totalUsers },
    { count: newUsers7d },
    { count: reviewCount },
    { count: savedCount },
    { count: listCount },
    { count: viewsTotal },
    { count: views7d },
    { count: views30d },
    { data: recentSubmissions },
    { data: recentClaims },
    { data: tools },
  ] = await Promise.all([
    supabase.from("tools").select("*", { count: "exact", head: true }),
    supabase.from("tools").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tool_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("tool_claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "flagged"),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).is("published_at", null),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", new Date(now - 7 * day).toISOString()),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("saved_tools").select("*", { count: "exact", head: true }),
    supabase.from("custom_lists").select("*", { count: "exact", head: true }),
    admin.from("page_views").select("*", { count: "exact", head: true }),
    admin.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", new Date(now - 7 * day).toISOString()),
    admin.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", new Date(now - 30 * day).toISOString()),
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
    supabase.from("tools").select("id, name, slug, upvotes, downvotes, rating_avg, rating_count"),
  ]);

  const needsAttention = (pendingSubmissions ?? 0) + (pendingClaims ?? 0) + (flaggedReviews ?? 0);
  const toolList = tools ?? [];
  const totalVotes = toolList.reduce((sum, t: any) => sum + t.upvotes + t.downvotes, 0);

  const topByVotes = [...toolList]
    .map((t: any) => ({ ...t, net: t.upvotes - t.downvotes }))
    .sort((a, b) => b.net - a.net)
    .slice(0, 10);
  const maxVotes = topByVotes[0]?.net ?? 0;

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Overview</h1>
      <p className="text-sm text-ink/55 mt-1.5">
        {needsAttention > 0
          ? `${needsAttention} item${needsAttention === 1 ? "" : "s"} waiting on your review.`
          : "Everything's caught up — nothing waiting on review right now."}{" "}
        Live numbers pulled directly from your database — no third-party analytics account required.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <StatCard label="Pending submissions" value={pendingSubmissions ?? 0} href="/admin/submissions" urgent />
        <StatCard label="Pending claims" value={pendingClaims ?? 0} href="/admin/claims" urgent />
        <StatCard label="Flagged reviews" value={flaggedReviews ?? 0} href="/admin/reviews" urgent />
        <StatCard label="Draft posts" value={draftPosts ?? 0} href="/admin/blog" />
        <StatCard label="Active tools" value={activeTools ?? 0} href="/admin/tools" sub={`${totalTools ?? 0} total`} />
        <StatCard label="Published posts" value={(totalPosts ?? 0) - (draftPosts ?? 0)} href="/admin/blog" />
        <StatCard label="Registered users" value={totalUsers ?? 0} href="/admin/users" sub={`+${newUsers7d ?? 0} in last 7d`} />
        <StatCard
          label="Page views (30d)"
          value={views30d ?? 0}
          href="/admin/analytics"
          sub={`${views7d ?? 0} in last 7d · ${viewsTotal ?? 0} all-time · full breakdown →`}
        />
        <StatCard label="Published reviews" value={reviewCount ?? 0} />
        <StatCard label="Total votes cast" value={totalVotes} />
        <StatCard label="Saved tools" value={savedCount ?? 0} />
        <StatCard label="Custom lists" value={listCount ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg">Latest submissions</h2>
            <Link href="/admin/submissions" className="text-sm text-plum hover:underline">Review all →</Link>
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
            {(recentSubmissions ?? []).length === 0 && <p className="text-sm text-ink/50">No pending submissions.</p>}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg">Latest ownership claims</h2>
            <Link href="/admin/claims" className="text-sm text-plum hover:underline">Review all →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {(recentClaims ?? []).map((c: any, i: number) => (
              <div key={i} className="bg-surface border border-line rounded-lg px-4 py-3 text-sm">
                <span className="font-medium">{c.tools?.name ?? "Unknown tool"}</span>
                <span className="text-ink/40 ml-2">{c.business_email}</span>
              </div>
            ))}
            {(recentClaims ?? []).length === 0 && <p className="text-sm text-ink/50">No pending claims.</p>}
          </div>
        </section>
      </div>

      <div className="mt-10">
        <h2 className="font-display font-bold text-lg mb-4">Top tools by net votes</h2>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
          {topByVotes.map((t: any) => (
            <Bar key={t.id} label={t.name} value={t.net} max={maxVotes} href={`/tool/${t.slug}`} />
          ))}
          {topByVotes.length === 0 && <p className="text-sm text-ink/50">No votes yet.</p>}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-lg p-5 mt-10 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-base">Want the full traffic picture?</h2>
          <p className="text-xs text-ink/50 mt-1">
            Traffic sources, exact referring URLs, devices, browsers, countries, and UTM campaigns all live on the Analytics page now.
          </p>
        </div>
        <Link href="/admin/analytics" className="text-sm font-medium px-4 py-2.5 rounded-md bg-plum text-white hover:bg-plum-deep transition-colors shrink-0">
          Open Analytics →
        </Link>
      </div>

      <div className="mt-10 pt-6 border-t border-line">
        <h2 className="font-display font-bold text-lg mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/tools/new" className="text-sm border border-line rounded-md px-3.5 py-2 hover:border-plum transition-colors">+ Add a tool</Link>
          <Link href="/admin/users/new" className="text-sm border border-line rounded-md px-3.5 py-2 hover:border-plum transition-colors">+ Add a user</Link>
          <Link href="/admin/blog/new" className="text-sm border border-line rounded-md px-3.5 py-2 hover:border-plum transition-colors">+ Write a blog post</Link>
          <Link href="/admin/tools/export" className="text-sm border border-line rounded-md px-3.5 py-2 hover:border-plum transition-colors">Export tool list</Link>
          <Link href="/admin/seo" className="text-sm border border-line rounded-md px-3.5 py-2 hover:border-plum transition-colors">SEO settings</Link>
        </div>
      </div>
    </main>
  );
}
