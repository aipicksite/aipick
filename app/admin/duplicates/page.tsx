import SubmitButton from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { mergeDuplicateTools, dismissDuplicatePair } from "@/app/admin/duplicates/actions";
import Link from "next/link";

type Pair = {
  id_a: string;
  name_a: string;
  slug_a: string;
  id_b: string;
  name_b: string;
  slug_b: string;
  similarity_score: number;
};

type ToolStats = {
  id: string;
  upvotes: number;
  downvotes: number;
  rating_count: number;
  created_at: string;
};

export default async function AdminDuplicatesPage() {
  const { supabase } = await requireAdmin();

  const { data: pairsRaw, error } = await supabase.rpc("find_duplicate_tool_pairs", {
    threshold: 0.45,
  });
  const pairs = (pairsRaw as Pair[] | null) ?? [];

  // duplicate_dismissals has no public RLS policy — needs the service client.
  const admin = createServiceClient();
  const { data: dismissed } = await admin.from("duplicate_dismissals").select("tool_id_a, tool_id_b");
  const dismissedKeys = new Set(
    ((dismissed as { tool_id_a: string; tool_id_b: string }[] | null) ?? []).map(
      (d) => `${d.tool_id_a}:${d.tool_id_b}`
    )
  );
  const visiblePairs = pairs.filter((p) => !dismissedKeys.has(`${p.id_a}:${p.id_b}`));

  const allIds = Array.from(
    new Set(visiblePairs.flatMap((p) => [p.id_a, p.id_b]))
  );
  const { data: statsRows } = allIds.length
    ? await supabase
        .from("tools")
        .select("id, upvotes, downvotes, rating_count, created_at")
        .in("id", allIds)
    : { data: [] as ToolStats[] };
  const statsById = new Map(((statsRows as ToolStats[] | null) ?? []).map((s) => [s.id, s]));

  function statLine(id: string) {
    const s = statsById.get(id);
    if (!s) return null;
    return `${s.upvotes - s.downvotes} net votes · ${s.rating_count} reviews · added ${new Date(s.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  }

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Duplicates</h1>
      <p className="text-sm text-ink/55 mt-1 max-w-2xl">
        Fuzzy name-matching (Postgres trigram similarity) across all tools — run this page any time
        after adding new tools, or as a monthly check. A high score means two listings are probably
        the same product under slightly different names (e.g. &quot;Claude&quot; and &quot;Anthropic
        Claude&quot;). Not every match is a real duplicate — e.g. &quot;Krisp&quot; and
        &quot;KrispCall&quot; are different products from the same company; use &quot;Not a
        duplicate&quot; for those so they stop showing up here.
      </p>
      {error && (
        <p className="text-sm text-coral mt-3">
          Couldn&apos;t run the duplicate check — has sql/duplicate-detection.sql been run in
          Supabase yet? ({error.message})
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {visiblePairs.map((p) => (
          <div key={`${p.id_a}:${p.id_b}`} className="bg-surface border border-line rounded-lg p-4">
            <div className="flex items-center justify-between text-xs text-ink/45 mb-2">
              <span>Similarity: {Math.round(p.similarity_score * 100)}%</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { id: p.id_a, name: p.name_a, slug: p.slug_a, otherId: p.id_b },
                { id: p.id_b, name: p.name_b, slug: p.slug_b, otherId: p.id_a },
              ].map((t) => (
                <div key={t.id} className="border border-line rounded-md p-3">
                  <Link href={`/tool/${t.slug}`} target="_blank" className="font-medium text-sm hover:text-plum">
                    {t.name} ↗
                  </Link>
                  <p className="text-xs text-ink/45 mt-1">{statLine(t.id)}</p>
                  <form action={mergeDuplicateTools.bind(null, t.id, t.otherId)} className="mt-2">
                    <SubmitButton pendingText="Merging…" className="text-xs font-medium text-plum hover:underline">
                      Keep this one, merge the other in
                    </SubmitButton>
                  </form>
                </div>
              ))}
            </div>
            <form action={dismissDuplicatePair.bind(null, p.id_a, p.id_b)} className="mt-3">
              <SubmitButton pendingText="…" className="text-xs text-ink/45 hover:text-ink hover:underline">
                Not a duplicate — dismiss
              </SubmitButton>
            </form>
          </div>
        ))}
        {visiblePairs.length === 0 && !error && (
          <p className="text-sm text-ink/55 py-8">No duplicate candidates found right now.</p>
        )}
      </div>
    </main>
  );
}
