import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | AIPick",
  description: "Terms of use for AIPick.site.",
};

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <div className="flex items-baseline gap-3">
        <span className="rank-badge text-plum font-bold text-sm">{n}</span>
        <h2 className="font-display font-bold text-lg">{title}</h2>
      </div>
      <div className="mt-3 pl-8 text-[15px] text-ink/70 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

function CheckList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="text-plum shrink-0 mt-0.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Legal</span>
      <h1 className="font-display font-bold text-3xl mt-1">Terms & Conditions</h1>
      <p className="text-sm text-ink/45 mt-2">Last updated: [DATE]</p>

      <div className="mt-7 bg-gold-soft border border-gold/25 rounded-lg p-5">
        <h2 className="font-display font-semibold text-gold text-sm uppercase tracking-wide">
          The short version
        </h2>
        <p className="mt-3 text-[15px] text-ink/75 leading-relaxed">
          Vote and review honestly, don't spam or fake activity, and if you
          submit or claim a tool, keep its information accurate. We label
          sponsored placements and never let payment change organic rank.
        </p>
      </div>

      <p className="mt-8 text-[15px] text-ink/70 leading-relaxed">
        By using AIPick.site you agree to these terms. If you don't agree, please don't use the site.
      </p>

      <Section n="01" title="Accounts">
        <p>You need an account to vote, review, submit or save tools. You're responsible for activity under your account and for keeping your sign-in access secure.</p>
      </Section>

      <Section n="02" title="Community content">
        <CheckList
          items={[
            "Votes and reviews must reflect genuine opinions or experience — not payment, coercion, or bulk/fake accounts.",
            "Reviews must not contain harassment, hate speech, spam, or content unrelated to the tool.",
            "We may remove content or votes, and suspend accounts, that violate these rules.",
          ]}
        />
      </Section>

      <Section n="03" title="Tool submissions & listings">
        <CheckList
          items={[
            "Submitted tools go through moderation before publishing and may be edited for accuracy or rejected.",
            "Tool owners who claim a listing must be authorized to represent that tool, and are responsible for the accuracy of the information they provide.",
            "We may remove a listing that is inactive, misleading, or violates applicable law.",
          ]}
        />
      </Section>

      <Section n="04" title="Rankings">
        <p>
          Rankings are calculated from community signals as described on the{" "}
          <a href="/how-it-works" className="text-plum hover:underline">How Ranking Works</a> page and may change as
          that methodology improves. Sponsored placements, if any, are always
          labelled and do not affect a tool's organic ranking.
        </p>
      </Section>

      <Section n="05" title="Intellectual property">
        <p>
          AIPick's branding, design and original content are owned by AIPick.
          Tool names, logos and trademarks belong to their respective owners
          and are used for identification purposes only.
        </p>
      </Section>

      <Section n="06" title="Disclaimer">
        <p>
          AIPick provides information about third-party tools "as is." We
          don't guarantee the accuracy of listings or reviews, and we're not
          responsible for your experience with any listed tool.
        </p>
      </Section>

      <Section n="07" title="Limitation of liability">
        <p>To the extent permitted by law, AIPick is not liable for indirect, incidental, or consequential damages arising from your use of the site.</p>
      </Section>

      <Section n="08" title="Changes">
        <p>We may update these terms from time to time; continued use of the site means you accept the current version.</p>
      </Section>

      <Section n="09" title="Contact">
        <p>Questions about these terms: <a href="mailto:legal@aipick.site" className="text-plum hover:underline">legal@aipick.site</a></p>
      </Section>
    </main>
  );
}
