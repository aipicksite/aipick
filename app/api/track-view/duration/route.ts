import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Called once per page view, right as the visitor leaves it (see
// components/PageViewTracker.tsx's visibilitychange/pagehide handler),
// with how many seconds they spent on the page. Matched back to the
// original page_views row via view_id — a random id generated client-side
// at page-load time and sent with both the initial view beacon and this
// one, so we never need a lookup by visitor+path+timestamp (which could
// match the wrong row on a fast double-visit).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const viewId: unknown = body?.viewId;
    const durationSeconds: unknown = body?.durationSeconds;

    if (typeof viewId !== "string" || !viewId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Sanity-clamp: a visitor leaving a tab open overnight shouldn't be
    // able to skew "average time on page" to hours. 4 hours is generous
    // headroom for anyone actually reading a long article.
    const clamped = Math.max(0, Math.min(Math.round(durationSeconds), 4 * 60 * 60));

    const admin = createAdminClient();
    await admin.from("page_views").update({ duration_seconds: clamped }).eq("view_id", viewId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
