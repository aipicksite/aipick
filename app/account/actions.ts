"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateUsername(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const raw = String(formData.get("username") ?? "").trim().toLowerCase();
  const username = raw.replace(/[^a-z0-9_]/g, "");

  if (username.length < 3) {
    redirect("/account?error=" + encodeURIComponent("Username must be at least 3 characters (letters, numbers, underscore)."));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    const message = error.code === "23505" ? "That username is already taken." : error.message;
    redirect("/account?error=" + encodeURIComponent(message));
  }

  revalidatePath("/account");
  redirect("/account?saved=1");
}
