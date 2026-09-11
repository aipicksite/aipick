"use server";

import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

const KEYS = [
  "site_title",
  "site_description",
  "og_image_url",
  "google_analytics_id",
  "google_site_verification",
  "floating_widget_position",
] as const;

export async function updateSiteSettings(formData: FormData) {
  const { supabase } = await requireAdmin();

  const rows: { key: string; value: string; updated_at: string }[] = KEYS.map((key) => ({
    key,
    value: String(formData.get(key) ?? "").trim(),
    updated_at: new Date().toISOString(),
  }));

  // Checkbox: absent from formData entirely when unchecked, so it can't
  // go through the generic KEYS.map above (that would wrongly leave the
  // previously-saved value untouched instead of turning it off).
  rows.push({
    key: "floating_widget_enabled",
    value: formData.get("floating_widget_enabled") === "on" ? "true" : "false",
    updated_at: new Date().toISOString(),
  });

  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/seo");
  revalidatePath("/");
}
