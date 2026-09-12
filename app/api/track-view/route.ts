import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseUserAgent } from "@/lib/ua-parse";

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
    const visitorId: unknown = body?.visitorId;
    const utmSource: unknown = body?.utmSource;
    const utmMedium: unknown = body?.utmMedium;
    const utmCampaign: unknown = body?.utmCampaign;

    if (typeof path !== "string" || !path) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ua = req.headers.get("user-agent");
    const { device, browser, os } = parseUserAgent(ua);

    // Vercel sets these on every request (Edge and Node runtimes alike) —
    // no separate geo-IP lookup needed. Falls back to null off-Vercel
    // (e.g. local dev), which the analytics page treats as "Unknown".
    const country = req.headers.get("x-vercel-ip-country");

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
      visitor_id: typeof visitorId === "string" && visitorId ? visitorId : null,
      utm_source: typeof utmSource === "string" && utmSource ? utmSource : null,
      utm_medium: typeof utmMedium === "string" && utmMedium ? utmMedium : null,
      utm_campaign: typeof utmCampaign === "string" && utmCampaign ? utmCampaign : null,
      device,
      browser,
      os,
      country: country || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Analytics logging must never surface an error to the visitor.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
