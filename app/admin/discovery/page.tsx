import SubmitButton from "@/components/SubmitButton";
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
            {settings.discovery_last_raw_output && (
              <details className="mt-3">
                <summary className="text-xs text-plum cursor-pointer hover:underline">
                  Show raw model output (for debugging why nothing was added)
                </summary>
                <pre className="text-xs text-ink/60 bg-base border border-line rounded-md p-3 mt-2 overflow-x-auto whitespace-pre-wrap">
                  {settings.discovery_last_raw_output}
                </pre>
              </details>
            )}
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
            list="discovery-model-options"
            defaultValue={settings.discovery_model}
            placeholder="e.g. gemini-3.8-flash"
            className="w-full border border-line rounded px-3 py-2 text-sm font-mono"
          />
          <datalist id="discovery-model-options">
            <option value="gemini-3.8-flash" label="Gemini 3.8 Flash — newest, free, built-in search grounding" />
            <option value="gemini-3.7-flash" label="Gemini 3.7 Flash — free" />
            <option value="gemini-3.6-flash" label="Gemini 3.6 Flash — free" />
            <option value="gemini-3.5-flash" label="Gemini 3.5 Flash — free" />
            <option value="gemini-3.5-flash-lite" label="Gemini 3.5 Flash-Lite — free, fastest/cheapest" />
            <option value="gpt-5.6" label="GPT-5.6 — OpenAI's newest" />
            <option value="gpt-5.5" label="GPT-5.5 — OpenAI" />
            <option value="gpt-5.4-mini" label="GPT-5.4 mini — OpenAI, lighter/cheaper" />
            <option value="gpt-5-search-api" label="GPT-5 Search API — OpenAI, built for live web search" />
          </datalist>
          <p className="text-xs text-ink/45 mt-1">
            Click the field for a dropdown of current free-tier options (as of Sept 2026), or type any
            other model name. Providers rename/retire models often — if a run ever fails with a "model
            not found" error, the error message itself usually names the current replacement.
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

        <SubmitButton
          pendingText="Saving…"
          className="bg-plum text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
        >
          Save settings
        </SubmitButton>
      </form>

      <form action={runDiscoveryNow} className="mt-6 pt-6 border-t border-line">
        <SubmitButton
          pendingText="Running — this can take up to a minute…"
          className="border border-line text-sm font-medium px-4 py-2.5 rounded-md hover:border-plum transition-colors"
        >
          Run now
        </SubmitButton>
        <p className="text-xs text-ink/45 mt-2">
          Runs immediately with the settings above (saves them first if you haven't yet) — useful for
          testing before turning on the daily schedule.
        </p>
      </form>
    </main>
  );
}
