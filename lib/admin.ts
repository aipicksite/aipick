import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Checks the logged-in user's email against admin_users.
// Redirects to /login if not signed in, or /admin/denied if not an admin.
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (!adminRow) redirect("/admin/denied");

  return { supabase, user };
}
