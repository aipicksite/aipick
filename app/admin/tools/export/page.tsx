import { requireAdmin } from "@/lib/admin";
import CopyLinkButton from "@/components/CopyLinkButton";

export default async function AdminToolsExportPage() {
  const { supabase } = await requireAdmin();

  const { data: tools, count } = await supabase
    .from("tools")
    .select("name, slug", { count: "exact" })
    .order("slug", { ascending: true });

  const toolList = tools ?? [];
  const exportUrl = "https://aipick.site/tools-export";

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Export tool list</h1>
      <p className="text-sm text-ink/55 mt-1.5 max-w-xl">
        Share this link whenever you need an assistant (or any external tool)
        to check the current tool list — for example, to avoid suggesting a
        tool that&apos;s already on the site. It&apos;s a public, read-only page
        listing every tool&apos;s name and slug — the same info already visible
        on <code>/tools</code>, just consolidated into one link.
      </p>

      <div className="flex items-center gap-2 mt-6 max-w-xl">
        <input
          readOnly
          value={exportUrl}
          className="flex-1 border border-line rounded px-3 py-2 text-sm bg-surface font-mono"
        />
        <CopyLinkButton text={exportUrl} />
      </div>

      <div className="mt-8">
        <h2 className="font-display font-bold text-lg mb-1">
          Preview <span className="text-ink/40 font-normal text-base">({count ?? 0} tools)</span>
        </h2>
        <p className="text-xs text-ink/45 mb-3">
          This is what the link above returns right now (as JSON) — shown
          here just to confirm the list looks right.
        </p>
        <div className="bg-surface border border-line rounded-lg p-4 max-h-[400px] overflow-y-auto font-mono text-xs leading-relaxed">
          {toolList.map((t) => (
            <div key={t.slug} className="flex gap-2">
              <span className="text-ink/40">{t.slug}</span>
              <span className="text-ink/25">—</span>
              <span>{t.name}</span>
            </div>
          ))}
          {toolList.length === 0 && <span className="text-ink/45">No tools yet.</span>}
        </div>
      </div>
    </main>
  );
}
