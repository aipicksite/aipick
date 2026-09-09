"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type Props = {
  planKey: string;
  label: string;
  amountCents: number; // sticker price, before coupon
  currency: string;
  isFree: boolean; // true if a free_until promo window is active for this plan
  onPaid: (paymentId: string) => void;
};

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PaymentPanel({ planKey, label, amountCents, currency, isFree, onPaid }: Props) {
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [previewCents, setPreviewCents] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const buttonsRendered = useRef(false);

  const effectiveFree = isFree || previewCents === 0;
  const displayCents = previewCents ?? amountCents;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setChecking(true);
    setCouponError(null);
    try {
      // Pure preview — no payments row, no PayPal order. Confirming (below)
      // is what actually creates the real order/payment.
      const res = await fetch("/api/payments/preview-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_key: planKey, coupon_code: couponInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "Invalid coupon");
        setPreviewCents(null);
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(couponInput.trim().toUpperCase());
      setPreviewCents(data.amount_cents);
      // If it previews free (100% coupon), effectiveFree flips true and the
      // "Continue — it's free right now" button appears below for the user
      // to actually confirm — this call itself creates nothing.
    } finally {
      setChecking(false);
    }
  }

  async function handleClaimFree() {
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_key: planKey, coupon_code: appliedCoupon }),
      });
      const data = await res.json();
      if (!res.ok || !data.free) {
        setPayError(data.error ?? "Something went wrong");
        return;
      }
      onPaid(data.payment_id);
    } finally {
      setPaying(false);
    }
  }

  useEffect(() => {
    if (effectiveFree) return; // no PayPal buttons needed when free
    if (!sdkReady || buttonsRendered.current || !window.paypal) return;
    buttonsRendered.current = true;

    window.paypal
      .Buttons({
        style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
        createOrder: async () => {
          setPayError(null);
          const res = await fetch("/api/payments/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan_key: planKey, coupon_code: appliedCoupon }),
          });
          const data = await res.json();
          if (!res.ok) {
            setPayError(data.error ?? "Could not start checkout");
            throw new Error(data.error ?? "create order failed");
          }
          // Store payment_id for the capture step (PayPal only gives us orderID back)
          (window as any).__aipick_payment_id = data.payment_id;
          return data.orderID;
        },
        onApprove: async (data: { orderID: string }) => {
          setPaying(true);
          try {
            const res = await fetch("/api/payments/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderID: data.orderID,
                payment_id: (window as any).__aipick_payment_id,
              }),
            });
            const result = await res.json();
            if (!res.ok || result.status !== "completed") {
              setPayError(result.error ?? "Payment could not be confirmed");
              return;
            }
            onPaid(result.payment_id);
          } finally {
            setPaying(false);
          }
        },
        onError: () => {
          setPayError("PayPal checkout ran into a problem. Please try again.");
        },
      })
      .render("#paypal-button-container");
  }, [sdkReady, effectiveFree, appliedCoupon, planKey]);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-lg font-display font-bold">
          {effectiveFree ? (
            <span className="text-forest">Free</span>
          ) : (
            <>
              {appliedCoupon && previewCents !== null && previewCents !== amountCents && (
                <span className="text-ink/40 line-through text-sm mr-2">
                  ${(amountCents / 100).toFixed(2)}
                </span>
              )}
              ${(displayCents / 100).toFixed(2)}
            </>
          )}
        </span>
      </div>

      {!effectiveFree && (
        <div className="mt-4 flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Coupon code"
            className="flex-1 bg-white border border-line rounded-md px-3 py-2 text-sm focus:outline-none focus:border-plum"
          />
          <button
            type="button"
            onClick={applyCoupon}
            disabled={checking || !couponInput.trim()}
            className="text-sm font-medium px-3 py-2 rounded-md border border-line hover:border-plum disabled:opacity-50"
          >
            {checking ? "Checking…" : "Apply"}
          </button>
        </div>
      )}
      {couponError && <p className="text-xs text-coral mt-1.5">{couponError}</p>}
      {appliedCoupon && !couponError && previewCents !== amountCents && (
        <p className="text-xs text-forest mt-1.5">Coupon "{appliedCoupon}" applied.</p>
      )}

      <div className="mt-5">
        {effectiveFree ? (
          <button
            type="button"
            onClick={handleClaimFree}
            disabled={paying}
            className="w-full bg-plum text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-plum-deep transition-colors disabled:opacity-60"
          >
            {paying ? "One sec…" : "Continue — it's free right now"}
          </button>
        ) : (
          <>
            <Script
              src={`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`}
              onReady={() => setSdkReady(true)}
            />
            <div id="paypal-button-container" />
            {paying && <p className="text-xs text-ink/50 mt-2">Confirming payment…</p>}
          </>
        )}
        {payError && <p className="text-xs text-coral mt-2">{payError}</p>}
      </div>
    </div>
  );
}
