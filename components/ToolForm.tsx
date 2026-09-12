import type { Tool, Category } from "@/types/database";
import SubmitButton from "@/components/SubmitButton";
import { VERIFICATION_LEVELS } from "@/components/VerificationBadge";

type Props = {
  tool?: Tool;
  categories: Category[];
  selectedCategoryIds?: string[];
  action: (formData: FormData) => void;
  submitLabel: string;
};

export default function ToolForm({
  tool,
  categories,
  selectedCategoryIds = [],
  action,
  submitLabel,
}: Props) {
  const parents = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (c.parent_id) {
      const list = childrenByParent.get(c.parent_id) ?? [];
      list.push(c);
      childrenByParent.set(c.parent_id, list);
    }
  }

  return (
    <form action={action} className="space-y-5 mt-8">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Name</label>
          <input
            name="name"
            required
            defaultValue={tool?.name}
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">
            Slug (leave blank to auto-generate)
          </label>
          <input
            name="slug"
            defaultValue={tool?.slug}
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Website URL</label>
        <input
          name="website_url"
          type="url"
          required
          defaultValue={tool?.website_url}
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Short description
        </label>
        <input
          name="short_description"
          required
          defaultValue={tool?.short_description ?? ""}
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Full description
        </label>
        <textarea
          name="description"
          rows={4}
          defaultValue={tool?.description ?? ""}
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Highlights / key features (one per line — shown as bullet points on ranking pages)
        </label>
        <textarea
          name="highlights"
          rows={4}
          placeholder={"Real-time collaboration\nExports to Figma\nFree tier includes 3 projects"}
          defaultValue={tool?.highlights?.join("\n") ?? ""}
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Screenshot URL (optional — overrides the auto-generated one)
        </label>
        <input
          name="screenshot_url"
          defaultValue={tool?.screenshot_url ?? ""}
          placeholder="Leave blank to auto-generate from the website"
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
        <p className="text-xs text-ink/45 mt-1">
          The auto screenshot occasionally shows a bot-check page for sites
          with strict anti-bot protection — paste a real screenshot URL here
          to override it when that happens.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">
            Pricing type
          </label>
          <select
            name="pricing_type"
            defaultValue={tool?.pricing_type ?? "freemium"}
            className="w-full border border-line rounded px-3 py-2 text-sm"
          >
            <option value="free">Free</option>
            <option value="freemium">Freemium</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">
            Pricing summary
          </label>
          <input
            name="pricing_summary"
            defaultValue={tool?.pricing_summary ?? ""}
            placeholder="From $20/mo"
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Platforms (comma-separated: web, ios, android, api…)
        </label>
        <input
          name="platforms"
          defaultValue={tool?.platforms?.join(", ") ?? ""}
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Use cases (one per line — shown as a &quot;Use cases&quot; section on the tool page)
        </label>
        <textarea
          name="use_cases"
          rows={3}
          placeholder={"Draft product descriptions in seconds\nSummarize long research papers\nTranslate marketing copy into 10 languages"}
          defaultValue={tool?.use_cases?.join("\n") ?? ""}
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Who it&apos;s for (one per line — shown as a &quot;Who it&apos;s for&quot; section)
        </label>
        <textarea
          name="audience"
          rows={3}
          placeholder={"Marketing teams\nSolo founders\nContent creators"}
          defaultValue={tool?.audience?.join("\n") ?? ""}
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium block">Categories</label>
          <a href="/admin/categories" target="_blank" rel="noreferrer" className="text-xs text-plum hover:underline">
            Manage categories →
          </a>
        </div>
        <p className="text-xs text-ink/45 mb-3">
          Pick the parent category, plus any subcategories that fit — a tool can have more than one.
        </p>
        <div className="border border-line rounded-lg divide-y divide-line max-h-96 overflow-y-auto">
          {parents.map((parent) => {
            const children = childrenByParent.get(parent.id) ?? [];
            return (
              <div key={parent.id} className="p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="category_ids"
                    value={parent.id}
                    defaultChecked={selectedCategoryIds.includes(parent.id)}
                  />
                  {parent.icon && <span>{parent.icon}</span>}
                  {parent.name}
                </label>
                {children.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 ml-6">
                    {children.map((child) => (
                      <label key={child.id} className="flex items-center gap-1.5 text-sm text-ink/70">
                        <input
                          type="checkbox"
                          name="category_ids"
                          value={child.id}
                          defaultChecked={selectedCategoryIds.includes(child.id)}
                        />
                        {child.icon && <span>{child.icon}</span>}
                        {child.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Verification level</label>
        <select
          name="verification_level"
          defaultValue={tool?.verification_level ?? "unverified"}
          className="w-full max-w-xs border border-line rounded px-3 py-2 text-sm"
        >
          {VERIFICATION_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink/45 mt-1">
          Controls the badge shown on the tool page and ranking lists. Raising this above
          &quot;Unverified&quot; also flips the legacy verified flag used elsewhere on the site.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Status</label>
        <select
          name="status"
          defaultValue={tool?.status ?? "active"}
          className="w-full max-w-xs border border-line rounded px-3 py-2 text-sm"
        >
          <option value="active">Active</option>
          <option value="discontinued">Discontinued</option>
        </select>
      </div>

      <SubmitButton
        pendingText="Saving…"
        className="bg-plum text-white rounded px-5 py-2.5 text-sm font-medium hover:bg-plum-deep"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
