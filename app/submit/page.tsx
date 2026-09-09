import { createClient } from "@/lib/supabase/server";
import { getActivePlans } from "@/lib/pricing";
import type { ToolSubmission } from "@/types/database";
import Link from "next/link";

export const metadata = {
  title: "Submit your AI tool — AIPick",
  description:
    "List your AI tool on AIPick and get in front of people actively comparing tools. Reviewed submissions, real votes, optional homepage featuring.",
};

const SUBMIT_FAQS = [
  {
    q: "How much does it cost to submit a tool?",
    a: "Standard listing starts at $19.99, one-time. Featured listing is $99 one-time and adds a rotating spot in the homepage Featured section for 7 days.",
  },
  {
    q: "Is my tool guaranteed to be approved?",
    a: "No — every submission is reviewed for quality and accuracy before it goes live. If it's rejected, we'll tell you why, and the listing fee is not charged again if you resubmit with fixes.",
  },
  {
    q: "Does paying get my tool a higher rank?",
    a: "No. The AIPick Score is entirely vote- and review-based and is never affected by payment. Featured is a clearly labeled, separate placement — not a ranking boost.",
  },
  {
    q: "What's the difference between Standard and Featured?",
    a: "Both get you a full, reviewed listing. Featured additionally puts your tool in the homepage Featured section for 7 days and moves you to the priority review queue.",
  },
  {
    q: "Can I edit my listing after it's published?",
    a: "Yes. Claiming ownership is free. If you also want to update the description, pricing, or add media, do that from the Claim/Update page for a small one-time fee.",
  },
  {
    q: "How long does review take?",
    a: "Most submissions are reviewed within a few days. Featured submissions go into a priority queue and are typically reviewed faster.",
  },
  {
    q: "What if more than 15 tools want to be Featured at once?",
    a: "Featured spots rotate on a fair first-come, first-served basis — up to 15 tools are shown at a time, each for a full 7 days. If all slots are taken, your listing gets its full 7 days as soon as a slot opens up.",
  },
];

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SUBMIT_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 15% 0%, rgba(62,42,92,0.08), transparent), radial-gradient(50% 45% at 100% 10%, rgba(198,138,40,0.10), transparent)",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-14 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-plum bg-plum/5 border border-plum/15 rounded-full px-3 py-1 uppercase tracking-wide">
            Submit a tool
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mt-5 leading-tight">
            Put your AI tool in front of
            <br className="hidden sm:block" /> people ready to try it
          </h1>
          <p className="text-ink/60 mt-4 max-w-xl mx-auto leading-relaxed">
            AIPick is a community-ranked directory — real votes, real reviews, and
            organic search traffic from people actively comparing AI tools. Pick a
            plan below to get listed.
          </p>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-ink/55 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="text-forest">✓</span> Reviewed before it goes live
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-forest">✓</span> Ranking stays vote-based, not pay-to-rank
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-forest">✓</span> Open to real user reviews
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4">
        {searchParams.submitted && (
          <div className="mt-10 bg-forest-soft border border-forest/20 text-forest rounded-lg p-4 text-sm text-center">
            Thanks! Your submission is in the queue for review — you'll see its status
            below once you're signed in.
          </div>
        )}
        {searchParams.error && (
          <div className="mt-10 bg-coral-soft border border-coral/20 text-coral rounded-lg p-4 text-sm text-center">
            {searchParams.error}
          </div>
        )}

        {/* Why list on AIPick */}
        <div className="mt-14">
          <h2 className="font-display font-bold text-2xl text-center">Why list your tool on AIPick?</h2>
          <p className="text-ink/60 mt-2 text-center max-w-2xl mx-auto leading-relaxed">
            Most directories rank by who paid the most. AIPick's score comes from real votes and
            reviews — so the traffic you get here is people who chose your tool, not people who
            clicked an ad. That's a better fit, and it converts better too.
          </p>
          <div className="mt-8 grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: "🔎",
                color: "bg-plum/10 text-plum",
                title: "Organic search traffic",
                body: "Every listing is a real page, indexed and optimized — people find you searching for the problem you solve.",
              },
              {
                icon: "🗳️",
                color: "bg-gold/15 text-gold",
                title: "Real votes, real reviews",
                body: "No pay-to-rank games. Users vote and review honestly, which builds more trust than any ad ever could.",
              },
              {
                icon: "🤝",
                color: "bg-forest/10 text-forest",
                title: "A directory people actually use",
                body: "Comparisons, category pages, and a growing community — you're listed where people are already deciding.",
              },
            ].map((h) => (
              <div key={h.title} className="bg-surface border border-line rounded-xl p-6">
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg ${h.color}`}>
                  {h.icon}
                </span>
                <h3 className="font-display font-semibold mt-4">{h.title}</h3>
                <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-16 grid sm:grid-cols-2 gap-6 items-stretch">
          {plans.map((plan) => {
            const featured = plan.key === "submit_featured";
            return (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-xl p-7 border ${
                  featured
                    ? "border-plum bg-surface shadow-lift"
                    : "border-line bg-surface shadow-card"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-7 bg-plum text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
                    Recommended
                  </span>
                )}
                <span className="text-xs font-medium text-ink/45 uppercase tracking-wide">
                  {featured ? "Featured listing" : "Standard listing"}
                </span>
                <h2 className="font-display font-bold text-xl mt-1">{plan.label}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  {plan.isFreeNow ? (
                    <span className="text-forest font-display font-bold text-3xl">Free</span>
                  ) : (
                    <>
                      <span className="font-display font-bold text-3xl">
                        ${(plan.amount_cents / 100).toFixed(2)}
                      </span>
                      <span className="text-ink/40 text-sm">one-time</span>
                    </>
                  )}
                </div>

                <ul className="mt-5 space-y-2.5 text-sm text-ink/70 flex-1">
                  <li className="flex gap-2"><span className="text-forest">✓</span> Reviewed and published to the directory</li>
                  <li className="flex gap-2"><span className="text-forest">✓</span> Open to votes, ratings and reviews</li>
                  <li className="flex gap-2"><span className="text-forest">✓</span> Full listing page with pricing & highlights</li>
                  {featured ? (
                    <>
                      <li className="flex gap-2"><span className="text-gold">★</span> Featured on the homepage for {plan.featured_days ?? 7} days</li>
                      <li className="flex gap-2"><span className="text-gold">★</span> Priority review queue</li>
                    </>
                  ) : (
                    <li className="flex gap-2 text-ink/40"><span>—</span> Homepage featuring (upgrade anytime)</li>
                  )}
                </ul>

                <Link
                  href={`/checkout/submit?plan=${plan.key}`}
                  className={`mt-6 inline-flex items-center justify-center text-sm font-medium px-5 py-3 rounded-md transition-colors ${
                    featured
                      ? "bg-plum text-white hover:bg-plum-deep"
                      : "border border-line hover:border-plum hover:text-plum"
                  }`}
                >
                  {plan.isFreeNow ? "Continue — it's free right now" : `Order ${plan.label}`}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="mt-14 overflow-x-auto">
          <table className="w-full text-sm border border-line rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-surface text-left">
                <th className="p-4 font-display font-semibold">What you get</th>
                <th className="p-4 font-display font-semibold text-center">Standard</th>
                <th className="p-4 font-display font-semibold text-center text-plum">Featured</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Reviewed before going live", true, true],
                ["Open to votes & reviews", true, true],
                ["Full listing page", true, true],
                ["Homepage spotlight (rotating, 7 days)", false, true],
                ["Priority review queue", false, true],
                ["Owner can claim & verify later", true, true],
              ].map(([label, std, feat], idx) => (
                <tr key={label as string} className={idx % 2 ? "bg-surface/50" : ""}>
                  <td className="p-4 border-t border-line text-ink/70">{label as string}</td>
                  <td className="p-4 border-t border-line text-center">
                    {std ? <span className="text-forest">✓</span> : <span className="text-ink/25">—</span>}
                  </td>
                  <td className="p-4 border-t border-line text-center">
                    {feat ? <span className="text-gold">★</span> : <span className="text-ink/25">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How it works */}
        <div className="mt-16 pb-4">
          <h2 className="font-display font-bold text-lg text-center">How it works</h2>
          <div className="mt-6 grid sm:grid-cols-4 gap-6 text-sm">
            {[
              ["1", "Pick a plan", "Choose Standard or Featured above."],
              ["2", "Sign in", "Quick passwordless sign-in with your email."],
              ["3", "Checkout", "Pay securely via PayPal, or apply a coupon."],
              ["4", "Add your tool", "Tell us about it — we review and publish it."],
            ].map(([n, title, body]) => (
              <div key={n} className="text-center">
                <div className="mx-auto w-8 h-8 rounded-full bg-plum text-white flex items-center justify-center font-display font-bold text-sm">
                  {n}
                </div>
                <p className="font-medium mt-3">{title}</p>
                <p className="text-ink/55 mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 pb-16 border-t border-line pt-12">
          <h2 className="font-display font-bold text-2xl text-center">Frequently asked questions</h2>
          <div className="mt-8 max-w-2xl mx-auto flex flex-col gap-3">
            {SUBMIT_FAQS.map((f) => (
              <details key={f.q} className="group bg-surface border border-line rounded-lg p-4">
                <summary className="font-display font-medium text-sm cursor-pointer list-none flex items-center justify-between gap-3">
                  {f.q}
                  <span className="text-ink/40 group-open:rotate-45 transition-transform shrink-0">+</span>
                </summary>
                <p className="text-sm text-ink/60 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        {!user && (
          <div className="pb-16 -mt-6 text-center text-sm text-ink/50">
            Already picked a plan?{" "}
            <Link href="/login?next=/submit" className="text-plum hover:underline">
              Sign in
            </Link>{" "}
            and you'll land right back here.
          </div>
        )}

        {myRecent.length > 0 && (
          <div className="pb-16 pt-8 border-t border-line">
            <h2 className="font-display font-semibold text-sm text-ink/60 uppercase tracking-wide">
              Your recent submissions
            </h2>
            <div className="mt-4 flex flex-col gap-2 max-w-xl">
              {myRecent.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3 text-sm"
                >
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
      </div>
    </main>
  );
}
