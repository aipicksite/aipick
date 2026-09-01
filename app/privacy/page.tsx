import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AIPick",
  description: "How AIPick collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Legal</span>
      <h1 className="font-display font-bold text-3xl mt-1">Privacy Policy</h1>
      <p className="text-sm text-ink/45 mt-2">Last updated: [DATE]</p>

      <div className="prose prose-neutral mt-8 max-w-none font-body text-[15px] leading-relaxed">
        <p>
          This Privacy Policy explains what information AIPick.site
          ("AIPick", "we", "us") collects when you use the site, and how we
          use, store, and protect it.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account information:</strong> email address, and username if you set one.</li>
          <li><strong>Activity data:</strong> votes, reviews, ratings, saved lists, and tools you submit or claim.</li>
          <li><strong>Usage data:</strong> pages visited, device/browser type, and approximate location, collected automatically via analytics.</li>
          <li><strong>Cookies:</strong> used to keep you signed in and remember basic preferences.</li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To operate core features: voting, reviews, saved lists, and owner verification.</li>
          <li>To calculate rankings and prevent abuse such as duplicate or fake votes.</li>
          <li>To send account-related emails (sign-in links, notifications you opt into).</li>
          <li>To understand aggregate usage and improve the product.</li>
        </ul>

        <h2>What we don't do</h2>
        <p>We don't sell your personal data. We don't let paid placement affect your individual account data or activity.</p>

        <h2>Sharing</h2>
        <p>
          We share data only with service providers that help us run AIPick
          (hosting, database, email delivery, analytics), and only as needed
          for them to provide that service, or where required by law.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>You can edit or delete your reviews and votes at any time from the relevant tool page.</li>
          <li>You can request a copy or deletion of your account data by contacting us.</li>
          <li>You can opt out of non-essential emails from your account settings.</li>
        </ul>

        <h2>Data retention</h2>
        <p>We retain account and activity data for as long as your account is active, or as needed to keep rankings accurate and prevent abuse.</p>

        <h2>Children's privacy</h2>
        <p>AIPick is not directed at children under 13, and we do not knowingly collect data from them.</p>

        <h2>Changes to this policy</h2>
        <p>We'll update the "last updated" date above whenever this policy changes, and post material changes on this page.</p>

        <h2>Contact</h2>
        <p>Questions about this policy: <a href="mailto:privacy@aipick.site">privacy@aipick.site</a></p>
      </div>
    </main>
  );
}
