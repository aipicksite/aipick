import { requireAdmin } from "@/lib/admin";
import { addAdmin, removeAdmin } from "@/app/admin/moderation-actions";

export default async function AdminAdminsPage() {
  const { supabase, user } = await requireAdmin();

  const { data: admins } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true });

  const adminList = admins ?? [];

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">Admins</h1>
      <p className="text-sm text-ink/55 mt-1">
        Anyone whose email is listed here can access this admin panel.
      </p>

      <form action={addAdmin} className="mt-6 flex gap-2 max-w-sm">
        <input
          type="email"
          name="email"
          required
          placeholder="teammate@company.com"
          className="flex-1 bg-surface border border-line rounded-md px-3.5 py-2 text-sm focus:outline-none focus:border-plum"
        />
        <button
          type="submit"
          className="bg-plum text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-plum-deep transition-colors shrink-0"
        >
          Add
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 max-w-sm">
        {adminList.map((admin: any) => (
          <div
            key={admin.id}
            className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-2.5"
          >
            <span className="text-sm">
              {admin.email}
              {admin.email === user.email && (
                <span className="text-ink/40 ml-1.5">(you)</span>
              )}
            </span>
            {admin.email !== user.email && (
              <form action={removeAdmin.bind(null, admin.id)}>
                <button type="submit" className="text-xs text-coral hover:underline">
                  Remove
                </button>
              </form>
            )}
          </div>
        ))}
        {adminList.length === 0 && (
          <p className="text-sm text-ink/55 py-6">No admins yet.</p>
        )}
      </div>
    </main>
  );
}
