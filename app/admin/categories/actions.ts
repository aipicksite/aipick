"use server";

import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function revalidateCategoryPages() {
  revalidatePath("/admin/categories");
  revalidatePath("/category");
  revalidatePath("/");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;

  if (!name) redirect("/admin/categories?error=" + encodeURIComponent("Name is required"));

  const slug = slugInput ? toSlug(slugInput) : toSlug(name);

  const { data: existing } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    redirect("/admin/categories?error=" + encodeURIComponent(`A category with slug "${slug}" already exists`));
  }

  // Same trigram-similarity check moderation-actions.ts already uses when
  // auto-creating categories from tool submissions — surfaces a likely
  // near-duplicate (e.g. "Video Generation" vs "AI Video Generator") as a
  // warning rather than silently letting the taxonomy fork in two.
  const { data: fuzzyMatches } = await supabase.rpc("find_similar_category", { candidate_name: name });
  if (fuzzyMatches?.[0] && formData.get("confirm_duplicate") !== "1") {
    const match = fuzzyMatches[0] as { id: string; name: string };
    redirect(
      "/admin/categories?warn=" +
        encodeURIComponent(`"${match.name}" already exists and looks similar — pass confirm to add "${name}" anyway`)
    );
  }

  const { error } = await supabase.from("categories").insert({ name, slug, icon, description, parent_id: parentId });
  if (error) {
    redirect("/admin/categories?error=" + encodeURIComponent(error.message));
  }

  revalidateCategoryPages();
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createServiceClient();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;

  if (!name) redirect(`/admin/categories/${id}/edit?error=` + encodeURIComponent("Name is required"));
  // A category can't be its own parent, and (one level deep is all this
  // taxonomy supports) can't be parented under one of its own children.
  if (parentId === id) {
    redirect(`/admin/categories/${id}/edit?error=` + encodeURIComponent("A category can't be its own parent"));
  }

  const slug = slugInput ? toSlug(slugInput) : toSlug(name);

  const { error } = await supabase
    .from("categories")
    .update({ name, slug, icon, description, parent_id: parentId })
    .eq("id", id);

  if (error) {
    redirect(`/admin/categories/${id}/edit?error=` + encodeURIComponent(error.message));
  }

  revalidateCategoryPages();
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();

  const [{ count: childCount }, { count: toolCount }] = await Promise.all([
    supabase.from("categories").select("*", { count: "exact", head: true }).eq("parent_id", id),
    supabase.from("tool_categories").select("*", { count: "exact", head: true }).eq("category_id", id),
  ]);

  // Refuse rather than silently orphan subcategories or strip tools of
  // their only category — the admin has to explicitly move things first.
  if ((childCount ?? 0) > 0) {
    redirect(
      "/admin/categories?error=" +
        encodeURIComponent(`Move or delete its ${childCount} subcategories first`)
    );
  }
  if ((toolCount ?? 0) > 0) {
    redirect(
      "/admin/categories?error=" +
        encodeURIComponent(`${toolCount} tool(s) still use this category — remove it from them first`)
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    redirect("/admin/categories?error=" + encodeURIComponent(error.message));
  }

  revalidateCategoryPages();
  redirect("/admin/categories");
}
