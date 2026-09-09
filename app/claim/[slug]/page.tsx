import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/pricing";
import { notFound, redirect } from "next/navigation";
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

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Claim this listing</span>
      <div className="flex items-center gap-3 mt-2">
        <ToolAvatar name={t.name} logoUrl={t.logo_url} websiteUrl={t.website_url} size={40} />
        <h1 className="font-display font-bold text-2xl">{t.name}</h1>
      </div>
      <p className="text-ink/60 mt-3 leading-relaxed max-w-lg">
        Update this listing and claim ownership — one one-time fee covers both. Once approved,
        you'll get a verified badge on this page and access to manage the listing going forward.
      </p>

      {searchParams.submitted && (
        <div className="mt-6 bg-forest-soft border border-forest/20 text-forest rounded-lg p-4 text-sm">
          {existingClaim?.kind === "update"
            ? "Payment confirmed and your update request is in review — we'll follow up at the email you provided."
            : "Claim request sent — we'll review it and follow up at the email you provided."}
        </div>
      )}
      {searchParams.error && (
        <div className="mt-6 bg-coral-soft border border-coral/20 text-coral rounded-lg p-4 text-sm">
          {searchParams.error}
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
        </div>
      ) : (
        <>
          {/* Primary: paid update & claim */}
          <div className="mt-8 relative rounded-xl border border-plum bg-surface p-7 shadow-lift">
            <span className="absolute -top-3 left-7 bg-plum text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
              Most owners choose this
            </span>
            <span className="text-xs font-medium text-ink/45 uppercase tracking-wide">
              Update & verify
            </span>
            <h2 className="font-display font-bold text-xl mt-1">
              {updatePlan?.label ?? "Update & verify"}
            </h2>
            <div className="mt-3 flex items-baseline gap-1">
              {updatePlan?.isFreeNow ? (
                <span className="text-forest font-display font-bold text-3xl">Free</span>
              ) : updatePlan ? (
                <>
                  <span className="font-display font-bold text-3xl">
                    ${(updatePlan.amount_cents / 100).toFixed(2)}
                  </span>
                  <span className="text-ink/40 text-sm">one-time</span>
                </>
              ) : (
                <span className="text-ink/40">Not available right now</span>
              )}
            </div>

            <ul className="mt-5 space-y-2.5 text-sm text-ink/70">
              <li className="flex gap-2"><span className="text-plum">🏷</span> Claim ownership of this listing</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Verified badge on your listing</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Update description, pricing & highlights</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Add a screenshot + YouTube overview video</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Priority review queue</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Reply publicly to reviews as the owner</li>
            </ul>

            {updatePlan ? (
              <Link
                href={`/claim/${t.slug}/checkout`}
                className="mt-6 inline-flex items-center justify-center w-full text-sm font-medium px-5 py-3 rounded-md bg-plum text-white hover:bg-plum-deep transition-colors"
              >
                {updatePlan.isFreeNow
                  ? "Continue — it's free right now"
                  : `Order — $${(updatePlan.amount_cents / 100).toFixed(2)}`}
              </Link>
            ) : (
              <p className="mt-6 text-xs text-ink/45 text-center">Check back later.</p>
            )}
          </div>

          {/* Secondary: free basic claim */}
          <p className="mt-5 text-center text-sm text-ink/45">
            Just proving ownership, no updates needed?{" "}
            <Link href={`/claim/${t.slug}/free`} className="text-plum hover:underline">
              Free basic claim →
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
