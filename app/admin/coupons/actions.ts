"use server";

import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

// NOTE: coupons has RLS enabled with NO insert/update/delete policy for the
// logged-in-user session (by design — see migration_payments.sql comments), so
// these actions must use the service-role client. requireAdmin() still does the
// actual permission check before any of these run.

export async function createCoupon(formData: FormData) {
  await requireAdmin();
  const service = createServiceClient();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discount_type = String(formData.get("discount_type") ?? "percent");
  const discount_value = parseFloat(String(formData.get("discount_value") ?? "0"));
  const max_redemptions_raw = String(formData.get("max_redemptions") ?? "").trim();
  const expires_at_raw = String(formData.get("expires_at") ?? "").trim();
  const applies_to_raw = String(formData.get("applies_to") ?? "").trim();

  if (!code || Number.isNaN(discount_value)) return;

  await service.from("coupons").insert({
    code,
    discount_type,
    discount_value,
    max_redemptions: max_redemptions_raw ? parseInt(max_redemptions_raw, 10) : null,
    expires_at: expires_at_raw ? new Date(expires_at_raw).toISOString() : null,
    applies_to: applies_to_raw
      ? applies_to_raw.split(",").map((s) => s.trim()).filter(Boolean)
      : null,
  });

  revalidatePath("/admin/coupons");
}

export async function toggleCoupon(id: string, active: boolean) {
  await requireAdmin();
  const service = createServiceClient();
  await service.from("coupons").update({ active }).eq("id", id);
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  const service = createServiceClient();
  await service.from("coupons").delete().eq("id", id);
  revalidatePath("/admin/coupons");
}
