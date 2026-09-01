import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Ranking Works | AIPick",
  description: "How the AIPick Score and rankings are calculated.",
};

const factors = [
  { pct: "30%", label: "Upvote ratio", body: "The share of votes that are upvotes, not just raw vote count." },
  { pct: "20%", label: "Review rating", body: "Average star rating from published community reviews." },
  { pct: "15%", label: "Review volume", body: "More reviews add confidence to the score." },
  { pct: "10%", label: "Recent activity", body: "Votes and reviews from the last 30 days count more." },
  { pct: "10%", label: "Engagement", body: "Saves, comparisons and profile views." },
  { pct: "10%", label: "Growth", body: "How fast a tool is gaining votes relative to its history." },
  { pct: "5%", label: "Verification & data quality", body: "Verified owner, complete profile, working links." },
];

export default function HowItWorksPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Methodology</span>
      <h1 className="font-display font-bold text-3xl mt-1">How the AIPick Score works</h1>
      <p className="text-ink/65 mt-4 leading-relaxed">
        No tool can pay to rank higher. The AIPick Score is a blend of
        community signals, recalculated regularly as votes and reviews come
        in.
      </p>

      <div className="mt-10 flex flex-col gap-3">
        {factors.map((f) => (
          <div key={f.label} className="flex items-start gap-4 bg-surface border border-line rounded-lg p-4">
            <span className="rank-badge font-bold text-plum w-14 shrink-0">{f.pct}</span>
            <div>
              <h3 className="font-medium text-sm">{f.label}</h3>
              <p className="text-sm text-ink/55 mt-0.5">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
