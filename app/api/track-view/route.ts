import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Records one page view per real browser visit. Called from
// components/PageViewTracker.tsx (a client component), NOT from the
// page's server component — pages using ISR/revalidate only re-run
// their server component once per cache window, not once per visitor,
// so a server-side tracker call was silently missing almost every real
// visit (and, in turn, every real referrer). A client-side beacon fires
// on every actual page load regardless of server caching.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const path: unknown = body?.path;
    const toolId: unknown = body?.toolId;
    const referrer: unknown = body?.referrer;

    if (typeof path !== "string" || !path) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Uses the service-role client so the insert never depends on
    // page_views' RLS policy for the (usually anonymous) visitor —
    // this codebase has hit silent RLS no-ops on writes more than
    // once before, and analytics data is exactly the kind of gap
    // that goes unnoticed for a long time.
    const admin = createAdminClient();
    await admin.from("page_views").insert({
      path,
      tool_id: typeof toolId === "string" && toolId ? toolId : null,
      referrer: typeof referrer === "string" && referrer ? referrer : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Analytics logging must never surface an error to the visitor.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
