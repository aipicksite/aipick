import { createBrowserClient } from "@supabase/ssr";

// IMPORTANT: this file runs in the browser. Next.js only inlines env vars
// that start with NEXT_PUBLIC_ into browser code — any other name is
// always undefined here, no matter what you set in Vercel. This is a
// Next.js rule, not a Vercel restriction (Vercel accepts NEXT_PUBLIC_
// names fine) — there's no way around it for client-side code.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Set both in Vercel → Project → Settings → Environment Variables, " +
        "then redeploy."
    );
  }

  return createBrowserClient(url, anonKey);
}
