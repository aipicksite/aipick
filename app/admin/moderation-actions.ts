"use server";

import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function addAdmin(formData: FormData) {
  const { supabase } = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  await supabase.from("admin_users").insert({ email });
  revalidatePath("/admin/admins");
}

export async function removeAdmin(adminRowId: string) {
  const { supabase, user } = await requireAdmin();

  // Safety: don't let an admin remove themselves and lock everyone out
  // of a possibly-empty admin list by accident.
  const { data: row } = await supabase
    .from("admin_users")
    .select("email")
    .eq("id", adminRowId)
    .single();

  if (row?.email === user.email) return;

  await supabase.from("admin_users").delete().eq("id", adminRowId);
  revalidatePath("/admin/admins");
}

export async function setReviewStatus(
  reviewId: string,
  status: "published" | "flagged" | "removed"
) {
  const { supabase } = await requireAdmin();
  await supabase.from("reviews").update({ status }).eq("id", reviewId);
  revalidatePath("/admin/reviews");
}
