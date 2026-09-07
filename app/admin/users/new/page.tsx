import { requireAdmin } from "@/lib/admin";
import { createUser } from "@/app/admin/users/actions";
import UserForm from "@/components/UserForm";
import Link from "next/link";

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  await requireAdmin();

  return (
    <main>
      <Link href="/admin/users" className="text-sm text-plum hover:underline">← Users</Link>
      <h1 className="font-display font-bold text-2xl mt-3">Add a user</h1>
      <p className="text-sm text-ink/55 mt-1">
        Creates a real account (email + password) — the person can sign in immediately.
      </p>

      <UserForm
        action={createUser}
        submitLabel="Create user"
        showPasswordRequired
        error={searchParams.error}
      />
    </main>
  );
}
