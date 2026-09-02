"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function submitClaim(toolId: string, toolSlug: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/claim/${toolSlug}`);

  const business_email = String(formData.get("business_email") ?? "").trim();
  if (!business_email) {
    redirect(`/claim/${toolSlug}?error=` + encodeURIComponent("A business email is required."));
  }

  const { error } = await supabase.from("tool_claims").insert({
    tool_id: toolId,
    user_id: user.id,
    business_email,
    role: String(formData.get("role") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
  });

  if (error) {
    const message = error.code === "23505" ? "You've already submitted a claim for this tool." : error.message;
    redirect(`/claim/${toolSlug}?error=` + encodeURIComponent(message));
  }

  redirect(`/claim/${toolSlug}?submitted=1`);
}
