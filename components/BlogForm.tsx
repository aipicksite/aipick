import type { BlogPost } from "@/types/database";

type Props = {
  post?: BlogPost & { meta_title?: string | null; meta_description?: string | null };
  action: (formData: FormData) => void;
  submitLabel: string;
};

function toLocalDatetimeValue(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BlogForm({ post, action, submitLabel }: Props) {
  return (
    <form action={action} className="space-y-5 mt-8 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Title</label>
          <input
            name="title"
            required
            defaultValue={post?.title}
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">
            Slug (leave blank to auto-generate)
          </label>
          <input
            name="slug"
            defaultValue={post?.slug}
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Excerpt</label>
        <textarea
          name="excerpt"
          rows={2}
          defaultValue={post?.excerpt ?? ""}
          placeholder="Short summary shown on the blog index"
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Cover image URL</label>
        <input
          name="cover_image_url"
          defaultValue={post?.cover_image_url ?? ""}
          className="w-full border border-line rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Body (Markdown supported by the blog renderer)
        </label>
        <textarea
          name="body"
          rows={14}
          required
          defaultValue={post?.body ?? ""}
          className="w-full border border-line rounded px-3 py-2 text-sm font-mono"
        />
      </div>

      <div className="pt-4 border-t border-line">
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-3">
          SEO (optional — falls back to title / excerpt if left blank)
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Meta title</label>
            <input
              name="meta_title"
              defaultValue={post?.meta_title ?? ""}
              className="w-full border border-line rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Meta description</label>
            <textarea
              name="meta_description"
              rows={2}
              defaultValue={post?.meta_description ?? ""}
              className="w-full border border-line rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Publish date (leave blank to save as a draft)
        </label>
        <input
          type="datetime-local"
          name="published_at"
          defaultValue={toLocalDatetimeValue(post?.published_at)}
          className="w-full max-w-xs border border-line rounded px-3 py-2 text-sm"
        />
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
