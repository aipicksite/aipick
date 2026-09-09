import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { paypalVerifyWebhookSignature } from "@/lib/paypal";
import { recordCouponRedemption } from "@/lib/pricing";

// PayPal → Developer Dashboard → Webhooks → add this route's full URL and
// subscribe to: PAYMENT.CAPTURE.COMPLETED
// This is a backstop: normal flow completes payment via /api/payments/capture-order
// on the client, but if the browser closes before that call finishes, this
// webhook still reconciles the payment as completed.
export async function POST(req: Request) {
  const body = await req.text();

  const verified = await paypalVerifyWebhookSignature({ headers: req.headers, body });
  if (!verified) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const service = createServiceClient();

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const orderId: string | undefined = event.resource?.supplementary_data?.related_ids?.order_id;
    const captureId: string | undefined = event.resource?.id;
    if (!orderId) return NextResponse.json({ received: true });

    const { data: payment } = await service
      .from("payments")
      .select("*")
      .eq("provider_order_id", orderId)
      .maybeSingle();

    if (payment && payment.status !== "completed") {
      await service
        .from("payments")
        .update({
          status: "completed",
          provider_capture_id: captureId ?? payment.provider_capture_id,
          completed_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (payment.coupon_code) {
        await recordCouponRedemption(payment.coupon_code);
      }
    }
  }

  return NextResponse.json({ received: true });
}
