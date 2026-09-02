"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(callbackError);
  const [verifying, setVerifying] = useState(false);

  async function handleSend(e: React.FormEvent) {
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

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setVerifying(false);
    if (error) {
      setError(error.message);
      return;
    }
    window.location.href = next;
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-20">
      <span className="text-xs font-medium text-plum uppercase tracking-wide">Sign in</span>
      <h1 className="font-display font-bold text-2xl mt-1">Sign in to AIPick</h1>
      <p className="text-ink/60 mt-2 text-sm">
        We&apos;ll email you a link and a 6-digit code — no password needed.
      </p>

      {!sent ? (
        <form onSubmit={handleSend} className="mt-6 space-y-3">
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
            Send sign-in link & code
          </button>
          {error && <p className="text-sm text-coral">{error}</p>}
        </form>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="text-sm bg-forest-soft border border-forest/20 text-forest rounded-lg p-4">
            Check <strong>{email}</strong> — click the link, or enter the 6-digit code below (more reliable if the link doesn&apos;t seem to work).
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm tracking-[0.3em] text-center focus:outline-none focus:border-plum"
            />
            <button
              type="submit"
              disabled={verifying || code.length < 6}
              className="w-full bg-plum text-white rounded-md px-3.5 py-2.5 text-sm font-medium hover:bg-plum-deep transition-colors disabled:opacity-50"
            >
              {verifying ? "Verifying…" : "Verify code & sign in"}
            </button>
          </form>

          {error && <p className="text-sm text-coral">{error}</p>}

          <button
            onClick={() => {
              setSent(false);
              setCode("");
              setError(null);
            }}
            className="text-sm text-ink/45 hover:text-ink"
          >
            ← Use a different email
          </button>
        </div>
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
