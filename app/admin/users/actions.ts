"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 100 years — effectively permanent until explicitly unbanned.
const BAN_DURATION = "876000h";
// ~1 year — long enough to be a real block, but framed as "suspended" (not permanent) in the UI.
const SUSPEND_DURATION = "8760h";

export async function createUser(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim() || null;

  if (!email || password.length < 8) {
    redirect(`/admin/users/new?error=${encodeURIComponent("Email and an 8+ character password are required.")}`);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    redirect(`/admin/users/new?error=${encodeURIComponent(error?.message ?? "Could not create user.")}`);
  }

  await admin.from("profiles").upsert({ id: data.user!.id, username, status: "active" });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUser(userId: string, formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const username = String(formData.get("username") ?? "").trim() || null;
  const newPassword = String(formData.get("password") ?? "");

  const authUpdate: { email?: string; password?: string } = {};
  if (email) authUpdate.email = email;
  if (newPassword) {
    if (newPassword.length < 8) {
      redirect(`/admin/users/${userId}/edit?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
    }
    authUpdate.password = newPassword;
  }

  if (Object.keys(authUpdate).length > 0) {
    const { error } = await admin.auth.admin.updateUserById(userId, authUpdate);
    if (error) {
      redirect(`/admin/users/${userId}/edit?error=${encodeURIComponent(error.message)}`);
    }
  }

  await admin.from("profiles").update({ username }).eq("id", userId);

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUser(userId: string) {
  const { user } = await requireAdmin();
  if (userId === user.id) return; // don't let an admin delete their own account by accident

  const admin = createAdminClient();
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);

  revalidatePath("/admin/users");
}

export async function suspendUser(userId: string) {
  const { user } = await requireAdmin();
  if (userId === user.id) return;

  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, { ban_duration: SUSPEND_DURATION });
  await admin.from("profiles").update({ status: "suspended" }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function unsuspendUser(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  await admin.from("profiles").update({ status: "active" }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function banUser(userId: string) {
  const { user } = await requireAdmin();
  if (userId === user.id) return;

  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, { ban_duration: BAN_DURATION });
  await admin.from("profiles").update({ status: "banned" }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function unbanUser(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  await admin.from("profiles").update({ status: "active" }).eq("id", userId);
  revalidatePath("/admin/users");
}
