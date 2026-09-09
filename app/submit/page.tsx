import { createClient } from "@/lib/supabase/server";
import { getActivePlans } from "@/lib/pricing";
import { submitTool } from "./actions";
import SubmitFlow from "@/components/SubmitFlow";
import type { ToolSubmission } from "@/types/database";
import Link from "next/link";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: { error?: string; submitted?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myRecent: ToolSubmission[] = [];
  if (user) {
    const { data } = await supabase
      .from("tool_submissions")
      .select("*")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    myRecent = (data as ToolSubmission[] | null) ?? [];
  }

  const plansRaw = await getActivePlans();
  const plans = plansRaw
    .filter((p) => p.key === "submit_basic" || p.key === "submit_featured")
    .sort((a, b) => (a.key === "submit_basic" ? -1 : 1))
    .map((p) => ({
      key: p.key,
      label: p.label,
      amount_cents: p.amount_cents,
      currency: p.currency,
      isFreeNow: !!p.free_until && new Date(p.free_until).getTime() > Date.now(),
      featured_days: p.featured_days,
    }));

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Submit</span>
      <h1 className="font-display font-bold text-3xl mt-1">Submit an AI tool</h1>
      <p className="text-ink/60 mt-3 leading-relaxed">
        Choose a plan below. Every submission is still reviewed before it goes live, and
        ranking always stays based on real votes and reviews — paying only gets your tool
        listed and, on the Featured plan, put in front of more people early on.
      </p>

      {searchParams.submitted && (
        <div className="mt-6 bg-forest-soft border border-forest/20 text-forest rounded-lg p-4 text-sm">
          Thanks! Your submission is in the queue for review.
        </div>
      )}

      {!user ? (
        <div className="mt-8 bg-surface border border-line rounded-lg p-6 text-center">
          <p className="text-sm text-ink/60">Sign in first to submit a tool.</p>
          <Link
            href="/login?next=/submit"
            className="inline-block mt-3 bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <SubmitFlow plans={plans} submitAction={submitTool} error={searchParams.error} />
      )}

      {myRecent.length > 0 && (
        <div className="mt-12 pt-8 border-t border-line">
          <h2 className="font-display font-semibold text-sm text-ink/60 uppercase tracking-wide">
            Your recent submissions
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {myRecent.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3 text-sm">
                <span className="font-medium">{s.name}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    s.status === "approved"
                      ? "border-forest/25 text-forest bg-forest-soft"
                      : s.status === "rejected"
                      ? "border-coral/25 text-coral bg-coral-soft"
                      : "border-gold/40 text-gold bg-gold-soft"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
