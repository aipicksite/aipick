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

type PlanView = {
  key: string;
  label: string;
  amount_cents: number;
  currency: string;
  isFreeNow: boolean;
} | null;

async function loadPlanView(key: string): Promise<PlanView> {
  const planRaw = await getPlan(key);
  if (!planRaw) return null;
  return {
    key: planRaw.key,
    label: planRaw.label,
    amount_cents: planRaw.amount_cents,
    currency: planRaw.currency,
    isFreeNow: !!planRaw.free_until && new Date(planRaw.free_until).getTime() > Date.now(),
  };
}

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

  // Both paths on this page are paid: claiming ownership is no longer free.
  // $9.99 (update_tool) claims + lets the owner edit the listing.
  // $99 (submit_featured) claims + also gets the listing featured on the
  // homepage for its featured window — it does NOT stack with update_tool,
  // it's an alternative that includes the claim on its own.
  const updatePlan = await loadPlanView("update_tool");
  const featuredPlan = await loadPlanView("submit_featured");

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Claim this listing</span>
      <div className="flex items-center gap-3 mt-2">
        <ToolAvatar name={t.name} logoUrl={t.logo_url} websiteUrl={t.website_url} size={40} />
        <h1 className="font-display font-bold text-2xl">{t.name}</h1>
      </div>
      <p className="text-ink/60 mt-3 leading-relaxed max-w-lg">
        Claiming ownership requires one of the paid plans below — both include claiming, so
        there's no separate claim fee on top. Once approved, you'll get a verified badge on
        this page and access to manage the listing going forward.
      </p>

      {searchParams.submitted && (
        <div className="mt-6 bg-forest-soft border border-forest/20 text-forest rounded-lg p-4 text-sm">
          Payment confirmed and your claim is in review — we'll follow up at the email you
          provided.
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
            You already have{" "}
            {existingClaim.plan_key === "submit_featured" ? "a feature request" : "an update request"} on
            this tool:{" "}
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
        <div className="mt-8 grid sm:grid-cols-2 gap-5 items-stretch">
          {/* Option 1: claim + update */}
          <div className="flex flex-col relative rounded-xl border border-plum bg-surface p-7 shadow-lift">
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

            <ul className="mt-5 space-y-2.5 text-sm text-ink/70 flex-1">
              <li className="flex gap-2"><span className="text-plum">🏷</span> Claim ownership of this listing</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Verified badge on your listing</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Update description, pricing & highlights</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Add a screenshot + YouTube overview video</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Priority review queue</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Reply publicly to reviews as the owner</li>
            </ul>

            {updatePlan ? (
              <Link
                href={`/claim/${t.slug}/checkout?plan=update`}
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

          {/* Option 2: claim + featured (includes everything in update, plus homepage placement) */}
          <div className="flex flex-col relative rounded-xl border border-gold bg-surface p-7 shadow-lift">
            <span className="absolute -top-3 left-7 bg-gold text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
              Best visibility
            </span>
            <span className="text-xs font-medium text-ink/45 uppercase tracking-wide">
              Claim & feature
            </span>
            <h2 className="font-display font-bold text-xl mt-1">
              {featuredPlan?.label ?? "Claim & feature"}
            </h2>
            <div className="mt-3 flex items-baseline gap-1">
              {featuredPlan?.isFreeNow ? (
                <span className="text-forest font-display font-bold text-3xl">Free</span>
              ) : featuredPlan ? (
                <>
                  <span className="font-display font-bold text-3xl">
                    ${(featuredPlan.amount_cents / 100).toFixed(2)}
                  </span>
                  <span className="text-ink/40 text-sm">one-time</span>
                </>
              ) : (
                <span className="text-ink/40">Not available right now</span>
              )}
            </div>

            <ul className="mt-5 space-y-2.5 text-sm text-ink/70 flex-1">
              <li className="flex gap-2"><span className="text-plum">🏷</span> Claim ownership of this listing</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Everything in Update & verify</li>
              <li className="flex gap-2"><span className="text-gold">★</span> Featured on the homepage</li>
              <li className="flex gap-2"><span className="text-gold">★</span> No separate claim fee — this covers it</li>
            </ul>

            {featuredPlan ? (
              <Link
                href={`/claim/${t.slug}/checkout?plan=featured`}
                className="mt-6 inline-flex items-center justify-center w-full text-sm font-medium px-5 py-3 rounded-md bg-gold text-white hover:opacity-90 transition-colors"
              >
                {featuredPlan.isFreeNow
                  ? "Continue — it's free right now"
                  : `Order — $${(featuredPlan.amount_cents / 100).toFixed(2)}`}
              </Link>
            ) : (
              <p className="mt-6 text-xs text-ink/45 text-center">Check back later.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
