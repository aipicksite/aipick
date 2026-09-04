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

function readFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const publishedAtLocal = String(formData.get("published_at") ?? "").trim();

  return {
    title,
    slug: slugInput || toSlug(title),
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    cover_image_url: String(formData.get("cover_image_url") ?? "").trim() || null,
    body: String(formData.get("body") ?? ""),
    meta_title: String(formData.get("meta_title") ?? "").trim() || null,
    meta_description: String(formData.get("meta_description") ?? "").trim() || null,
    published_at: publishedAtLocal ? new Date(publishedAtLocal).toISOString() : null,
  };
}

export async function createBlogPost(formData: FormData) {
  const { supabase } = await requireAdmin();
  const fields = readFields(formData);

  const { error } = await supabase.from("blog_posts").insert(fields);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function updateBlogPost(postId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const fields = readFields(formData);

  const { error } = await supabase
    .from("blog_posts")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${fields.slug}`);
  redirect("/admin/blog");
}

export async function deleteBlogPost(postId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("blog_posts").delete().eq("id", postId);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
