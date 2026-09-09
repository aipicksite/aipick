import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { submitClaim } from "../actions";
import Link from "next/link";
import ToolAvatar from "@/components/ToolAvatar";
import SubmitButton from "@/components/SubmitButton";
import type { Tool } from "@/types/database";

type Props = {
  params: { slug: string };
  searchParams: { error?: string };
};

export default async function FreeClaimPage({ params, searchParams }: Props) {
  const supabase = createClient();

  const { data: tool } = await supabase
    .from("tools")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!tool) notFound();
  const t = tool as Tool;

  if (t.verified && t.owner_id) {
    redirect(`/tool/${t.slug}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/claim/${t.slug}/free`)}`);
  }

  const boundFreeClaim = submitClaim.bind(null, t.id, t.slug);

  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      <Link href={`/claim/${t.slug}`} className="text-xs text-ink/50 hover:text-plum">
        ← Back to pricing
      </Link>
      <div className="flex items-center gap-3 mt-4">
        <ToolAvatar name={t.name} logoUrl={t.logo_url} websiteUrl={t.website_url} size={40} />
        <h1 className="font-display font-bold text-2xl">Claim {t.name}</h1>
      </div>
      <p className="text-ink/60 mt-3 leading-relaxed text-sm">
        This is the free, basic claim — it only proves ownership. No verified badge and no listing
        edits are included. If you'd also like to update the listing, use{" "}
        <Link href={`/claim/${t.slug}/checkout`} className="text-plum hover:underline">
          Update &amp; verify
        </Link>{" "}
        instead.
      </p>

      <form action={boundFreeClaim} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Business email *</label>
          <input
            name="business_email"
            type="email"
            required
            defaultValue={user.email ?? undefined}
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
          <p className="text-xs text-ink/45 mt-1">
            Ideally an email on the tool's own domain — it speeds up review.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Your role</label>
          <input
            name="role"
            placeholder="e.g. Founder, Marketing lead"
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Anything else?</label>
          <textarea
            name="note"
            rows={3}
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        {searchParams.error && <p className="text-sm text-coral">{searchParams.error}</p>}
        <SubmitButton
          pendingText="Submitting…"
          className="border border-line text-sm font-medium px-5 py-2.5 rounded-md hover:border-plum hover:text-plum transition-colors"
        >
          Submit free claim
        </SubmitButton>
      </form>
    </main>
  );
}
