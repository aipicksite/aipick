"use client";

import { useState } from "react";
import PaymentPanel from "@/components/PaymentPanel";
import SubmitButton from "@/components/SubmitButton";

type Plan = {
  key: string;
  label: string;
  amount_cents: number;
  currency: string;
  isFreeNow: boolean;
  featured_days: number | null;
};

export default function CheckoutSubmitFlow({
  plan,
  submitAction,
  error,
}: {
  plan: Plan;
  submitAction: (formData: FormData) => void;
  error?: string;
}) {
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // ---- Step 1: pay ----
  if (!paymentId) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-ink/45 uppercase tracking-wide">Step 1 of 2</span>
        </div>
        <h2 className="font-display font-bold text-lg">Checkout — {plan.label}</h2>
        <p className="text-sm text-ink/55 mt-1 mb-5">
          Confirm payment to unlock the submission form.
        </p>
        <PaymentPanel
          planKey={plan.key}
          label={plan.label}
          amountCents={plan.amount_cents}
          currency={plan.currency}
          isFree={plan.isFreeNow}
          onPaid={(id) => setPaymentId(id)}
        />
        {error && <p className="text-sm text-coral mt-4">{error}</p>}
      </div>
    );
  }

  // ---- Step 2: what's next — tell us about the tool ----
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-ink/45 uppercase tracking-wide">Step 2 of 2</span>
      </div>
      <h2 className="font-display font-bold text-lg">Tell us about your tool</h2>
      <div className="bg-forest-soft border border-forest/20 text-forest rounded-lg p-3 text-sm mt-3 mb-5">
        Payment confirmed — this is the last step. Fill this in and we'll take it from here.
      </div>

      <form action={submitAction} className="space-y-4">
        <input type="hidden" name="plan_key" value={plan.key} />
        <input type="hidden" name="payment_id" value={paymentId} />

        <div>
          <label className="text-sm font-medium block mb-1">Tool name *</label>
          <input
            name="name"
            required
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Website URL *</label>
          <input
            name="website_url"
            type="url"
            required
            placeholder="https://"
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Short description</label>
          <input
            name="short_description"
            maxLength={140}
            placeholder="One line — what does it do?"
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Full description</label>
          <textarea
            name="description"
            rows={4}
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Pricing type</label>
            <select
              name="pricing_type"
              defaultValue="freemium"
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
            >
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Pricing summary</label>
            <input
              name="pricing_summary"
              placeholder="e.g. From $19/mo"
              className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Categories</label>
          <input
            name="category_names"
            placeholder="Comma-separated, e.g. Writing, SEO"
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">
            Highlights / key features (one per line)
          </label>
          <textarea
            name="highlights"
            rows={4}
            placeholder={"Real-time collaboration\nExports to Figma\nFree tier includes 3 projects"}
            className="w-full bg-surface border border-line rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-plum"
          />
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}

        <SubmitButton
          pendingText="Submitting…"
          className="bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors"
        >
          Submit for review
        </SubmitButton>
      </form>
    </div>
  );
}
