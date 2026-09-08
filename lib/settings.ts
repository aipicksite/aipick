import { createClient } from "@/lib/supabase/server";

export type SiteSettings = {
  site_title: string;
  site_description: string;
  og_image_url: string;
  google_analytics_id: string;
  google_site_verification: string;
};

const DEFAULTS: SiteSettings = {
  site_title: "AIPick — Discover, Vote, and Pick the Best AI Tools",
  site_description:
    "A community-powered directory to discover, compare, and rank the best AI tools.",
  og_image_url: "",
  google_analytics_id: "",
  google_site_verification: "",
};

// Reads all rows from site_settings and merges them over the defaults above,
// so the site keeps working even before the migration/table exists yet.
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("site_settings").select("key, value");
    if (!data) return DEFAULTS;

    const merged = { ...DEFAULTS };
    for (const row of data as { key: string; value: string | null }[]) {
      if (row.key in merged && row.value !== null && row.value !== "") {
        (merged as any)[row.key] = row.value;
      }
    }
    return merged;
  } catch {
    return DEFAULTS;
  }
}

export type DiscoverySettings = {
  discovery_provider: "openai" | "gemini";
  discovery_model: string;
  discovery_batch_size: string;
  discovery_focus: string;
  discovery_enabled: string; // "true" | "false" — stored as text like the rest of site_settings
  discovery_last_run_at: string;
  discovery_last_run_summary: string;
  discovery_last_raw_output: string;
};

const DISCOVERY_DEFAULTS: DiscoverySettings = {
  discovery_provider: "gemini",
  discovery_model: "gemini-3.8-flash",
  discovery_batch_size: "10",
  discovery_focus: "",
  discovery_enabled: "false",
  discovery_last_run_at: "",
  discovery_last_run_summary: "",
  discovery_last_raw_output: "",
};

// Same site_settings table, just a different set of keys — keeps one
// settings table instead of a new one for a handful of extra config rows.
// Deliberately does NOT store the API key here — that stays as a Vercel
// env var (OPENAI_API_KEY / GEMINI_API_KEY), never in the database.
export async function getDiscoverySettings(): Promise<DiscoverySettings> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", Object.keys(DISCOVERY_DEFAULTS));
    if (!data) return DISCOVERY_DEFAULTS;

    const merged = { ...DISCOVERY_DEFAULTS };
    for (const row of data as { key: string; value: string | null }[]) {
      if (row.key in merged && row.value !== null && row.value !== "") {
        (merged as any)[row.key] = row.value;
      }
    }
    return merged;
  } catch {
    return DISCOVERY_DEFAULTS;
  }
}
