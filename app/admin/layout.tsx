import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  const links = [
    { href: "/admin", label: "Tools" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/admins", label: "Admins" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 flex gap-10">
      <aside className="w-44 shrink-0 hidden sm:block">
        <div className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-3 px-2">
          Admin
        </div>
        <nav className="flex flex-col gap-0.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm px-2.5 py-2 rounded-md hover:bg-ink/5 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          className="block text-sm px-2.5 py-2 mt-4 text-ink/40 hover:text-ink transition-colors"
        >
          ← Back to site
        </Link>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
