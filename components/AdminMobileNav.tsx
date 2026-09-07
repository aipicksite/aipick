"use client";

import { useRouter, usePathname } from "next/navigation";

export default function AdminMobileNav({
  groups,
}: {
  groups: { label: string; links: { href: string; label: string }[] }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="sm:hidden mb-6">
      <label className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-1.5 block">
        Admin section
      </label>
      <select
        value={pathname}
        onChange={(e) => router.push(e.target.value)}
        className="w-full border border-line rounded-md px-3 py-2.5 text-sm bg-surface font-medium"
      >
        {groups.map((group) =>
          group.links.map((l) => (
            <option key={l.href} value={l.href}>
              {group.label ? `${group.label} — ${l.label}` : l.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
