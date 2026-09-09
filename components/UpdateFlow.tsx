"use client";

import { useState } from "react";
import PaymentPanel from "@/components/PaymentPanel";
import ToolPicker from "@/components/ToolPicker";
import ScreenshotUploader from "@/components/ScreenshotUploader";
import SubmitButton from "@/components/SubmitButton";

type ToolResult = { id: string; name: string; slug: string; logo_url: string | null };
type Plan = {
  key: string;
  label: string;
  amount_cents: number;
  currency: string;
  isFreeNow: boolean;
};

export default function UpdateFlow({
  plan,
  submitAction,
  error,
  defaultEmail,
}: {
  plan: Plan;
  submitAction: (formData: FormData) => void;
  error?: string;
  defaultEmail?: string;
}) {
  const [tool, setTool] = useState<ToolResult | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // ---- Step 1: which tool ----
  if (!tool) {
    return (
      <div className="mt-8">
        <label className="text-sm font-medium block mb-2">Which tool?</label>
        <ToolPicker onSelect={setTool} />
      </div>
    );
  }

  // ---- Step 2: pay ----
  if (!paymentId) {
    return (
      <div className="mt-8">
        <button onClick={() => setTool(null)} className="text-xs text-ink/50 hover:text-plum mb-4">
          ← Choose a different tool
        </button>
        <div className="flex items-center gap-2 mb-4">
          {tool.logo_url && <img src={tool.logo_url} alt="" className="w-6 h-6 rounded" />}
          <span className="font-medium text-sm">{tool.name}</span>
        </div>
        <PaymentPanel
          planKey={plan.key}
          label={plan.label}
          amountCents={plan.amount_cents}
          currency={plan.currency}
          isFree={plan.isFreeNow}
          onPaid={(id) => setPaymentId(id)}
        />
      </div>
    );
  }

  // ---- Step 3: enrichment form ----
  return (
    <form action={submitAction} className="mt-8 space-y-4">
      <input type="hidden" name="tool_id" value={tool.id} />
      <input type="hidden" name="tool_slug" value={tool.slug} />
      <input type="hidden" name="plan_key" value={plan.key} />
      <input type="hidden" name="payment_id" value={paymentId} />

      <div className="bg-forest-soft border border-forest/20 text-forest rounded-lg p-3 text-sm">
        Payment confirmed — updating <strong>{tool.name}</strong>.
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Business email *</label>
        <input
          name="business_email"
          type="email"
          required
          defaultValue={defaultEmail}
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
