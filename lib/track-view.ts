import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// Fire-and-forget page view logger for the admin analytics dashboard.
// Never throws — a logging failure should never break page rendering.
export function trackPageView(path: string, toolId?: string | null) {
  try {
    let referrer: string | null = null;
    try {
      referrer = headers().get("referer");
    } catch {
      // headers() can throw outside a request context (e.g. during static build) — ignore.
    }

    const supabase = createClient();
    supabase
      .from("page_views")
      .insert({ path, tool_id: toolId ?? null, referrer })
      .then(() => {}, () => {});
  } catch {
    // ignore — analytics logging must never break the page
  }
}
