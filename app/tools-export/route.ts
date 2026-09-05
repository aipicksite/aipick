import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Public, read-only export of every tool's name + slug (the same info already
// visible on /tools) — used so Bilal can paste this URL for external deduping
// checks instead of manually copying a list. No auth required since nothing
// here is more sensitive than the public directory itself; excluded from
// search indexing via the X-Robots-Tag header below. Deliberately placed
// outside /api/ (which robots.txt disallows for all crawlers) so external
// fetchers that respect robots.txt can still read it.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();

  const { data: tools, error } = await supabase
    .from("tools")
    .select("name, slug, status, created_at")
    .order("slug", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const toolList = tools ?? [];

  return NextResponse.json(
    {
      generated_at: new Date().toISOString(),
      total: toolList.length,
      tools: toolList.map((t) => ({ name: t.name, slug: t.slug, status: t.status })),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    }
  );
}
