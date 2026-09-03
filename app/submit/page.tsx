import { createClient } from "@/lib/supabase/server";
import { submitTool } from "./actions";
import type { ToolSubmission } from "@/types/database";
import Link from "next/link";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: { error?: string; submitted?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myRecent: ToolSubmission[] = [];
  if (user) {
    const { data } = await supabase
      .from("tool_submissions")
      .select("*")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    myRecent = (data as ToolSubmission[] | null) ?? [];
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Submit</span>
      <h1 className="font-display font-bold text-3xl mt-1">Submit an AI tool</h1>
      <p className="text-ink/60 mt-3 leading-relaxed">
        Free to list. Every submission is reviewed before it goes live — usually within a couple of days.
      </p>

      {searchParams.submitted && (
        <div className="mt-6 bg-forest-soft border border-forest/20 text-forest rounded-lg p-4 text-sm">
          Thanks! Your submission is in the queue for review.
        </div>
      )}

      {!user ? (
        <div className="mt-8 bg-surface border border-line rounded-lg p-6 text-center">
          <p className="text-sm text-ink/60">Sign in first to submit a tool.</p>
          <Link
            href="/login?next=/submit"
            className="inline-block mt-3 bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <form action={submitTool} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Tool name *</label>
            <input
              name="name"
              required
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Website URL *</label>
            <input
              name="website_url"
              type="url"
              required
              placeholder="https://"
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Short description</label>
            <input
              name="short_description"
              maxLength={140}
              placeholder="One line — what does it do?"
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Full description</label>
            <textarea
              name="description"
              rows={4}
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Pricing type</label>
              <select
                name="pricing_type"
                defaultValue="freemium"
                className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
              >
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Pricing summary</label>
              <input
                name="pricing_summary"
                placeholder="e.g. From $19/mo"
                className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Categories</label>
            <input
              name="category_names"
              placeholder="Comma-separated, e.g. Writing, SEO"
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              Highlights / key features (one per line)
            </label>
            <textarea
              name="highlights"
              rows={4}
              placeholder={"Real-time collaboration\nExports to Figma\nFree tier includes 3 projects"}
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
            />
            <p className="text-xs text-ink/45 mt-1">
              These show as bullet points on ranking pages once approved — the more specific, the better.
            </p>
          </div>

          {searchParams.error && <p className="text-sm text-coral">{searchParams.error}</p>}

          <button
            type="submit"
            className="bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
          >
            Submit for review
          </button>
        </form>
      )}

      {myRecent.length > 0 && (
        <div className="mt-12 pt-8 border-t border-line">
          <h2 className="font-display font-semibold text-sm text-ink/60 uppercase tracking-wide">
            Your recent submissions
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {myRecent.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3 text-sm">
                <span className="font-medium">{s.name}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    s.status === "approved"
                      ? "border-forest/25 text-forest bg-forest-soft"
                      : s.status === "rejected"
                      ? "border-coral/25 text-coral bg-coral-soft"
                      : "border-gold/40 text-gold bg-gold-soft"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
