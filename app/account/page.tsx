import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateUsername } from "./actions";
import type { Profile } from "@/types/database";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const p = profile as Profile | null;

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Account</span>
      <h1 className="font-display font-bold text-2xl mt-1">Your account</h1>

      <div className="mt-8 bg-surface border border-line rounded-lg p-6">
        <p className="text-sm text-ink/50">Signed in as</p>
        <p className="font-medium mt-0.5">{user.email}</p>

        <form action={updateUsername} className="mt-6 space-y-2">
          <label className="text-sm font-medium block">Username</label>
          <input
            name="username"
            defaultValue={p?.username ?? ""}
            placeholder="username"
            minLength={3}
            className="w-full bg-base border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
          <p className="text-xs text-ink/45">
            Shown on your reviews. Lowercase letters, numbers, and underscores only.
          </p>
          {searchParams.error && (
            <p className="text-sm text-coral">{searchParams.error}</p>
          )}
          {searchParams.saved && (
            <p className="text-sm text-forest">Saved.</p>
          )}
          <button
            type="submit"
            className="bg-plum text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-plum-deep transition-colors"
          >
            Save
          </button>
        </form>
      </div>

      <form action="/auth/signout" method="post" className="mt-4">
        <button
          type="submit"
          className="text-sm text-ink/50 hover:text-coral transition-colors"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
