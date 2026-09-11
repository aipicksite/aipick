"use server";

import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createTool(formData: FormData) {
  const { supabase } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const platforms = String(formData.get("platforms") ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const highlights = String(formData.get("highlights") ?? "")
    .split("\n")
    .map((h) => h.trim())
    .filter(Boolean);

  const use_cases = String(formData.get("use_cases") ?? "")
    .split("\n")
    .map((h) => h.trim())
    .filter(Boolean);

  const audience = String(formData.get("audience") ?? "")
    .split("\n")
    .map((h) => h.trim())
    .filter(Boolean);

  const { data: tool, error } = await supabase
    .from("tools")
    .insert({
      name,
      slug: slugInput || toSlug(name),
      website_url: String(formData.get("website_url") ?? ""),
      short_description: String(formData.get("short_description") ?? ""),
      description: String(formData.get("description") ?? ""),
      pricing_type: String(formData.get("pricing_type") ?? "freemium"),
      pricing_summary: String(formData.get("pricing_summary") ?? ""),
      platforms,
      highlights,
      use_cases,
      audience,
      screenshot_url: String(formData.get("screenshot_url") ?? "").trim() || null,
      status: String(formData.get("status") ?? "active"),
      verification_level: String(formData.get("verification_level") ?? "unverified"),
    })
    .select("id")
    .single();

  if (error || !tool) {
    throw new Error(error?.message ?? "Could not create tool");
  }

  const categoryIds = formData.getAll("category_ids") as string[];
  if (categoryIds.length > 0) {
    await supabase
      .from("tool_categories")
      .insert(categoryIds.map((category_id) => ({ tool_id: tool.id, category_id })));
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateTool(toolId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const platforms = String(formData.get("platforms") ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const highlights = String(formData.get("highlights") ?? "")
    .split("\n")
    .map((h) => h.trim())
    .filter(Boolean);

  const use_cases = String(formData.get("use_cases") ?? "")
    .split("\n")
    .map((h) => h.trim())
    .filter(Boolean);

  const audience = String(formData.get("audience") ?? "")
    .split("\n")
    .map((h) => h.trim())
    .filter(Boolean);

  await supabase
    .from("tools")
    .update({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      website_url: String(formData.get("website_url") ?? ""),
      short_description: String(formData.get("short_description") ?? ""),
      description: String(formData.get("description") ?? ""),
      pricing_type: String(formData.get("pricing_type") ?? "freemium"),
      pricing_summary: String(formData.get("pricing_summary") ?? ""),
      platforms,
      highlights,
      use_cases,
      audience,
      screenshot_url: String(formData.get("screenshot_url") ?? "").trim() || null,
      status: String(formData.get("status") ?? "active"),
      verification_level: String(formData.get("verification_level") ?? "unverified"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", toolId);

  const categoryIds = formData.getAll("category_ids") as string[];
  await supabase.from("tool_categories").delete().eq("tool_id", toolId);
  if (categoryIds.length > 0) {
    await supabase
      .from("tool_categories")
      .insert(categoryIds.map((category_id) => ({ tool_id: toolId, category_id })));
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function deleteTool(toolId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("tools").delete().eq("id", toolId);
  revalidatePath("/admin");
  redirect("/admin");
}

// Joins the tool into the homepage's 15-slot featured queue (see
// lib/featured-queue.ts). Setting featured_requested_at only once — never
// resetting it on a re-click — matters: it's what preserves the tool's fair
// place in line if an admin toggles it by accident.
export async function markFeatured(toolId: string) {
  const { supabase } = await requireAdmin();
  const { data: tool } = await supabase
    .from("tools")
    .select("featured_requested_at")
    .eq("id", toolId)
    .maybeSingle();

  if (!tool?.featured_requested_at) {
    await supabase
      .from("tools")
      .update({ featured_requested_at: new Date().toISOString() })
      .eq("id", toolId);
  }

  revalidatePath("/admin/tools");
  revalidatePath("/");
}

export async function unmarkFeatured(toolId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("tools").update({ featured_requested_at: null }).eq("id", toolId);
  revalidatePath("/admin/tools");
  revalidatePath("/");
}

// Manual changelog entry, for updates that didn't come through an owner's
// paid claim (e.g. admin fixed something, or a real product update the
// admin heard about directly). Written via the service-role client since
// tool_updates has no public/authenticated insert policy — see
// sql/tool-updates.sql.
export async function addToolUpdate(toolId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;

  const service = createServiceClient();
  await service.from("tool_updates").insert({
    tool_id: toolId,
    title,
    description: description || null,
  });

  const { data: tool } = await service.from("tools").select("slug").eq("id", toolId).maybeSingle();
  revalidatePath(`/admin/tools/${toolId}/edit`);
  if (tool?.slug) revalidatePath(`/tool/${tool.slug}`);
}

export async function deleteToolUpdate(toolId: string, updateId: string) {
  await requireAdmin();
  const service = createServiceClient();
  await service.from("tool_updates").delete().eq("id", updateId);
  const { data: tool } = await service.from("tools").select("slug").eq("id", toolId).maybeSingle();
  revalidatePath(`/admin/tools/${toolId}/edit`);
  if (tool?.slug) revalidatePath(`/tool/${tool.slug}`);
}
