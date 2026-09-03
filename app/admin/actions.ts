"use server";

import { requireAdmin } from "@/lib/admin";
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
      status: String(formData.get("status") ?? "active"),
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
      status: String(formData.get("status") ?? "active"),
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
