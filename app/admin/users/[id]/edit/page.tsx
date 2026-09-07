import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateUser } from "@/app/admin/users/actions";
import UserForm from "@/components/UserForm";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { id: string }; searchParams: { error?: string } };

export default async function EditUserPage({ params, searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const admin = createAdminClient();

  const [{ data: authUser }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(params.id),
    supabase.from("profiles").select("*").eq("id", params.id).maybeSingle(),
  ]);

  if (!authUser?.user) notFound();

  return (
    <main>
      <Link href="/admin/users" className="text-sm text-plum hover:underline">← Users</Link>
      <h1 className="font-display font-bold text-2xl mt-3">Edit user</h1>

      <UserForm
        action={updateUser.bind(null, params.id)}
        submitLabel="Save changes"
        defaultEmail={authUser.user.email ?? ""}
        defaultUsername={profile?.username ?? ""}
        error={searchParams.error}
      />
    </main>
  );
}
