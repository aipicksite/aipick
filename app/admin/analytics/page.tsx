import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyReferrer, CATEGORY_LABELS, type TrafficCategory } from "@/lib/traffic-source";
import Link from "next/link";
import DailySparkline from "@/components/DailySparkline";

const RANGE_OPTIONS = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
] as const;

function KpiCard({
  label,
  value,
  changePct,
  sub,
}: {
  label: string;
  value: string | number;
  changePct?: number | null;
  sub?: string;
}) {
  return (
    <div className="bg-surface border border-line rounded-lg p-4 sm:p-5">
      <p className="text-xs font-medium text-ink/45 uppercase tracking-wide">{label}</p>
      <p className="font-display font-bold text-2xl sm:text-3xl mt-1.5">{value}</p>
      <div className="flex items-center gap-2 mt-1 min-h-[1.1rem]">
        {typeof changePct === "number" && Number.isFinite(changePct) && (
          <span className={`text-xs font-medium ${changePct >= 0 ? "text-emerald-600" : "text-coral"}`}>
            {changePct >= 0 ? "▲" : "▼"} {Math.abs(Math.round(changePct))}% vs prior period
          </span>
        )}
        {sub && <span className="text-xs text-ink/45">{sub}</span>}
      </div>
    </div>
  );
}

function Bar({ label, value, max, href, external }: { label: string; value: number; max: number; href?: string; external?: boolean }) {
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
  if (!href) return <div>{inner}</div>;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="block hover:opacity-80 transition-opacity">
      {inner}
    </a>
  ) : (
    <Link href={href} className="block hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  );
}

