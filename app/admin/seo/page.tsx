import { requireAdmin } from "@/lib/admin";
import { getSiteSettings } from "@/lib/settings";
import { updateSiteSettings } from "./actions";

export default async function AdminSeoPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <main>
      <h1 className="font-display font-bold text-2xl">SEO settings</h1>
      <p className="text-sm text-ink/55 mt-1.5 max-w-xl">
        These control the default title, description, and social-share image
        used site-wide (homepage and any page without its own metadata),
        plus your Google Analytics and Search Console codes.
      </p>

      <form action={updateSiteSettings} className="space-y-5 mt-8 max-w-xl">
        <div>
          <label className="text-sm font-medium block mb-1">
            Default site title
          </label>
          <input
            name="site_title"
            defaultValue={settings.site_title}
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Default meta description
          </label>
          <textarea
            name="site_description"
            rows={3}
            defaultValue={settings.site_description}
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Default social-share image URL
          </label>
          <input
            name="og_image_url"
            defaultValue={settings.og_image_url}
            placeholder="https://aipick.site/og-cover.png"
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
          <p className="text-xs text-ink/45 mt-1">
            Used when a page (e.g. the homepage) is shared on social media and
            doesn&apos;t already have its own image.
          </p>
        </div>

        <div className="pt-4 border-t border-line">
          <label className="text-sm font-medium block mb-1">
            Google Analytics Measurement ID
          </label>
          <input
            name="google_analytics_id"
            defaultValue={settings.google_analytics_id}
            placeholder="G-XXXXXXXXXX"
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
          <p className="text-xs text-ink/45 mt-1">
            When set, the GA4 tracking script is automatically added to every
            page. Leave blank to disable.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Google Search Console verification code
          </label>
          <input
            name="google_site_verification"
            defaultValue={settings.google_site_verification}
            placeholder="the content= value from the meta verification tag"
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
          <p className="text-xs text-ink/45 mt-1">
            Paste just the code (not the whole &lt;meta&gt; tag) from
            Search Console&apos;s HTML tag verification method.
          </p>
        </div>

        <button
          type="submit"
          className="bg-plum text-white rounded px-5 py-2.5 text-sm font-medium hover:bg-plum-deep"
        >
          Save settings
        </button>
      </form>
    </main>
  );
}
