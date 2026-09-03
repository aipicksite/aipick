import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { submitClaim } from "./actions";
import Link from "next/link";
import ToolAvatar from "@/components/ToolAvatar";
import type { Tool } from "@/types/database";

type Props = {
  params: { slug: string };
  searchParams: { error?: string; submitted?: string };
};

export default async function ClaimPage({ params, searchParams }: Props) {
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

  let existingClaim = null;
  if (user) {
    const { data } = await supabase
      .from("tool_claims")
      .select("*")
      .eq("tool_id", t.id)
      .eq("user_id", user.id)
      .maybeSingle();
    existingClaim = data;
  }

  const boundSubmit = submitClaim.bind(null, t.id, t.slug);

  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Claim this listing</span>
      <div className="flex items-center gap-3 mt-2">
        <ToolAvatar name={t.name} logoUrl={t.logo_url} websiteUrl={t.website_url} size={40} />
        <h1 className="font-display font-bold text-2xl">{t.name}</h1>
      </div>
      <p className="text-ink/60 mt-3 leading-relaxed">
        Claiming lets you keep this tool's description, pricing and logo
        accurate, and adds a verified badge visitors can trust.
      </p>

      {searchParams.submitted && (
        <div className="mt-6 bg-forest-soft border border-forest/20 text-forest rounded-lg p-4 text-sm">
          Claim request sent — we'll review it and follow up at the email you provided.
        </div>
      )}

      {existingClaim ? (
        <div className="mt-8 bg-surface border border-line rounded-lg p-5">
          <p className="text-sm text-ink/60">
            You already have a claim on this tool:{" "}
            <span
              className={`font-medium ${
                existingClaim.status === "approved"
                  ? "text-forest"
                  : existingClaim.status === "rejected"
                  ? "text-coral"
                  : "text-gold"
              }`}
            >
              {existingClaim.status}
            </span>
          </p>
        </div>
      ) : !user ? (
        <div className="mt-8 bg-surface border border-line rounded-lg p-6 text-center">
          <p className="text-sm text-ink/60">Sign in first to claim this listing.</p>
          <Link
            href={`/login?next=/claim/${t.slug}`}
            className="inline-block mt-3 bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <form action={boundSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Business email *</label>
            <input
              name="business_email"
              type="email"
              required
              placeholder={`you@${(() => {
                try {
                  return new URL(t.website_url).hostname.replace(/^www\./, "");
                } catch {
                  return "yourcompany.com";
                }
              })()}`}
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
          <button
            type="submit"
            className="bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
          >
            Submit claim
          </button>
        </form>
      )}
    </main>
  );
}
