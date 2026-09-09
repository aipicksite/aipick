"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export async function submitToolUpdate(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/update-ai");

  const tool_id = String(formData.get("tool_id") ?? "").trim();
  const tool_slug = String(formData.get("tool_slug") ?? "").trim();
  const business_email = String(formData.get("business_email") ?? "").trim();
  const plan_key = String(formData.get("plan_key") ?? "").trim();
  const payment_id = String(formData.get("payment_id") ?? "").trim();

  if (!tool_id || !business_email) {
    redirect("/update-ai?error=" + encodeURIComponent("Missing required fields."));
  }
  if (!plan_key || !payment_id) {
    redirect("/update-ai?error=" + encodeURIComponent("Payment step is missing — please start over."));
  }

  // Atomic "consume" — see app/submit/actions.ts for why this is an UPDATE
  // (not a SELECT) guarded by consumed_at IS NULL: it stops the same paid
  // order from being replayed into multiple update/claim submissions.
  const service = createServiceClient();
  const { data: payment } = await service
    .from("payments")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", payment_id)
    .eq("plan_key", plan_key)
    .eq("status", "completed")
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();

  if (!payment) {
    redirect(
      "/update-ai?error=" +
        encodeURIComponent("We couldn't verify your payment (or it was already used). Please try again.")
    );
  }

  const { error } = await supabase.from("tool_claims").insert({
    tool_id,
    user_id: user.id,
    business_email,
    role: String(formData.get("role") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
    kind: "update",
    plan_key,
    payment_id,
    requested_short_description: String(formData.get("requested_short_description") ?? "").trim() || null,
    requested_description: String(formData.get("requested_description") ?? "").trim() || null,
    requested_pricing_summary: String(formData.get("requested_pricing_summary") ?? "").trim() || null,
    requested_screenshot_url: String(formData.get("requested_screenshot_url") ?? "").trim() || null,
    requested_video_url: String(formData.get("requested_video_url") ?? "").trim() || null,
  });

  if (error) {
    redirect("/update-ai?error=" + encodeURIComponent(error.message));
  }

  redirect(`/update-ai?submitted=1`);
}
