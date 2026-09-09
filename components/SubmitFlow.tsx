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

export default function SubmitFlow({
  plans,
  submitAction,
  error,
}: {
  plans: Plan[];
  submitAction: (formData: FormData) => void;
  error?: string;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.key === selectedKey) ?? null;

  // ---- Step 1: choose a plan ----
  if (!selectedKey) {
    return (
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <button
            key={plan.key}
            onClick={() => setSelectedKey(plan.key)}
            className="text-left bg-surface border border-line rounded-lg p-5 hover:border-plum transition-colors"
          >
            <span className="text-xs font-medium text-plum uppercase tracking-wide">
              {plan.key === "submit_featured" ? "Recommended" : "Standard"}
            </span>
            <h3 className="font-display font-bold text-lg mt-1">{plan.label}</h3>
            <p className="mt-2">
              {plan.isFreeNow ? (
                <span className="text-forest font-bold text-xl">Free</span>
              ) : (
                <span className="font-bold text-xl">${(plan.amount_cents / 100).toFixed(2)}</span>
              )}
            </p>
            <ul className="text-sm text-ink/60 mt-3 space-y-1 list-disc list-inside">
              <li>Reviewed and published to the directory</li>
              <li>Open to votes, ratings and reviews</li>
              {plan.key === "submit_featured" && plan.featured_days && (
                <>
                  <li>Featured on the homepage for {plan.featured_days} days</li>
                  <li>Priority review queue</li>
                </>
              )}
            </ul>
          </button>
        ))}
      </div>
    );
  }

  // ---- Step 2: pay ----
  if (!paymentId && selectedPlan) {
    return (
      <div className="mt-8">
        <button
          onClick={() => setSelectedKey(null)}
          className="text-xs text-ink/50 hover:text-plum mb-4"
        >
          ← Choose a different plan
        </button>
        <PaymentPanel
          planKey={selectedPlan.key}
          label={selectedPlan.label}
          amountCents={selectedPlan.amount_cents}
          currency={selectedPlan.currency}
          isFree={selectedPlan.isFreeNow}
          onPaid={(id) => setPaymentId(id)}
        />
      </div>
    );
  }

  // ---- Step 3: tool details form ----
  return (
    <form action={submitAction} className="mt-8 space-y-4">
      <input type="hidden" name="plan_key" value={selectedPlan?.key ?? ""} />
      <input type="hidden" name="payment_id" value={paymentId ?? ""} />

      <div className="bg-forest-soft border border-forest/20 text-forest rounded-lg p-3 text-sm">
        Payment confirmed — now tell us about the tool.
      </div>

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
  );
}
