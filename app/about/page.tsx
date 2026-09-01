import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About AIPick | AIPick",
  description:
    "AIPick is a community-powered platform for discovering, reviewing, and ranking AI tools — built on real votes, not paid placement.",
};

const values = [
  {
    title: "Community over ads",
    body: "Rankings come from upvotes, ratings and reviews from real users — paid placement never moves a tool up the list.",
  },
  {
    title: "Verified, not just listed",
    body: "Tool owners can claim and verify their listing, so pricing and features stay accurate instead of going stale.",
  },
  {
    title: "Transparent scoring",
    body: "The AIPick Score combines vote ratio, review rating, review volume and recent activity — never a single hidden number.",
  },
];

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">About</span>
      <h1 className="font-display font-bold text-4xl mt-1 leading-tight">
        A place to find the AI tool worth your time.
      </h1>
      <p className="text-ink/65 mt-5 text-lg leading-relaxed max-w-xl">
        There are thousands of AI tools now, and most directories just list
        them. AIPick is built differently — every tool is discovered, voted
        on, reviewed and compared by the people who actually use it, so the
        ranking means something.
      </p>

      <div className="grid sm:grid-cols-3 gap-5 mt-12">
        {values.map((v) => (
          <div key={v.title} className="bg-surface border border-line rounded-lg p-5">
            <h3 className="font-display font-semibold">{v.title}</h3>
            <p className="text-sm text-ink/60 mt-2 leading-relaxed">{v.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 bg-surface border border-line rounded-lg p-6 sm:p-8">
        <h2 className="font-display font-bold text-xl">How ranking works</h2>
        <p className="text-sm text-ink/65 mt-3 leading-relaxed">
          Every tool gets an AIPick Score built from its upvote ratio, average
          review rating, number of reviews, and how active it's been lately.
          No tool can buy its way up — sponsored spots, when they exist, are
          always labelled as sponsored.
        </p>
        <Link href="/how-it-works" className="inline-block mt-4 text-sm font-medium text-plum hover:underline">
          Read the full ranking methodology →
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/tools" className="bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors">
          Browse tools
        </Link>
        <Link href="/submit" className="border border-line text-sm font-medium px-5 py-2.5 rounded-md hover:border-plum hover:text-plum transition-colors">
          Submit a tool
        </Link>
      </div>
    </main>
  );
}
