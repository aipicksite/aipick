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

export default function ClaimCheckoutFlow({
  tool,
  updatePlan,
  updateAction,
  defaultEmail,
  error,
}: {
  tool: Tool;
  updatePlan: Plan;
  updateAction: (formData: FormData) => void;
  defaultEmail?: string;
  error?: string;
}) {
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const emailPlaceholder = (() => {
    try {
      return `you@${new URL(tool.website_url).hostname.replace(/^www\./, "")}`;
    } catch {
      return "you@yourcompany.com";
    }
  })();

  // ---- Step 1: pay ----
  if (!paymentId) {
    return (
      <div>
        <span className="text-xs font-medium text-ink/45 uppercase tracking-wide">Step 1 of 2</span>
        <h2 className="font-display font-bold text-lg mt-1">Checkout — {updatePlan.label}</h2>
        <p className="text-sm text-ink/55 mt-1 mb-5">
          Confirm payment to unlock the update &amp; claim form for <strong>{tool.name}</strong>.
        </p>
        <PaymentPanel
          planKey={updatePlan.key}
          label={updatePlan.label}
          amountCents={updatePlan.amount_cents}
          currency={updatePlan.currency}
          isFree={updatePlan.isFreeNow}
          onPaid={(id) => setPaymentId(id)}
        />
        {error && <p className="text-sm text-coral mt-4">{error}</p>}
      </div>
    );
  }

  // ---- Step 2: what's next — claim & update details ----
  return (
    <form action={updateAction} className="space-y-4">
      <input type="hidden" name="tool_id" value={tool.id} />
      <input type="hidden" name="tool_slug" value={tool.slug} />
      <input type="hidden" name="plan_key" value={updatePlan.key} />
      <input type="hidden" name="payment_id" value={paymentId} />

      <span className="text-xs font-medium text-ink/45 uppercase tracking-wide">Step 2 of 2</span>
      <div className="bg-forest-soft border border-forest/20 text-forest rounded-lg p-3 text-sm mt-1">
        Payment confirmed — now let's verify and update <strong>{tool.name}</strong>. Once approved
        you'll see a verified badge on this listing.
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
        Submit update &amp; claim
      </SubmitButton>
    </form>
  );
}
