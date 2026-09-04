import { createClient } from "@/lib/supabase/server";

// Fire-and-forget page view logger for the admin analytics dashboard.
// Never throws — a logging failure should never break page rendering.
export function trackPageView(path: string, toolId?: string | null) {
  try {
    const supabase = createClient();
    supabase
      .from("page_views")
      .insert({ path, tool_id: toolId ?? null })
      .then(() => {}, () => {});
  } catch {
    // ignore — analytics logging must never break the page
  }
}
