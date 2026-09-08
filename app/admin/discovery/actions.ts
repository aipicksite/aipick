"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDiscoverySettings } from "@/lib/settings";
import { runDiscovery } from "@/lib/ai-discovery";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveDiscoverySettings(formData: FormData) {
  const { supabase } = await requireAdmin();

  const rows = [
    { key: "discovery_provider", value: String(formData.get("discovery_provider") ?? "gemini") },
    { key: "discovery_model", value: String(formData.get("discovery_model") ?? "").trim() },
    { key: "discovery_batch_size", value: String(formData.get("discovery_batch_size") ?? "10").trim() },
    { key: "discovery_focus", value: String(formData.get("discovery_focus") ?? "").trim() },
    { key: "discovery_enabled", value: formData.get("discovery_enabled") === "on" ? "true" : "false" },
  ];

  await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  revalidatePath("/admin/discovery");
}

async function recordRun(admin: ReturnType<typeof createAdminClient>, summary: string, rawOutput?: string) {
  await admin.from("site_settings").upsert(
    [
      { key: "discovery_last_run_at", value: new Date().toISOString() },
      { key: "discovery_last_run_summary", value: summary },
      { key: "discovery_last_raw_output", value: rawOutput ?? "" },
    ],
    { onConflict: "key" }
  );
}

export async function runDiscoveryNow() {
  await requireAdmin();
  const admin = createAdminClient();
  const settings = await getDiscoverySettings();

  try {
    const result = await runDiscovery(admin, settings);
    await recordRun(admin, result.summary, result.rawModelOutput);
  } catch (e) {
    await recordRun(admin, `Run failed: ${(e as Error).message}`);
  }

  revalidatePath("/admin/discovery");
  revalidatePath("/admin/submissions");
  redirect("/admin/discovery");
}
