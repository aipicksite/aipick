import { requireAdmin } from "@/lib/admin";
import { getDiscoverySettings } from "@/lib/settings";
import { saveDiscoverySettings, runDiscoveryNow } from "./actions";
import Link from "next/link";

export default async function AdminDiscoveryPage() {
  await requireAdmin();
  const settings = await getDiscoverySettings();
  const enabled = settings.discovery_enabled === "true";
  const keyEnvVar = settings.discovery_provider === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY";

  return (
    <main className="max-w-2xl">
      <h1 className="font-display font-bold text-2xl">AI tool discovery</h1>
      <p className="text-sm text-ink/55 mt-1.5 leading-relaxed">
        Has an AI model search the web for real tools you don't have yet, and drops the results into{" "}
        <Link href="/admin/submissions" className="text-plum hover:underline">Submissions</Link> as
        pending — exactly like a user-submitted tool. Nothing goes live on its own; you still approve
        or reject each one there.
      </p>

      <div className="bg-surface border border-line rounded-lg p-5 mt-6">
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">Last run</p>
        {settings.discovery_last_run_at ? (
          <>
            <p className="text-sm text-ink/70">
              {new Date(settings.discovery_last_run_at).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p className="text-sm text-ink/55 mt-1">{settings.discovery_last_run_summary}</p>
          </>
        ) : (
          <p className="text-sm text-ink/50">Never run yet.</p>
        )}
      </div>

      <form action={saveDiscoverySettings} className="space-y-5 mt-8">
        <div>
          <label className="text-sm font-medium block mb-1">Provider</label>
          <select
            name="discovery_provider"
            defaultValue={settings.discovery_provider}
            className="w-full border border-line rounded px-3 py-2 text-sm bg-surface"
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
          <p className="text-xs text-ink/45 mt-1">
            Requires a <code className="bg-surface border border-line rounded px-1">{keyEnvVar}</code>{" "}
            environment variable in Vercel — the key itself is never stored in the database.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Model</label>
          <input
            name="discovery_model"
            defaultValue={settings.discovery_model}
            placeholder="e.g. gemini-2.0-flash or gpt-4o"
            className="w-full border border-line rounded px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-ink/45 mt-1">
            Type the exact current model name from your provider's docs — update this whenever they
            ship a newer model, since this isn't auto-detected.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Tools per run</label>
          <input
            name="discovery_batch_size"
            type="number"
            min={1}
            max={30}
            defaultValue={settings.discovery_batch_size}
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
          <p className="text-xs text-ink/45 mt-1">Capped at 30 per run to keep quality high and costs predictable.</p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Focus (optional)</label>
          <input
            name="discovery_focus"
            defaultValue={settings.discovery_focus}
            placeholder="e.g. AI tools for legal teams, or leave blank for a general spread"
            className="w-full border border-line rounded px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="discovery_enabled" defaultChecked={enabled} />
          Enable the daily automatic run (via Vercel Cron)
        </label>

        <button
          type="submit"
          className="bg-plum text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
        >
          Save settings
        </button>
      </form>

      <form action={runDiscoveryNow} className="mt-6 pt-6 border-t border-line">
        <button
          type="submit"
          className="border border-line text-sm font-medium px-4 py-2.5 rounded-md hover:border-plum transition-colors"
        >
          Run now
        </button>
        <p className="text-xs text-ink/45 mt-2">
          Runs immediately with the settings above (saves them first if you haven't yet) — useful for
          testing before turning on the daily schedule.
        </p>
      </form>
    </main>
  );
}
