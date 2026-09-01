export default function DeniedPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="font-display font-bold text-2xl">Not an admin</h1>
      <p className="text-ink/60 mt-2 text-sm">
        Your account isn&apos;t in the admin list. Add your email to the
        `admin_users` table in Supabase to get access.
      </p>
    </main>
  );
}
