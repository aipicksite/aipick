import type { Tool, Category } from "@/types/database";

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
        <label className="text-sm font-medium block mb-2">Categories</label>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="category_ids"
                value={cat.id}
                defaultChecked={selectedCategoryIds.includes(cat.id)}
              />
              {cat.name}
            </label>
          ))}
        </div>
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

      <button
        type="submit"
        className="bg-plum text-white rounded px-5 py-2.5 text-sm font-medium hover:bg-plum-deep"
      >
        {submitLabel}
      </button>
    </form>
  );
}
