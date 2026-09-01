import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | AIPick",
  description: "Get in touch with the AIPick team.",
};

export default function ContactPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Contact</span>
      <h1 className="font-display font-bold text-3xl mt-1">Get in touch</h1>
      <p className="text-ink/60 mt-3 leading-relaxed">
        Questions, feedback, partnership or press requests — send a message
        and we'll get back to you within a couple of days.
      </p>

      <form action="mailto:hello@aipick.site" method="get" className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Name</label>
          <input
            name="name"
            required
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Message</label>
          <textarea
            name="body"
            rows={5}
            required
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <button
          type="submit"
          className="bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
        >
          Send message
        </button>
      </form>

      <div className="mt-10 pt-6 border-t border-line text-sm text-ink/55 space-y-1.5">
        <p>General: <a href="mailto:hello@aipick.site" className="text-plum hover:underline">hello@aipick.site</a></p>
        <p>Tool owners: <a href="mailto:owners@aipick.site" className="text-plum hover:underline">owners@aipick.site</a></p>
        <p>Support: <a href="mailto:support@aipick.site" className="text-plum hover:underline">support@aipick.site</a></p>
      </div>
    </main>
  );
}
