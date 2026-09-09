import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/pricing";
import { notFound, redirect } from "next/navigation";
import { submitToolUpdate } from "@/app/update-ai/actions";
import ClaimCheckoutFlow from "@/components/ClaimCheckoutFlow";
import Link from "next/link";
import type { Tool } from "@/types/database";

type Props = {
  params: { slug: string };
  searchParams: { error?: string };
};

export default async function ClaimCheckoutPage({ params, searchParams }: Props) {
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
    redirect(`/login?next=${encodeURIComponent(`/claim/${t.slug}/checkout`)}`);
  }

  const planRaw = await getPlan("update_tool");
  if (!planRaw) {
    redirect(`/claim/${t.slug}`);
  }

  const updatePlan = {
    key: planRaw.key,
    label: planRaw.label,
    amount_cents: planRaw.amount_cents,
    currency: planRaw.currency,
    isFreeNow: !!planRaw.free_until && new Date(planRaw.free_until).getTime() > Date.now(),
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <Link href={`/claim/${t.slug}`} className="text-xs text-ink/50 hover:text-plum">
        ← Back
      </Link>
      <div className="mt-6 bg-surface border border-line rounded-xl p-6 sm:p-8 shadow-card">
        <ClaimCheckoutFlow
          tool={{ id: t.id, slug: t.slug, name: t.name, website_url: t.website_url }}
          updatePlan={updatePlan}
          updateAction={submitToolUpdate}
          defaultEmail={user.email ?? undefined}
          error={searchParams.error}
        />
      </div>
    </main>
  );
}
