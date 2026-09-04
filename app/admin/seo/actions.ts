"use server";

import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

const KEYS = [
  "site_title",
  "site_description",
  "og_image_url",
  "google_analytics_id",
  "google_site_verification",
] as const;

export async function updateSiteSettings(formData: FormData) {
  const { supabase } = await requireAdmin();

  const rows = KEYS.map((key) => ({
    key,
    value: String(formData.get(key) ?? "").trim(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/seo");
  revalidatePath("/");
}
