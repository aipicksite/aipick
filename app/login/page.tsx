"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-20">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Sign in</span>
      <h1 className="font-display font-bold text-2xl mt-1">Sign in to AIPick</h1>
      <p className="text-ink/60 mt-2 text-sm">
        We&apos;ll email you a link — no password needed.
      </p>

      {sent ? (
        <div className="mt-6 text-sm bg-forest-soft border border-forest/20 text-forest rounded-lg p-4">
          Check <strong>{email}</strong> for a sign-in link. You can close this tab.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
          <button
            type="submit"
            className="w-full bg-plum text-white rounded-md px-3.5 py-2.5 text-sm font-medium hover:bg-plum-deep transition-colors"
          >
            Send sign-in link
          </button>
          {error && <p className="text-sm text-coral">{error}</p>}
        </form>
      )}

      <p className="text-xs text-ink/40 mt-6 leading-relaxed">
        By continuing you agree to AIPick's{" "}
        <a href="/terms" className="underline hover:text-plum">Terms</a> and{" "}
        <a href="/privacy" className="underline hover:text-plum">Privacy Policy</a>.
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