function ChartSection({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-bold text-lg mb-1">{title}</h2>
      {sub && <p className="text-xs text-ink/45 mb-4">{sub}</p>}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  await requireAdmin();
  // Same reasoning as Overview: page_views reads go through the
  // service-role client so this never silently returns empty rows if
  // that table's RLS policy doesn't cover the logged-in admin.
  const admin = createAdminClient();

  const rangeOpt = RANGE_OPTIONS.find((r) => r.key === searchParams.range) ?? RANGE_OPTIONS[1];
  const days = rangeOpt.days;
  const now = Date.now();
  const day = 86400000;
  const rangeStart = new Date(now - days * day);
  const prevRangeStart = new Date(now - days * 2 * day);

  const [{ count: currentTotal }, { count: prevTotal }] = await Promise.all([
    admin.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", rangeStart.toISOString()),
    admin
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("created_at", prevRangeStart.toISOString())
      .lt("created_at", rangeStart.toISOString()),
  ]);

  const { data: rows } = await admin
    .from("page_views")
    .select("path, referrer, tool_id, visitor_id, utm_source, utm_medium, utm_campaign, device, browser, os, country, created_at")
    .gte("created_at", rangeStart.toISOString());

  const { data: prevRows } = await admin
    .from("page_views")
    .select("visitor_id")
    .gte("created_at", prevRangeStart.toISOString())
    .lt("created_at", rangeStart.toISOString());

  type Row = {
    path: string;
    referrer: string | null;
    tool_id: string | null;
    visitor_id: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    created_at: string;
  };
  const allRows = (rows ?? []) as Row[];

  const uniqueVisitors = new Set(allRows.map((r) => r.visitor_id).filter(Boolean)).size;
  const prevUniqueVisitors = new Set(((prevRows ?? []) as { visitor_id: string | null }[]).map((r) => r.visitor_id).filter(Boolean)).size;
  const viewsChangePct = prevTotal ? ((currentTotal ?? 0) - prevTotal) / prevTotal * 100 : null;
  const visitorsChangePct = prevUniqueVisitors ? (uniqueVisitors - prevUniqueVisitors) / prevUniqueVisitors * 100 : null;
  const viewsPerVisitor = uniqueVisitors > 0 ? ((currentTotal ?? 0) / uniqueVisitors).toFixed(1) : "—";

  // ---- Traffic sources: category, exact site, AND exact referring URL ----
  const categoryCounts = new Map<TrafficCategory, number>();
  const siteCounts = new Map<string, number>();
  const urlCounts = new Map<string, number>();
  const pathCounts = new Map<string, number>();
  const deviceCounts = new Map<string, number>();
  const browserCounts = new Map<string, number>();
  const osCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const campaignCounts = new Map<string, number>();
  const dailyCounts = new Map<string, number>();

  for (const row of allRows) {
    const { label, category } = classifyReferrer(row.referrer, row.path);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    siteCounts.set(label, (siteCounts.get(label) ?? 0) + 1);

    if (row.referrer && label !== "Direct / None") {
      urlCounts.set(row.referrer, (urlCounts.get(row.referrer) ?? 0) + 1);
    }

    const cleanPath = row.path.split("?")[0] || row.path;
    pathCounts.set(cleanPath, (pathCounts.get(cleanPath) ?? 0) + 1);

    deviceCounts.set(row.device ?? "Unknown", (deviceCounts.get(row.device ?? "Unknown") ?? 0) + 1);
    browserCounts.set(row.browser ?? "Unknown", (browserCounts.get(row.browser ?? "Unknown") ?? 0) + 1);
    osCounts.set(row.os ?? "Unknown", (osCounts.get(row.os ?? "Unknown") ?? 0) + 1);
    countryCounts.set(row.country ?? "Unknown", (countryCounts.get(row.country ?? "Unknown") ?? 0) + 1);

    if (row.utm_campaign) {
      const key = `${row.utm_source ?? "?"} / ${row.utm_medium ?? "?"} / ${row.utm_campaign}`;
      campaignCounts.set(key, (campaignCounts.get(key) ?? 0) + 1);
    }

    const key = row.created_at.slice(0, 10);
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
  }

  const toSorted = (m: Map<string, number>, limit: number) =>
    Array.from(m.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

  const topCategories = Array.from(categoryCounts.entries())
    .map(([category, value]) => ({ label: CATEGORY_LABELS[category], value }))
    .sort((a, b) => b.value - a.value);
  const maxCategory = topCategories[0]?.value ?? 0;

  const topSites = toSorted(siteCounts, 12);
  const maxSite = topSites[0]?.value ?? 0;

  const topUrls = toSorted(urlCounts, 15);
  const maxUrl = topUrls[0]?.value ?? 0;

  const topPages = toSorted(pathCounts, 15);
  const maxPage = topPages[0]?.value ?? 0;

  const topDevices = toSorted(deviceCounts, 5);
  const maxDevice = topDevices[0]?.value ?? 0;

  const topBrowsers = toSorted(browserCounts, 8);
  const maxBrowser = topBrowsers[0]?.value ?? 0;

  const topOs = toSorted(osCounts, 8);
  const maxOs = topOs[0]?.value ?? 0;

  const topCountries = toSorted(countryCounts, 12);
  const maxCountry = topCountries[0]?.value ?? 0;

  const topCampaigns = toSorted(campaignCounts, 10);
  const maxCampaign = topCampaigns[0]?.value ?? 0;

  const topSource = topCategories[0]?.label ?? "—";
  const directShare = (currentTotal ?? 0) > 0
    ? Math.round(((siteCounts.get("Direct / None") ?? 0) / (currentTotal ?? 1)) * 100)
    : 0;

  // ---- Most-viewed tools (moved here from Overview — it's a traffic metric) ----
  const { data: toolViewRows } = await admin
    .from("page_views")
    .select("tool_id")
    .not("tool_id", "is", null)
    .gte("created_at", rangeStart.toISOString());
  const { data: tools } = await admin.from("tools").select("id, name, slug");
  const toolNameById = new Map((tools ?? []).map((t: any) => [t.id, t]));
  const viewCounts = new Map<string, number>();
  for (const row of (toolViewRows ?? []) as { tool_id: string }[]) {
    viewCounts.set(row.tool_id, (viewCounts.get(row.tool_id) ?? 0) + 1);
  }
  const topByViews = Array.from(viewCounts.entries())
    .map(([id, views]) => ({ id, views, tool: toolNameById.get(id) }))
    .filter((t) => t.tool)
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  const maxToolViews = topByViews[0]?.views ?? 0;

  const sparklineData = Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * day);
    const key = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: dailyCounts.get(key) ?? 0,
    };
  });

  return (
    <main>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl">Analytics</h1>
          <p className="text-sm text-ink/55 mt-1.5">
            Every number here comes straight from your own database — no third-party analytics account required.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-surface border border-line rounded-md p-1">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r.key}
              href={`/admin/analytics?range=${r.key}`}
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
        <KpiCard label="Page views" value={currentTotal ?? 0} changePct={viewsChangePct} />
        <KpiCard label="Unique visitors" value={uniqueVisitors} changePct={visitorsChangePct} />
        <KpiCard label="Views per visitor" value={viewsPerVisitor} />
        <KpiCard label="Direct traffic" value={`${directShare}%`} sub="of all views" />
        <KpiCard label="Top traffic source" value={topSource} />
        <KpiCard label="Distinct referring URLs" value={urlCounts.size} sub="real external pages" />
        <KpiCard label="Countries reached" value={countryCounts.size} />
        <KpiCard label="Pages viewed" value={pathCounts.size} sub="distinct paths" />
      </div>

      <div className="bg-surface border border-line rounded-lg p-5 mt-6">
        <h2 className="font-display font-bold text-base mb-1">Page views, last {days} days</h2>
        <p className="text-xs text-ink/45 mb-3">Every recorded view across the whole site, by day.</p>
        <DailySparkline data={sparklineData} />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <ChartSection
          title="Traffic by category"
          sub="Search engines, AI chat assistants (ChatGPT, Perplexity, etc.), social media, referrals, email, and direct."
        >
          {topCategories.map((c) => (
            <Bar key={c.label} label={c.label} value={c.value} max={maxCategory} />
          ))}
          {topCategories.length === 0 && <p className="text-sm text-ink/50">No traffic data yet.</p>}
        </ChartSection>

        <ChartSection title="Traffic by specific site" sub="Same data, grouped by the referring site instead of category.">
          {topSites.map((s) => (
            <Bar key={s.label} label={s.label} value={s.value} max={maxSite} />
          ))}
          {topSites.length === 0 && <p className="text-sm text-ink/50">No traffic data yet.</p>}
        </ChartSection>
      </div>

      <div className="mt-10">
        <ChartSection
          title="Every real referring URL"
          sub="Not grouped by site — the exact page that linked to you (a specific Reddit thread, a specific blog post, etc.). Click through to see it."
        >
          {topUrls.map((u) => (
            <Bar key={u.label} label={u.label} value={u.value} max={maxUrl} href={u.label} external />
          ))}
          {topUrls.length === 0 && (
            <p className="text-sm text-ink/50">No external referrers recorded yet in this range.</p>
          )}
        </ChartSection>
      </div>

      <div className="mt-10">
        <ChartSection
          title="UTM campaigns"
          sub="Traffic tagged with ?utm_source/utm_medium/utm_campaign — useful for tracking specific posts, ads, or newsletter sends. Only populates for links you tag yourself."
        >
          {topCampaigns.map((c) => (
            <Bar key={c.label} label={c.label} value={c.value} max={maxCampaign} />
          ))}
          {topCampaigns.length === 0 && (
            <p className="text-sm text-ink/50">
              No tagged campaign links recorded yet — add ?utm_source=...&amp;utm_medium=...&amp;utm_campaign=... to any link you share to track it here.
            </p>
          )}
        </ChartSection>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-10">
        <ChartSection title="Devices">
          {topDevices.map((d) => (
            <Bar key={d.label} label={d.label} value={d.value} max={maxDevice} />
          ))}
          {topDevices.length === 0 && <p className="text-sm text-ink/50">No data yet.</p>}
        </ChartSection>

        <ChartSection title="Browsers">
          {topBrowsers.map((b) => (
            <Bar key={b.label} label={b.label} value={b.value} max={maxBrowser} />
          ))}
          {topBrowsers.length === 0 && <p className="text-sm text-ink/50">No data yet.</p>}
        </ChartSection>

        <ChartSection title="Operating systems">
          {topOs.map((o) => (
            <Bar key={o.label} label={o.label} value={o.value} max={maxOs} />
          ))}
          {topOs.length === 0 && <p className="text-sm text-ink/50">No data yet.</p>}
        </ChartSection>
      </div>

      <div className="mt-10">
        <ChartSection title="Countries" sub="Based on Vercel's edge geo headers — only populates for traffic served through Vercel.">
          {topCountries.map((c) => (
            <Bar key={c.label} label={c.label} value={c.value} max={maxCountry} />
          ))}
          {topCountries.length === 0 && <p className="text-sm text-ink/50">No data yet.</p>}
        </ChartSection>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <ChartSection title="Top pages" sub="Every page path visited, not just tool pages.">
          {topPages.map((p) => (
            <Bar key={p.label} label={p.label} value={p.value} max={maxPage} href={p.label} />
          ))}
          {topPages.length === 0 && <p className="text-sm text-ink/50">No page-view data yet.</p>}
        </ChartSection>

        <ChartSection title="Most-viewed tools">
          {topByViews.map((t) => (
            <Bar key={t.id} label={t.tool!.name} value={t.views} max={maxToolViews} href={`/tool/${t.tool!.slug}`} />
          ))}
          {topByViews.length === 0 && (
            <p className="text-sm text-ink/50">No page-view data yet — this fills in as visitors hit tool pages.</p>
          )}
        </ChartSection>
      </div>

      <p className="text-xs text-ink/40 mt-10">
        Device, browser, OS, country, and UTM data started recording once this analytics upgrade went live —
        older page views won't have those fields filled in and show up as "Unknown" in those charts.
      </p>
    </main>
  );
}
