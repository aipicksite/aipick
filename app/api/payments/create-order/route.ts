import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resolvePrice } from "@/lib/pricing";
import { paypalCreateOrder } from "@/lib/paypal";

export async function POST(req: Request) {
  const { plan_key, coupon_code, email } = await req.json();

  if (!plan_key || typeof plan_key !== "string") {
    return NextResponse.json({ error: "plan_key is required" }, { status: 400 });
  }

  const priced = await resolvePrice(plan_key, coupon_code);
  if (!priced) {
    return NextResponse.json({ error: "Unknown or inactive plan" }, { status: 404 });
  }
  if (priced.couponError) {
    return NextResponse.json({ error: priced.couponError }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = createServiceClient();

  // Free (promo window or 100% coupon) — no PayPal order needed at all.
  if (priced.finalCents === 0) {
    const { data: payment, error } = await service
      .from("payments")
      .insert({
        provider: "paypal",
        plan_key,
        amount_cents: 0,
        currency: priced.plan.currency,
        coupon_code: priced.couponApplied,
        email: email ?? user?.email ?? null,
        user_id: user?.id ?? null,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: "Could not record free order" }, { status: 500 });
    }
    return NextResponse.json({ free: true, payment_id: payment.id });
  }

  const { data: payment, error } = await service
    .from("payments")
    .insert({
      provider: "paypal",
      plan_key,
      amount_cents: priced.finalCents,
      currency: priced.plan.currency,
      coupon_code: priced.couponApplied,
      email: email ?? user?.email ?? null,
      user_id: user?.id ?? null,
      status: "created",
    })
    .select("id")
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: "Could not create payment record" }, { status: 500 });
  }

  try {
    const order = await paypalCreateOrder({
      amountCents: priced.finalCents,
      currency: priced.plan.currency,
      description: priced.plan.label,
      referenceId: payment.id,
    });

    await service.from("payments").update({ provider_order_id: order.id }).eq("id", payment.id);

    return NextResponse.json({
      orderID: order.id,
      payment_id: payment.id,
      amount_cents: priced.finalCents,
      coupon_applied: priced.couponApplied,
    });
  } catch (err) {
    // This used to be swallowed completely — the checkout button just said
    // "ran into a problem" with zero trace of *why* on either end. PayPal's
    // create-order error body (invalid client id/secret, live/sandbox env
    // mismatch, account not eligible for a currency, etc.) is logged here so
    // the real cause shows up in Vercel's function logs instead of only a
    // generic message reaching the visitor.
    console.error("[payments/create-order] PayPal order creation failed:", err);
    await service.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return NextResponse.json({ error: "PayPal order creation failed" }, { status: 502 });
  }
}
