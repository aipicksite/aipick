import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/pricing";
import { submitToolUpdate } from "./actions";
import UpdateFlow from "@/components/UpdateFlow";
import Link from "next/link";

export default async function UpdateAiPage({
  searchParams,
}: {
  searchParams: { error?: string; submitted?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const planRaw = await getPlan("update_tool");
  const plan = planRaw
    ? {
        key: planRaw.key,
        label: planRaw.label,
        amount_cents: planRaw.amount_cents,
        currency: planRaw.currency,
        isFreeNow: !!planRaw.free_until && new Date(planRaw.free_until).getTime() > Date.now(),
      }
    : null;

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Update a listing</span>
      <h1 className="font-display font-bold text-3xl mt-1">Claim & enrich a tool's page</h1>
      <p className="text-ink/60 mt-3 leading-relaxed">
        Update pricing and description, add a screenshot and a YouTube overview video, and
        get a verified badge. Basic ownership claims (no media) are still free from the{" "}
        <Link href="/tool" className="text-plum hover:underline">
          tool's own page
        </Link>
        .
      </p>

      {searchParams.submitted && (
        <div className="mt-6 bg-forest-soft border border-forest/20 text-forest rounded-lg p-4 text-sm">
          Thanks! Your update request is in the review queue.
        </div>
      )}

      {!user ? (
        <div className="mt-8 bg-surface border border-line rounded-lg p-6 text-center">
          <p className="text-sm text-ink/60">Sign in first to update a listing.</p>
          <Link
            href="/login?next=/update-ai"
            className="inline-block mt-3 bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
          >
            Sign in
          </Link>
        </div>
      ) : plan ? (
        <UpdateFlow
          plan={plan}
          submitAction={submitToolUpdate}
          error={searchParams.error}
          defaultEmail={user.email ?? undefined}
        />
      ) : (
        <p className="mt-8 text-sm text-coral">Updates aren't available right now — please check back later.</p>
      )}
    </main>
  );
}
