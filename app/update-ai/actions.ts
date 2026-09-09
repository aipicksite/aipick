"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export async function submitToolUpdate(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tool_id = String(formData.get("tool_id") ?? "").trim();
  const tool_slug = String(formData.get("tool_slug") ?? "").trim();
  const business_email = String(formData.get("business_email") ?? "").trim();
  const plan_key = String(formData.get("plan_key") ?? "").trim();
  const payment_id = String(formData.get("payment_id") ?? "").trim();

  // This action is shared by the generic /update-ai flow (pick any tool) and
  // the paid claim-and-update flow that lives on the tool's own page at
  // /claim/[slug] — send the user back to wherever they started from.
  const base = tool_slug ? `/claim/${tool_slug}` : "/update-ai";

  if (!user) redirect(`/login?next=${base}`);

  if (!tool_id || !business_email) {
    redirect(base + "?error=" + encodeURIComponent("Missing required fields."));
  }
  if (!plan_key || !payment_id) {
    redirect(base + "?error=" + encodeURIComponent("Payment step is missing — please start over."));
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
      base +
        "?error=" +
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
    const message =
      error.code === "23505" ? "You already have a pending claim or update for this tool." : error.message;
    redirect(base + "?error=" + encodeURIComponent(message));
  }

  redirect(`${base}?submitted=1`);
}
