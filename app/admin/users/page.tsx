import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  deleteUser,
  suspendUser,
  unsuspendUser,
  banUser,
  unbanUser,
} from "@/app/admin/users/actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import LiveFilterInput from "@/components/LiveFilterInput";
import SubmitButton from "@/components/SubmitButton";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-forest-soft text-forest",
  suspended: "bg-gold/15 text-gold",
  banned: "bg-coral/15 text-coral",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const { supabase, user: me } = await requireAdmin();
  const admin = createAdminClient();

  // Auth is the source of truth for who exists; profiles supplies
  // username + our own status flag. perPage=200 covers a small/medium
  // site in one page — bump this or add real pagination once the user
  // count grows past that.
  const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const { data: profiles } = await supabase.from("profiles").select("id, username, status");

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const query = (searchParams.q ?? "").trim().toLowerCase();
  const rows = (authList?.users ?? [])
    .map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "—",
        username: profile?.username ?? null,
        status: profile?.status ?? "active",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      };
    })
    .filter(
      (u) =>
        !query ||
        u.email.toLowerCase().includes(query) ||
        (u.username ?? "").toLowerCase().includes(query)
    )
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <main>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Users</h1>
          <p className="text-sm text-ink/55 mt-1">{rows.length} account{rows.length === 1 ? "" : "s"}</p>
        </div>
        <Link
          href="/admin/users/new"
          className="bg-plum text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-plum-deep transition-colors"
        >
          + Add user
        </Link>
      </div>

      <div className="mt-5 max-w-sm">
        <LiveFilterInput
          defaultValue={searchParams.q ?? ""}
          placeholder="Search by email or username…"
          className="w-full border border-line rounded-md px-3.5 py-2 text-sm focus:outline-none focus:border-plum"
        />
      </div>

      <div className="mt-6 border border-line rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-surface">
            <tr className="text-left text-ink/45 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last sign-in</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-line align-top">
                <td className="px-4 py-3">
                  {u.email}
                  {u.id === me.id && <span className="text-ink/40 ml-1.5">(you)</span>}
                </td>
                <td className="px-4 py-3 text-ink/70">{u.username ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[u.status]}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/50">
                  {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-ink/50">
                  {u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Never"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 flex-wrap text-xs">
                    <Link href={`/admin/users/${u.id}/edit`} className="text-plum hover:underline">
                      Edit
                    </Link>
                    {u.id !== me.id && (
                      <>
                        {u.status === "suspended" ? (
                          <form action={unsuspendUser.bind(null, u.id)}>
                            <SubmitButton pendingText="…" className="text-forest hover:underline">Unsuspend</SubmitButton>
                          </form>
                        ) : (
                          <form action={suspendUser.bind(null, u.id)}>
                            <SubmitButton pendingText="…" className="text-gold hover:underline">Suspend</SubmitButton>
                          </form>
                        )}
                        {u.status === "banned" ? (
                          <form action={unbanUser.bind(null, u.id)}>
                            <SubmitButton pendingText="…" className="text-forest hover:underline">Unban</SubmitButton>
                          </form>
                        ) : (
                          <form action={banUser.bind(null, u.id)}>
                            <ConfirmSubmitButton
                              confirmMessage={`Ban ${u.email}? They'll be signed out and blocked from logging in.`}
                              className="text-coral hover:underline"
                            >
                              Ban
                            </ConfirmSubmitButton>
                          </form>
                        )}
                        <form action={deleteUser.bind(null, u.id)}>
                          <ConfirmSubmitButton
                            confirmMessage={`Permanently delete ${u.email}? This can't be undone.`}
                            className="text-ink/40 hover:text-coral hover:underline"
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50">
                  No users match that search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
