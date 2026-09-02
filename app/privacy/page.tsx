import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AIPick",
  description: "How AIPick collects, uses, and protects your data.",
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
          <span className="text-forest shrink-0 mt-0.5">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Legal</span>
      <h1 className="font-display font-bold text-3xl mt-1">Privacy Policy</h1>
      <p className="text-sm text-ink/45 mt-2">Last updated: [DATE]</p>

      <div className="mt-7 bg-forest-soft border border-forest/15 rounded-lg p-5">
        <h2 className="font-display font-semibold text-forest text-sm uppercase tracking-wide">
          The short version
        </h2>
        <div className="mt-3 text-[15px] text-ink/75">
          <CheckList
            items={[
              "We collect your email, votes, reviews, and basic usage data — nothing more than we need to run AIPick.",
              <>We never sell your personal data, full stop.</>,
              "You can edit or delete your reviews and votes any time.",
              "Paid placement never touches your individual account data.",
            ]}
          />
        </div>
      </div>

      <Section n="01" title="Information we collect">
        <p>This Privacy Policy explains what AIPick.site ("AIPick", "we", "us") collects when you use the site, and how we use, store, and protect it.</p>
        <CheckList
          items={[
            <><strong>Account information:</strong> email address, and username if you set one.</>,
            <><strong>Activity data:</strong> votes, reviews, ratings, saved lists, and tools you submit or claim.</>,
            <><strong>Usage data:</strong> pages visited, device/browser type, approximate location — collected automatically via analytics.</>,
            <><strong>Cookies:</strong> used to keep you signed in and remember basic preferences.</>,
          ]}
        />
      </Section>

      <Section n="02" title="How we use it">
        <CheckList
          items={[
            "To operate core features: voting, reviews, saved lists, and owner verification.",
            "To calculate rankings and prevent abuse such as duplicate or fake votes.",
            "To send account-related emails (sign-in links, notifications you opt into).",
            "To understand aggregate usage and improve the product.",
          ]}
        />
      </Section>

      <Section n="03" title="Sharing">
        <p>We share data only with service providers that help us run AIPick (hosting, database, email delivery, analytics), and only as needed for them to provide that service, or where required by law.</p>
      </Section>

      <Section n="04" title="Your choices">
        <CheckList
          items={[
            "Edit or delete your reviews and votes any time from the relevant tool page.",
            "Request a copy or deletion of your account data by contacting us.",
            "Opt out of non-essential emails from your account settings.",
          ]}
        />
      </Section>

      <Section n="05" title="Data retention">
        <p>We retain account and activity data for as long as your account is active, or as needed to keep rankings accurate and prevent abuse.</p>
      </Section>

      <Section n="06" title="Children's privacy">
        <p>AIPick is not directed at children under 13, and we do not knowingly collect data from them.</p>
      </Section>

      <Section n="07" title="Changes to this policy">
        <p>We'll update the "last updated" date above whenever this policy changes, and post material changes on this page.</p>
      </Section>

      <Section n="08" title="Contact">
        <p>Questions about this policy: <a href="mailto:privacy@aipick.site" className="text-plum hover:underline">privacy@aipick.site</a></p>
      </Section>
    </main>
  );
}
