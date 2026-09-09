import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. NEVER import this into client components
// or expose SUPABASE_SERVICE_ROLE_KEY with a NEXT_PUBLIC_ prefix.
// Used only in server-only code: API routes and server actions that need to
// write to pricing_plans / coupons / payments regardless of the caller's RLS.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel → Project → Settings " +
        "→ Environment Variables (get the value from Supabase → Project Settings → API)."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
