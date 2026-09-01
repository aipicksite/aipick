import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | AIPick",
  description: "Terms of use for AIPick.site.",
};

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Legal</span>
      <h1 className="font-display font-bold text-3xl mt-1">Terms & Conditions</h1>
      <p className="text-sm text-ink/45 mt-2">Last updated: [DATE]</p>

      <div className="prose prose-neutral mt-8 max-w-none font-body text-[15px] leading-relaxed">
        <p>
          By using AIPick.site you agree to these terms. If you don't agree,
          please don't use the site.
        </p>

        <h2>Accounts</h2>
        <p>
          You need an account to vote, review, submit or save tools. You're
          responsible for activity under your account and for keeping your
          sign-in access secure.
        </p>

        <h2>Community content</h2>
        <ul>
          <li>Votes and reviews must reflect genuine opinions or experience — not payment, coercion, or bulk/fake accounts.</li>
          <li>Reviews must not contain harassment, hate speech, spam, or content unrelated to the tool.</li>
          <li>We may remove content or votes, and suspend accounts, that violate these rules.</li>
        </ul>

        <h2>Tool submissions & listings</h2>
        <ul>
          <li>Submitted tools go through moderation before publishing and may be edited for accuracy or rejected.</li>
          <li>Tool owners who claim a listing must be authorized to represent that tool, and are responsible for the accuracy of the information they provide.</li>
          <li>We may remove a listing that is inactive, misleading, or violates applicable law.</li>
        </ul>

        <h2>Rankings</h2>
        <p>
          Rankings are calculated from community signals as described on the{" "}
          <a href="/how-it-works">How Ranking Works</a> page and may change as
          that methodology improves. Sponsored placements, if any, are always
          labelled and do not affect a tool's organic ranking.
        </p>

        <h2>Intellectual property</h2>
        <p>
          AIPick's branding, design and original content are owned by
          AIPick. Tool names, logos and trademarks belong to their respective
          owners and are used for identification purposes only.
        </p>

        <h2>Disclaimer</h2>
        <p>
          AIPick provides information about third-party tools "as is." We
          don't guarantee the accuracy of listings or reviews, and we're not
          responsible for your experience with any listed tool.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the extent permitted by law, AIPick is not liable for indirect,
          incidental, or consequential damages arising from your use of the
          site.
        </p>

        <h2>Changes</h2>
        <p>We may update these terms from time to time; continued use of the site means you accept the current version.</p>

        <h2>Contact</h2>
        <p>Questions about these terms: <a href="mailto:legal@aipick.site">legal@aipick.site</a></p>
      </div>
    </main>
  );
}
