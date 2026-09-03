"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function submitTool(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/submit");

  const name = String(formData.get("name") ?? "").trim();
  const website_url = String(formData.get("website_url") ?? "").trim();

  if (!name || !website_url) {
    redirect("/submit?error=" + encodeURIComponent("Name and website are required."));
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
  });

  if (error) {
    redirect("/submit?error=" + encodeURIComponent(error.message));
  }

  redirect("/submit?submitted=1");
}
