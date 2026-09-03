import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { updateOwnedTool } from "./actions";
import type { Tool } from "@/types/database";
import Link from "next/link";

type Props = {
  params: { slug: string };
  searchParams: { saved?: string };
};

export default async function OwnerDashboardPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/dashboard/tools/${params.slug}`);

  const { data: tool } = await supabase
    .from("tools")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!tool) notFound();
  const t = tool as Tool;

  if (t.owner_id !== user.id) {
    redirect(`/tool/${t.slug}`);
  }

  const boundUpdate = updateOwnedTool.bind(null, t.id, t.slug);

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <Link href={`/tool/${t.slug}`} className="text-sm text-plum hover:underline">← {t.name}</Link>
      <div className="flex items-center gap-2 mt-4">
        <h1 className="font-display font-bold text-2xl">Manage listing</h1>
        <span className="text-xs font-medium text-forest bg-forest-soft px-2 py-0.5 rounded-full">
          ✓ Verified owner
        </span>
      </div>
      <p className="text-ink/60 mt-2 text-sm">
        You can edit the description, pricing and logo. Name and category
        changes go through support.
      </p>

      {searchParams.saved && (
        <div className="mt-6 bg-forest-soft border border-forest/20 text-forest rounded-lg p-4 text-sm">
          Saved.
        </div>
      )}

      <form action={boundUpdate} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Short description</label>
          <input
            name="short_description"
            defaultValue={t.short_description ?? ""}
            maxLength={140}
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Full description</label>
          <textarea
            name="description"
            rows={5}
            defaultValue={t.description ?? ""}
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">
            Highlights / key features (one per line)
          </label>
          <textarea
            name="highlights"
            rows={4}
            defaultValue={t.highlights?.join("\n") ?? ""}
            placeholder={"Real-time collaboration\nExports to Figma\nFree tier includes 3 projects"}
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
          <p className="text-xs text-ink/45 mt-1">Shown as bullet points on ranking pages.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Pricing type</label>
            <select
              name="pricing_type"
              defaultValue={t.pricing_type ?? "freemium"}
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
            >
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Pricing summary</label>
            <input
              name="pricing_summary"
              defaultValue={t.pricing_summary ?? ""}
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Logo URL</label>
          <input
            name="logo_url"
            defaultValue={t.logo_url ?? ""}
            placeholder="https://…/logo.png"
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <button
          type="submit"
          className="bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
        >
          Save changes
        </button>
      </form>
    </main>
  );
}
