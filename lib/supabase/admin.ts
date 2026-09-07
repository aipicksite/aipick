import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. This client uses the Supabase service_role key, which
// bypasses Row Level Security entirely and can call the Auth Admin API
// (create/update/delete/ban users). Never import this file from a
// Client Component or expose SUPABASE_SERVICE_ROLE_KEY with a
// NEXT_PUBLIC_ prefix.
//
// Requires a `SUPABASE_SERVICE_ROLE_KEY` environment variable — add it in
// Vercel (Project Settings → Environment Variables), copied from
// Supabase → Project Settings → API → service_role secret.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel env vars to use user management."
    );
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
