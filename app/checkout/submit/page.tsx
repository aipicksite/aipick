import { createClient } from "@/lib/supabase/server";
import { getActivePlans } from "@/lib/pricing";
import { submitTool } from "@/app/submit/actions";
import CheckoutSubmitFlow from "@/components/CheckoutSubmitFlow";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Checkout — Submit a tool — AIPick",
};

export default async function CheckoutSubmitPage({
  searchParams,
}: {
  searchParams: { plan?: string; error?: string };
}) {
  const planKey = searchParams.plan ?? "";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = `/checkout/submit?plan=${encodeURIComponent(planKey)}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const plansRaw = await getActivePlans();
  const plan = plansRaw.find(
    (p) => p.key === planKey && (p.key === "submit_basic" || p.key === "submit_featured")
  );

  if (!plan) {
    redirect("/submit");
  }

  const planForFlow = {
    key: plan.key,
    label: plan.label,
    amount_cents: plan.amount_cents,
    currency: plan.currency,
    isFreeNow: !!plan.free_until && new Date(plan.free_until).getTime() > Date.now(),
    featured_days: plan.featured_days,
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <Link href="/submit" className="text-xs text-ink/50 hover:text-plum">
        ← Back to plans
      </Link>
      <div className="mt-6 bg-surface border border-line rounded-xl p-6 sm:p-8 shadow-card">
        <CheckoutSubmitFlow plan={planForFlow} submitAction={submitTool} error={searchParams.error} />
      </div>
    </main>
  );
}
