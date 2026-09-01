"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-20">
      <h1 className="font-display font-bold text-2xl">Sign in to vote</h1>
      <p className="text-ink/60 mt-2 text-sm">
        We&apos;ll email you a link — no password needed.
      </p>

      {sent ? (
        <p className="mt-6 text-sm bg-ink/5 border border-line rounded p-4">
          Check your inbox for a sign-in link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-violet"
          />
          <button
            type="submit"
            className="w-full bg-ink text-base rounded px-3 py-2 text-sm font-medium hover:bg-ink/90"
          >
            Send sign-in link
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </main>
  );
}
