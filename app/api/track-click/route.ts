import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Records one row per click on an outbound "visit the tool's website" /
// "verify on official pricing page" link — powers the admin analytics
// "Where visitors go" section. Called from components/OutboundLink.tsx
// via sendBeacon right as the link is clicked, before the browser
// navigates (or opens the new tab, since these links use target=_blank).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetUrl: unknown = body?.targetUrl;
    const sourcePath: unknown = body?.sourcePath;
    const visitorId: unknown = body?.visitorId;

    if (typeof targetUrl !== "string" || !targetUrl) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    let targetHost: string;
    try {
      targetHost = new URL(targetUrl).hostname.toLowerCase();
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const admin = createAdminClient();
    await admin.from("outbound_clicks").insert({
      target_host: targetHost,
      target_url: targetUrl,
      source_path: typeof sourcePath === "string" && sourcePath ? sourcePath : null,
      visitor_id: typeof visitorId === "string" && visitorId ? visitorId : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
