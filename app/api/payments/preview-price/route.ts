import { NextResponse } from "next/server";
import { resolvePrice } from "@/lib/pricing";

// Pure price preview for the "Apply coupon" button — unlike
// /api/payments/create-order, this never inserts a payments row and never
// creates a PayPal order. It just runs the same server-side pricing/coupon
// validation and returns the numbers, so clicking "Apply" repeatedly (or
// trying several codes) leaves no trace in the payments table or on PayPal.
export async function POST(req: Request) {
  const { plan_key, coupon_code } = await req.json();

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

  return NextResponse.json({
    amount_cents: priced.finalCents,
    is_free: priced.finalCents === 0,
    coupon_applied: priced.couponApplied,
  });
}
