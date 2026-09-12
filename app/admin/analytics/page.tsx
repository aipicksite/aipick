import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyReferrer } from "@/lib/traffic-source";
import Link from "next/link";

const RANGE_OPTIONS = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
] as const;

const GRANULARITY_OPTIONS = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
] as const;
type Granularity = (typeof GRANULARITY_OPTIONS)[number]["key"];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-line rounded-lg p-4 sm:p-5">
      <p className="text-xs font-medium text-ink/45 uppercase tracking-wide">{label}</p>
      <p className="font-display font-bold text-2xl sm:text-3xl mt-1.5">{value}</p>
      {sub && <p className="text-xs text-ink/45 mt-1">{sub}</p>}
    </div>
  );
}

function RankedList({
  rows,
  emptyText,
}: {
  rows: { label: string; value: number; href?: string; external?: boolean; sub?: string }[];
  emptyText: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-ink/50">{emptyText}</p>;
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r, i) => {
        const pct = Math.max(3, Math.round((r.value / max) * 100));
        const inner = (
          <>
            <div className="flex items-center justify-between text-sm mb-1 gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-ink/35 text-xs w-4 shrink-0 tabular-nums">{i + 1}</span>
                <span className="truncate" title={r.label}>{r.label}</span>
              </span>
              <span className="text-ink/50 font-medium shrink-0 tabular-nums">
                {r.sub ?? r.value}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-ink/5 overflow-hidden ml-6">
              <div className="h-full bg-plum rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </>
        );
        if (!r.href) return <div key={r.label + i}>{inner}</div>;
        return r.external ? (
          <a key={r.label + i} href={r.href} target="_blank" rel="noopener noreferrer nofollow" className="block hover:opacity-80 transition-opacity">
            {inner}
          </a>
        ) : (
          <Link key={r.label + i} href={r.href} className="block hover:opacity-80 transition-opacity">
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

function TrendChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / Math.max(data.length, 1);
  return (
    <div>
      <svg viewBox="0 0 100 36" className="w-full h-40" preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = (d.value / max) * 32;
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.12}
              y={36 - h}
              width={barWidth * 0.76}
              height={h}
              rx={0.6}
              className="fill-plum/70"
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-[11px] text-ink/40 mt-1.5">
        <span>{data[0]?.label}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.label}</span>}
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-line rounded-lg p-5">
      <h2 className="font-display font-bold text-base">{title}</h2>
      {sub && <p className="text-xs text-ink/45 mt-0.5 mb-4">{sub}</p>}
      <div className={sub ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string; gran?: string };
}) {
  await requireAdmin();
  // page_views/outbound_clicks reads go through the service-role client so
  // this never silently returns empty rows if those tables' RLS doesn't
  // cover the logged-in admin — same reasoning as the rest of /admin.
  const admin = createAdminClient();

  const rangeOpt = RANGE_OPTIONS.find((r) => r.key === searchParams.range) ?? RANGE_OPTIONS[1];
  const granularity: Granularity = GRANULARITY_OPTIONS.some((g) => g.key === searchParams.gran)
    ? (searchParams.gran as Granularity)
    : "day";

  const now = Date.now();
  const day = 86400000;
  const rangeStart = new Date(now - rangeOpt.days * day);

  // The trend chart always pulls the last 90 days of raw data regardless
  // of the KPI range above, then buckets it by day/week/month — that's
  // what makes the granularity toggle meaningful (switching to "Month"
  // with only a 7-day range selected would just show one bar).
  const chartWindowDays = 90;
  const chartStart = new Date(now - chartWindowDays * day);

  const [{ count: totalViews }, { data: rangeRows }, { data: chartRows }] = await Promise.all([
    admin.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", rangeStart.toISOString()),
    admin
      .from("page_views")
      .select("path, referrer, visitor_id, country, duration_seconds, created_at")
      .gte("created_at", rangeStart.toISOString()),
    admin.from("page_views").select("created_at").gte("created_at", chartStart.toISOString()),
  ]);

  const { data: outboundRows } = await admin
    .from("outbound_clicks")
    .select("target_host, target_url, created_at")
    .gte("created_at", rangeStart.toISOString());

  type Row = {
    path: string;
    referrer: string | null;
    visitor_id: string | null;
    country: string | null;
    duration_seconds: number | null;
    created_at: string;
  };
  const rows = (rangeRows ?? []) as Row[];

  const uniqueVisitors = new Set(rows.map((r) => r.visitor_id).filter(Boolean)).size;

  const durations = rows.map((r) => r.duration_seconds).filter((d): d is number => typeof d === "number");
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

  // ---- Traffic sources: top 20, flat, real site or Direct ----
  const sourceCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const pathViewCounts = new Map<string, number>();
  const pathDurationSums = new Map<string, { total: number; n: number }>();

  for (const row of rows) {
    const { label } = classifyReferrer(row.referrer, row.path);
    sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1);

    if (row.country) countryCounts.set(row.country, (countryCounts.get(row.country) ?? 0) + 1);

    const cleanPath = row.path.split("?")[0] || row.path;
    pathViewCounts.set(cleanPath, (pathViewCounts.get(cleanPath) ?? 0) + 1);
    if (typeof row.duration_seconds === "number") {
      const cur = pathDurationSums.get(cleanPath) ?? { total: 0, n: 0 };
      cur.total += row.duration_seconds;
      cur.n += 1;
      pathDurationSums.set(cleanPath, cur);
    }
  }

  const topSources = Array.from(sourceCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  const topCountries = Array.from(countryCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  // ---- Where visitors go (outbound clicks) ----
  const destCounts = new Map<string, { host: string; url: string; count: number }>();
  for (const c of (outboundRows ?? []) as { target_host: string; target_url: string }[]) {
    const existing = destCounts.get(c.target_host);
    if (existing) existing.count += 1;
    else destCounts.set(c.target_host, { host: c.target_host, url: c.target_url, count: 1 });
  }
  const topDestinations = Array.from(destCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // ---- Time on page, by top pages (needs a few samples to be meaningful) ----
  const timeOnPage = Array.from(pathDurationSums.entries())
    .filter(([, d]) => d.n >= 3)
    .map(([path, d]) => ({ path, views: pathViewCounts.get(path) ?? d.n, avg: d.total / d.n }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 15);

  // ---- Trend chart: last 90 raw days bucketed by day / week / month ----
  const dailyCounts = new Map<string, number>();
  for (const r of (chartRows ?? []) as { created_at: string }[]) {
    const key = r.created_at.slice(0, 10);
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
  }

  let chartData: { label: string; value: number }[];
  if (granularity === "day") {
    chartData = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now - (29 - i) * day);
      const key = d.toISOString().slice(0, 10);
      return { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: dailyCounts.get(key) ?? 0 };
    });
  } else if (granularity === "week") {
    chartData = Array.from({ length: 12 }, (_, i) => {
      const weekEnd = new Date(now - (11 - i) * 7 * day);
      let total = 0;
      for (let d = 0; d < 7; d++) {
        const key = new Date(weekEnd.getTime() - d * day).toISOString().slice(0, 10);
        total += dailyCounts.get(key) ?? 0;
      }
      return { label: weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: total };
    });
  } else {
    chartData = Array.from({ length: 6 }, (_, i) => {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() - (5 - i));
      const monthKey = monthDate.toISOString().slice(0, 7);
      let total = 0;
      for (const [key, count] of Array.from(dailyCounts.entries())) {
        if (key.slice(0, 7) === monthKey) total += count;
      }
      return { label: monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), value: total };
    });
  }

  return (
    <main>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl">Analytics</h1>
          <p className="text-sm text-ink/55 mt-1.5">Straight from your own database — no third-party account needed.</p>
        </div>
        <div className="flex items-center gap-1 bg-base border border-line rounded-md p-1">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r.key}
              href={`/admin/analytics?range=${r.key}&gran=${granularity}`}
              className={`text-sm px-3 py-1.5 rounded transition-colors ${
                r.key === rangeOpt.key ? "bg-plum text-white" : "text-ink/60 hover:bg-ink/5"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <KpiCard label="Page views" value={totalViews ?? 0} sub={`last ${rangeOpt.days} days`} />
        <KpiCard label="Unique visitors" value={uniqueVisitors} sub={`last ${rangeOpt.days} days`} />
        <KpiCard label="Avg. time on page" value={avgDuration !== null ? formatDuration(avgDuration) : "—"} sub={`${durations.length} samples`} />
        <KpiCard label="Top country" value={topCountries[0]?.label ?? "—"} sub={topCountries[0] ? `${topCountries[0].value} views` : undefined} />
      </div>

      <div className="bg-surface border border-line rounded-lg p-5 mt-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <h2 className="font-display font-bold text-base">Traffic flow</h2>
          <div className="flex items-center gap-1 bg-base border border-line rounded-md p-1">
            {GRANULARITY_OPTIONS.map((g) => (
              <Link
                key={g.key}
                href={`/admin/analytics?range=${rangeOpt.key}&gran=${g.key}`}
                className={`text-sm px-3 py-1 rounded transition-colors ${
                  g.key === granularity ? "bg-plum text-white" : "text-ink/60 hover:bg-ink/5"
                }`}
              >
                {g.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="text-xs text-ink/45 mb-3">
          {granularity === "day" && "Every view, last 30 days, one bar per day."}
          {granularity === "week" && "Every view, last 12 weeks, one bar per week."}
          {granularity === "month" && "Every view, last 6 months, one bar per month."}
        </p>
        <TrendChart data={chartData} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Section title="Top traffic sources" sub={`Top 20 by volume — the exact site people came from, or Direct. Last ${rangeOpt.days} days.`}>
          <RankedList rows={topSources} emptyText="No traffic recorded yet." />
        </Section>

        <Section title="Where visitors go" sub={`The external sites people click through to from AIPick, ranked by clicks. Last ${rangeOpt.days} days.`}>
          <RankedList
            rows={topDestinations.map((d) => ({ label: d.host, value: d.count, href: d.url, external: true }))}
            emptyText="No outbound clicks recorded yet."
          />
        </Section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Section title="Countries" sub={`Based on Vercel's geo headers — only populates for traffic served through Vercel. Last ${rangeOpt.days} days.`}>
          <RankedList rows={topCountries} emptyText="No country data yet." />
        </Section>

        <Section title="Time on page" sub={`Average time spent per page, for pages with at least 3 samples. Last ${rangeOpt.days} days.`}>
          <RankedList
            rows={timeOnPage.map((t) => ({ label: t.path, value: t.views, sub: formatDuration(t.avg), href: t.path }))}
            emptyText="Not enough data yet — this fills in as more visits are recorded."
          />
        </Section>
      </div>

      <p className="text-xs text-ink/40 mt-6">
        Time-on-page and outbound-click tracking are new — older page views won't have that data.
        Country only shows up for traffic served through Vercel (not local/dev traffic).
      </p>
    </main>
  );
}
