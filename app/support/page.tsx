import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support | AIPick",
  description: "Frequently asked questions about using AIPick.",
};

const faqs = [
  {
    q: "How do I vote on a tool?",
    a: "Open any tool page and click the ▲ or ▼ button next to its name. You'll need a free account — sign in with just your email, no password required.",
  },
  {
    q: "Can I change or remove my vote?",
    a: "Yes. Click the same button again to remove your vote, or click the other button to switch it.",
  },
  {
    q: "How do I write a review?",
    a: "Sign in, open the tool's page, and scroll to the Reviews section. You can rate it 1–5 stars and add a written review, and edit or delete it any time.",
  },
  {
    q: "How do I submit a new AI tool?",
    a: "Use the \"Submit a tool\" link in the header. Submissions go through a quick moderation check before they're published.",
  },
  {
    q: "I own a tool listed here — can I manage it?",
    a: "Yes, you can claim and verify your tool from its listing page so you control the description, pricing, and logo.",
  },
  {
    q: "How is the ranking decided?",
    a: "By community votes, review ratings, and recent activity — never by payment. See the full breakdown on the How Ranking Works page.",
  },
];

export default function SupportPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Support</span>
      <h1 className="font-display font-bold text-3xl mt-1">How can we help?</h1>
      <p className="text-ink/60 mt-3">
        Common questions below — or{" "}
        <Link href="/contact" className="text-plum hover:underline">contact us</Link> directly.
      </p>

      <div className="mt-9 flex flex-col gap-2.5">
        {faqs.map((f) => (
          <details key={f.q} className="group bg-surface border border-line rounded-lg px-5 py-4">
            <summary className="cursor-pointer list-none flex items-center justify-between font-medium text-[15px]">
              {f.q}
              <span className="text-ink/35 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
            </summary>
            <p className="text-sm text-ink/60 mt-3 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-12 bg-plum text-white rounded-lg p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-lg">Still stuck?</h2>
          <p className="text-white/70 text-sm mt-1">We usually reply within a couple of days.</p>
        </div>
        <Link href="/contact" className="bg-white text-plum text-sm font-medium px-4 py-2 rounded-md hover:bg-gold-soft transition-colors shrink-0">
          Contact support
        </Link>
      </div>
    </main>
  );
}
