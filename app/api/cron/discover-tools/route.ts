import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDiscoverySettings } from "@/lib/settings";
import { runDiscovery } from "@/lib/ai-discovery";

export const maxDuration = 60; // grounded LLM calls can take a while

export async function GET(request: Request) {
  // Vercel Cron automatically sends this header when CRON_SECRET is set as
  // an env var — this rejects anyone else who finds the URL.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getDiscoverySettings();
  if (settings.discovery_enabled !== "true") {
    return NextResponse.json({ skipped: true, reason: "Auto-discovery is turned off in Admin → Discovery." });
  }

  const admin = createAdminClient();

  try {
    const result = await runDiscovery(admin, settings);
    await admin.from("site_settings").upsert(
      [
        { key: "discovery_last_run_at", value: new Date().toISOString() },
        { key: "discovery_last_run_summary", value: result.summary },
        { key: "discovery_last_raw_output", value: result.rawModelOutput ?? "" },
      ],
      { onConflict: "key" }
    );
    return NextResponse.json(result);
  } catch (e) {
    const message = (e as Error).message;
    await admin.from("site_settings").upsert(
      [
        { key: "discovery_last_run_at", value: new Date().toISOString() },
        { key: "discovery_last_run_summary", value: `Run failed: ${message}` },
      ],
      { onConflict: "key" }
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
