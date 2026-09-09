"use server";

import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

// NOTE: pricing_plans only has a public SELECT policy — there's no update policy
// for the logged-in-user session, so writes must go through the service-role
// client or they silently affect 0 rows. requireAdmin() still does the actual
// permission check before either of these run.

export async function updatePricingPlan(formData: FormData) {
  await requireAdmin();
  const service = createServiceClient();

  const key = String(formData.get("key") ?? "");
  const amountDollars = parseFloat(String(formData.get("amount") ?? "0"));
  const freeUntilRaw = String(formData.get("free_until") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!key || Number.isNaN(amountDollars)) return;

  await service
    .from("pricing_plans")
    .update({
      amount_cents: Math.round(amountDollars * 100),
      free_until: freeUntilRaw ? new Date(freeUntilRaw).toISOString() : null,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  revalidatePath("/admin/pricing");
  revalidatePath("/submit");
  revalidatePath("/update-ai");
}

export async function clearFreePromo(key: string) {
  await requireAdmin();
  const service = createServiceClient();
  await service.from("pricing_plans").update({ free_until: null }).eq("key", key);
  revalidatePath("/admin/pricing");
  revalidatePath("/submit");
  revalidatePath("/update-ai");
}
