import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-line rounded-lg p-4">
      <p className="text-xs font-medium text-ink/45 uppercase tracking-wide">{label}</p>
      <p className="font-display font-bold text-2xl mt-1">{value}</p>
      {sub && <p className="text-xs text-ink/45 mt-1">{sub}</p>}
    </div>
  );
}

function Bar({ label, value, max, href }: { label: string; value: number; max: number; suffix?: string; href?: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  const inner = (
    <>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="truncate max-w-[70%]">{label}</span>
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

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdmin();

  const [
    { count: toolCount },
    { count: userCount },
    { count: reviewCount },
    { count: savedCount },
    { count: listCount },
    { count: pendingSubmissions },
    { count: viewsTotal },
    { count: views7d },
    { count: views30d },
    { data: tools },
  ] = await Promise.all([
    supabase.from("tools").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("saved_tools").select("*", { count: "exact", head: true }),
    supabase.from("custom_lists").select("*", { count: "exact", head: true }),
    supabase.from("tool_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("page_views").select("*", { count: "exact", head: true }),
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    supabase.from("tools").select("id, name, slug, upvotes, downvotes, rating_avg, rating_count"),
  ]);

  const toolList = tools ?? [];
  const totalVotes = toolList.reduce((sum, t: any) => sum + t.upvotes + t.downvotes, 0);

  const topByVotes = [...toolList]
    .map((t: any) => ({ ...t, net: t.upvotes - t.downvotes }))
    .sort((a, b) => b.net - a.net)
    .slice(0, 10);
  const maxVotes = topByVotes[0]?.net ?? 0;

  // Views per tool (aggregated in JS — dataset is small enough for this to be cheap).
  const { data: toolViewRows } = await supabase
    .from("page_views")
    .select("tool_id")
    .not("tool_id", "is", null)
    .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

  const viewCounts = new Map<string, number>();
  for (const row of (toolViewRows ?? []) as { tool_id: string }[]) {
    viewCounts.set(row.tool_id, (viewCounts.get(row.tool_id) ?? 0) + 1);
  }
  const topByViews = toolList
    .map((t: any) => ({ ...t, views: viewCounts.get(t.id) ?? 0 }))
    .filter((t) => t.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  const maxViews = topByViews[0]?.views ?? 0;

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Analytics</h1>
      <p className="text-sm text-ink/55 mt-1.5">
        Live numbers pulled directly from your database — no third-party
        analytics account required. Page views start counting from the day
        this migration was run.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <StatCard label="Tools listed" value={toolCount ?? 0} />
        <StatCard label="Registered users" value={userCount ?? 0} />
        <StatCard label="Published reviews" value={reviewCount ?? 0} />
        <StatCard label="Total votes cast" value={totalVotes} />
        <StatCard label="Saved tools" value={savedCount ?? 0} />
        <StatCard label="Custom lists" value={listCount ?? 0} />
        <StatCard
          label="Pending submissions"
          value={pendingSubmissions ?? 0}
          sub={pendingSubmissions ? "needs review" : undefined}
        />
        <StatCard label="Page views (30d)" value={views30d ?? 0} sub={`${views7d ?? 0} in last 7d · ${viewsTotal ?? 0} all-time`} />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <section>
          <h2 className="font-display font-bold text-lg mb-4">Top tools by net votes</h2>
          <div className="flex flex-col gap-3">
            {topByVotes.map((t: any) => (
              <Bar key={t.id} label={t.name} value={t.net} max={maxVotes} href={`/tool/${t.slug}`} />
            ))}
            {topByVotes.length === 0 && <p className="text-sm text-ink/50">No votes yet.</p>}
          </div>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg mb-4">Most-viewed tools (30d)</h2>
          <div className="flex flex-col gap-3">
            {topByViews.map((t: any) => (
              <Bar key={t.id} label={t.name} value={t.views} max={maxViews} href={`/tool/${t.slug}`} />
            ))}
            {topByViews.length === 0 && (
              <p className="text-sm text-ink/50">
                No page-view data yet — this fills in once visitors start
                hitting tool pages after the analytics migration is run.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
