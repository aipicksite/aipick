import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { paypalCaptureOrder } from "@/lib/paypal";
import { recordCouponRedemption } from "@/lib/pricing";

export async function POST(req: Request) {
  const { orderID, payment_id } = await req.json();

  if (!orderID || !payment_id) {
    return NextResponse.json({ error: "orderID and payment_id are required" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: payment } = await service
    .from("payments")
    .select("*")
    .eq("id", payment_id)
    .eq("provider_order_id", orderID)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  // Idempotent — if a webhook already completed it, don't capture twice.
  if (payment.status === "completed") {
    return NextResponse.json({ status: "completed", payment_id: payment.id });
  }

  try {
    const result = await paypalCaptureOrder(orderID);
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];

    if (result.status !== "COMPLETED" || !capture) {
      console.error("[payments/capture-order] Capture not completed:", JSON.stringify(result));
      await service.from("payments").update({ status: "failed" }).eq("id", payment_id);
      return NextResponse.json({ error: "Capture not completed" }, { status: 402 });
    }

    await service
      .from("payments")
      .update({
        status: "completed",
        provider_capture_id: capture.id,
        completed_at: new Date().toISOString(),
      })
      .eq("id", payment_id);

    if (payment.coupon_code) {
      await recordCouponRedemption(payment.coupon_code);
    }

    return NextResponse.json({ status: "completed", payment_id: payment.id });
  } catch (err) {
    // Previously swallowed silently — logging the real PayPal capture error
    // (declined card, currency/account mismatch, expired order, etc.) so it
    // shows up in Vercel's function logs instead of vanishing entirely.
    console.error("[payments/capture-order] PayPal capture failed:", err);
    await service.from("payments").update({ status: "failed" }).eq("id", payment_id);
    return NextResponse.json({ error: "PayPal capture failed" }, { status: 502 });
  }
}
