import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/pricing";
import { notFound, redirect } from "next/navigation";
import { submitClaim } from "./actions";
import { submitToolUpdate } from "@/app/update-ai/actions";
import Link from "next/link";
import ToolAvatar from "@/components/ToolAvatar";
import ClaimOrUpdateFlow from "@/components/ClaimOrUpdateFlow";
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

  let existingClaim: any = null;
  if (user) {
    const { data } = await supabase
      .from("tool_claims")
      .select("*")
      .eq("tool_id", t.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .maybeSingle();
    existingClaim = data;
  }

  const planRaw = await getPlan("update_tool");
  const updatePlan = planRaw
    ? {
        key: planRaw.key,
        label: planRaw.label,
        amount_cents: planRaw.amount_cents,
        currency: planRaw.currency,
        isFreeNow: !!planRaw.free_until && new Date(planRaw.free_until).getTime() > Date.now(),
      }
    : null;

  const boundFreeClaim = submitClaim.bind(null, t.id, t.slug);

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Claim this listing</span>
      <div className="flex items-center gap-3 mt-2">
        <ToolAvatar name={t.name} logoUrl={t.logo_url} websiteUrl={t.website_url} size={40} />
        <h1 className="font-display font-bold text-2xl">{t.name}</h1>
      </div>
      <p className="text-ink/60 mt-3 leading-relaxed max-w-lg">
        Claiming lets you keep this tool's description, pricing and logo accurate.
        Updating and verifying goes further — a verified badge, a richer profile
        with screenshots and video, and the ability to reply to reviews as the
        owner.
      </p>

      {searchParams.submitted && (
        <div className="mt-6 bg-forest-soft border border-forest/20 text-forest rounded-lg p-4 text-sm">
          {existingClaim?.kind === "update"
            ? "Payment confirmed and update request sent — we'll review it and follow up at the email you provided."
            : "Claim request sent — we'll review it and follow up at the email you provided."}
        </div>
      )}

      {existingClaim ? (
        <div className="mt-8 bg-surface border border-line rounded-lg p-5">
          <p className="text-sm text-ink/60">
            You already have {existingClaim.kind === "update" ? "an update request" : "a claim"} on this
            tool:{" "}
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
          {existingClaim.status === "rejected" && existingClaim.kind !== "update" && updatePlan && (
            <p className="text-sm text-ink/60 mt-3">
              Want another try, with more control over the listing? Consider the paid{" "}
              <Link href="/update-ai" className="text-plum hover:underline">
                update & verify
              </Link>{" "}
              option instead.
            </p>
          )}
        </div>
      ) : !user ? (
        <div className="mt-8 bg-surface border border-line rounded-lg p-6 text-center">
          <p className="text-sm text-ink/60">Sign in first to claim or update this listing.</p>
          <Link
            href={`/login?next=/claim/${t.slug}`}
            className="inline-block mt-3 bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <ClaimOrUpdateFlow
          tool={{ id: t.id, slug: t.slug, name: t.name, website_url: t.website_url }}
          freeClaimAction={boundFreeClaim}
          updatePlan={updatePlan}
          updateAction={submitToolUpdate}
          defaultEmail={user.email ?? undefined}
          error={searchParams.error}
        />
      )}
    </main>
  );
}
