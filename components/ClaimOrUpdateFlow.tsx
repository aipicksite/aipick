"use client";

import { useState } from "react";
import PaymentPanel from "@/components/PaymentPanel";
import ScreenshotUploader from "@/components/ScreenshotUploader";
import SubmitButton from "@/components/SubmitButton";

type Plan = {
  key: string;
  label: string;
  amount_cents: number;
  currency: string;
  isFreeNow: boolean;
};

type Tool = {
  id: string;
  slug: string;
  name: string;
  website_url: string;
};

export default function ClaimOrUpdateFlow({
  tool,
  freeClaimAction,
  updatePlan,
  updateAction,
  defaultEmail,
  error,
}: {
  tool: Tool;
  freeClaimAction: (formData: FormData) => void;
  updatePlan: Plan | null;
  updateAction: (formData: FormData) => void;
  defaultEmail?: string;
  error?: string;
}) {
  const [mode, setMode] = useState<"choose" | "free" | "pay" | "paid-form">("choose");
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const emailPlaceholder = (() => {
    try {
      return `you@${new URL(tool.website_url).hostname.replace(/^www\./, "")}`;
    } catch {
      return "you@yourcompany.com";
    }
  })();

  // ---- Choose: free basic claim vs paid update ----
  if (mode === "choose") {
    return (
      <div className="mt-8 grid sm:grid-cols-2 gap-5 items-stretch">
        <div className="flex flex-col rounded-xl border border-line bg-surface p-6">
          <span className="text-xs font-medium text-ink/45 uppercase tracking-wide">Basic</span>
          <h3 className="font-display font-bold text-lg mt-1">Claim ownership</h3>
          <p className="text-forest font-display font-bold text-2xl mt-2">Free</p>
          <ul className="text-sm text-ink/60 mt-4 space-y-2 flex-1">
            <li className="flex gap-2"><span className="text-forest">✓</span> Proves you own the listing</li>
            <li className="flex gap-2"><span className="text-forest">✓</span> Reviewed by our team</li>
            <li className="flex gap-2 text-ink/40"><span>—</span> No verified badge yet</li>
            <li className="flex gap-2 text-ink/40"><span>—</span> No description/pricing/media updates</li>
          </ul>
          <button
            onClick={() => setMode("free")}
            className="mt-6 text-sm font-medium px-4 py-2.5 rounded-md border border-line hover:border-plum hover:text-plum transition-colors"
          >
            Continue with free claim
          </button>
        </div>

        <div className="relative flex flex-col rounded-xl border border-plum bg-surface p-6 shadow-lift">
          <span className="absolute -top-3 left-6 bg-plum text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
            Most owners choose this
          </span>
          <span className="text-xs font-medium text-ink/45 uppercase tracking-wide">Update & verify</span>
          <h3 className="font-display font-bold text-lg mt-1">
            {updatePlan?.label ?? "Update & verify"}
          </h3>
          <p className="font-display font-bold text-2xl mt-2">
            {updatePlan?.isFreeNow ? (
              <span className="text-forest">Free</span>
            ) : updatePlan ? (
              `$${(updatePlan.amount_cents / 100).toFixed(2)}`
            ) : (
              "—"
            )}
          </p>
          <ul className="text-sm text-ink/70 mt-4 space-y-2 flex-1">
            <li className="flex gap-2"><span className="text-gold">★</span> Verified badge on your listing</li>
            <li className="flex gap-2"><span className="text-gold">★</span> Update description, pricing & highlights</li>
            <li className="flex gap-2"><span className="text-gold">★</span> Add a screenshot + YouTube overview video</li>
            <li className="flex gap-2"><span className="text-gold">★</span> Priority review queue</li>
            <li className="flex gap-2"><span className="text-gold">★</span> Reply publicly to reviews as the owner</li>
          </ul>
          {updatePlan ? (
            <button
              onClick={() => setMode("pay")}
              className="mt-6 text-sm font-medium px-4 py-2.5 rounded-md bg-plum text-white hover:bg-plum-deep transition-colors"
            >
              {updatePlan.isFreeNow ? "Continue — it's free right now" : `Order — $${(updatePlan.amount_cents / 100).toFixed(2)}`}
            </button>
          ) : (
            <p className="mt-6 text-xs text-ink/45">Not available right now — check back later.</p>
          )}
        </div>
      </div>
    );
  }

  // ---- Free claim form ----
  if (mode === "free") {
    return (
      <form action={freeClaimAction} className="mt-8 space-y-4">
        <button
          type="button"
          onClick={() => setMode("choose")}
          className="text-xs text-ink/50 hover:text-plum -mt-2 mb-2 block"
        >
          ← Back
        </button>
        <div>
          <label className="text-sm font-medium block mb-1">Business email *</label>
          <input
            name="business_email"
            type="email"
            required
            placeholder={emailPlaceholder}
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
          <p className="text-xs text-ink/45 mt-1">
            Ideally an email on the tool's own domain — it speeds up review.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Your role</label>
          <input
            name="role"
            placeholder="e.g. Founder, Marketing lead"
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Anything else?</label>
          <textarea
            name="note"
            rows={3}
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        {error && <p className="text-sm text-coral">{error}</p>}
        <SubmitButton
          pendingText="Submitting…"
          className="bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
        >
          Submit claim
        </SubmitButton>
      </form>
    );
  }

  // ---- Pay for update ----
  if (mode === "pay" && updatePlan) {
    return (
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setMode("choose")}
          className="text-xs text-ink/50 hover:text-plum mb-4 block"
        >
          ← Back
        </button>
        <PaymentPanel
          planKey={updatePlan.key}
          label={updatePlan.label}
          amountCents={updatePlan.amount_cents}
          currency={updatePlan.currency}
          isFree={updatePlan.isFreeNow}
          onPaid={(id) => {
            setPaymentId(id);
            setMode("paid-form");
          }}
        />
        {error && <p className="text-sm text-coral mt-4">{error}</p>}
      </div>
    );
  }

  // ---- Paid enrichment form ----
  return (
    <form action={updateAction} className="mt-8 space-y-4">
      <input type="hidden" name="tool_id" value={tool.id} />
      <input type="hidden" name="tool_slug" value={tool.slug} />
      <input type="hidden" name="plan_key" value={updatePlan?.key ?? ""} />
      <input type="hidden" name="payment_id" value={paymentId ?? ""} />

      <div className="bg-forest-soft border border-forest/20 text-forest rounded-lg p-3 text-sm">
        Payment confirmed — now let's verify and update <strong>{tool.name}</strong>.
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Business email *</label>
        <input
          name="business_email"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder={emailPlaceholder}
          className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
        />
        <p className="text-xs text-ink/45 mt-1">
          Ideally an email on the tool's own domain — it speeds up review.
        </p>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Your role</label>
        <input
          name="role"
          placeholder="e.g. Founder, Marketing lead"
          className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Updated short description</label>
        <input
          name="requested_short_description"
          maxLength={140}
          className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Updated full description</label>
        <textarea
          name="requested_description"
          rows={4}
          className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Updated pricing summary</label>
        <input
          name="requested_pricing_summary"
          placeholder="e.g. From $19/mo"
          className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Screenshot</label>
        <ScreenshotUploader fieldName="requested_screenshot_url" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">YouTube video overview URL</label>
        <input
          name="requested_video_url"
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Anything else?</label>
        <textarea
          name="note"
          rows={3}
          className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
        />
      </div>

      {error && <p className="text-sm text-coral">{error}</p>}

      <SubmitButton
        pendingText="Submitting…"
        className="bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
      >
        Submit update
      </SubmitButton>
    </form>
  );
}
