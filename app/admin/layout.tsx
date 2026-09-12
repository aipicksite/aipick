import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import AdminMobileNav from "@/components/AdminMobileNav";

const NAV_GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  {
    label: "",
    links: [
      { href: "/admin", label: "Overview" },
      { href: "/admin/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/admin/tools", label: "Tools" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/submissions", label: "Submissions" },
      { href: "/admin/claims", label: "Claims" },
      { href: "/admin/reviews", label: "Reviews" },
      { href: "/admin/duplicates", label: "Duplicates" },
      { href: "/admin/blog", label: "Blog" },
    ],
  },
  {
    label: "Payments",
    links: [
      { href: "/admin/pricing", label: "Pricing" },
      { href: "/admin/coupons", label: "Coupons" },
    ],
  },
  {
    label: "Settings",
    links: [
      { href: "/admin/discovery", label: "AI Discovery" },
      { href: "/admin/tools/export", label: "Export" },
      { href: "/admin/seo", label: "SEO" },
      { href: "/admin/admins", label: "Admins" },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 flex gap-10">
      <aside className="w-44 shrink-0 hidden sm:block">
        <div className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-3 px-2">
          Admin
        </div>
        <nav className="flex flex-col gap-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label || "root"}>
              {group.label && (
                <div className="text-[11px] font-medium text-ink/35 uppercase tracking-wide mb-1 px-2.5">
                  {group.label}
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {group.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-sm px-2.5 py-2 rounded-md hover:bg-ink/5 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <Link
          href="/"
          className="block text-sm px-2.5 py-2 mt-6 text-ink/40 hover:text-ink transition-colors"
        >
          ← Back to site
        </Link>
      </aside>
      <div className="flex-1 min-w-0">
        <AdminMobileNav groups={NAV_GROUPS} />
        {children}
      </div>
    </div>
  );
}
