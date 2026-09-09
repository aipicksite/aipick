"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export async function submitTool(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/submit");

  const name = String(formData.get("name") ?? "").trim();
  const website_url = String(formData.get("website_url") ?? "").trim();
  const plan_key = String(formData.get("plan_key") ?? "").trim();
  const payment_id = String(formData.get("payment_id") ?? "").trim();

  if (!name || !website_url) {
    redirect("/submit?error=" + encodeURIComponent("Name and website are required."));
  }
  if (!plan_key || !payment_id) {
    redirect("/submit?error=" + encodeURIComponent("Payment step is missing — please start over."));
  }

  // Verify the payment is real, completed, and not already used for a previous
  // submission — this UPDATE...RETURNING is the atomic "consume" step: it only
  // succeeds once per payment_id, so the same paid order can't be replayed
  // (e.g. via browser back/resubmit) to create additional free submissions.
  // Uses the service-role client because a brand-new payments row may not yet
  // be visible under the caller's own RLS session in every edge case.
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
      "/submit?error=" +
        encodeURIComponent("We couldn't verify your payment (or it was already used). Please try again.")
    );
  }

  const { error } = await supabase.from("tool_submissions").insert({
    submitted_by: user.id,
    name,
    website_url,
    short_description: String(formData.get("short_description") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    pricing_type: String(formData.get("pricing_type") ?? "") || null,
    pricing_summary: String(formData.get("pricing_summary") ?? "").trim() || null,
    category_names: String(formData.get("category_names") ?? "").trim() || null,
    highlights: String(formData.get("highlights") ?? "").trim() || null,
    plan_key,
    payment_id,
    requested_featured: plan_key === "submit_featured",
  });

  if (error) {
    redirect("/submit?error=" + encodeURIComponent(error.message));
  }

  redirect("/submit?submitted=1");
}
