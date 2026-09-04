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
