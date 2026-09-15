import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/pricing";
import { notFound, redirect } from "next/navigation";
import { submitToolUpdate } from "@/app/update-ai/actions";
import ClaimCheckoutFlow from "@/components/ClaimCheckoutFlow";
import Link from "next/link";
import type { Tool } from "@/types/database";

type Props = {
  params: { slug: string };
  searchParams: { error?: string; plan?: string };
};

// Two plan_key options land here: "update" -> update_tool ($9.99, claim +
// edit rights), "featured" -> submit_featured ($99, claim + homepage
// placement). Anything else/missing defaults to "update".
const PLAN_KEY_BY_OPTION: Record<string, string> = {
  update: "update_tool",
  featured: "submit_featured",
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
    const qs = searchParams.plan ? `?plan=${encodeURIComponent(searchParams.plan)}` : "";
    redirect(`/login?next=${encodeURIComponent(`/claim/${t.slug}/checkout${qs}`)}`);
  }

  const option = searchParams.plan === "featured" ? "featured" : "update";
  const planKey = PLAN_KEY_BY_OPTION[option];

  const planRaw = await getPlan(planKey);
  if (!planRaw) {
    redirect(`/claim/${t.slug}`);
  }

  const plan = {
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
          plan={plan}
          updateAction={submitToolUpdate}
          defaultEmail={user.email ?? undefined}
          error={searchParams.error}
        />
      </div>
    </main>
  );
}
