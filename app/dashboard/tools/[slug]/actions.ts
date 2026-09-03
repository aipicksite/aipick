"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateOwnedTool(toolId: string, slug: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/dashboard/tools/${slug}`);

  // RLS also enforces this (owner_id = auth.uid()), this is just a fast path.
  const { data: tool } = await supabase
    .from("tools")
    .select("owner_id")
    .eq("id", toolId)
    .single();

  if (!tool || tool.owner_id !== user.id) {
    redirect(`/tool/${slug}`);
  }

  await supabase
    .from("tools")
    .update({
      short_description: String(formData.get("short_description") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      highlights: String(formData.get("highlights") ?? "")
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean),
      screenshot_url: String(formData.get("screenshot_url") ?? "").trim() || null,
      pricing_type: String(formData.get("pricing_type") ?? "freemium"),
      pricing_summary: String(formData.get("pricing_summary") ?? "").trim(),
      logo_url: String(formData.get("logo_url") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", toolId);

  revalidatePath(`/tool/${slug}`);
  revalidatePath(`/dashboard/tools/${slug}`);
  redirect(`/dashboard/tools/${slug}?saved=1`);
}
