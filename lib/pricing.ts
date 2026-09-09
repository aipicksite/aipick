import { createServiceClient } from "@/lib/supabase/service";

export type PricingPlan = {
  key: string;
  label: string;
  amount_cents: number;
  currency: string;
  active: boolean;
  free_until: string | null;
  featured_days: number | null;
};

export type ResolvedPrice = {
  plan: PricingPlan;
  isFree: boolean; // true if inside a free_until promo window
  originalCents: number; // plan price before any coupon (0 if in free window)
  finalCents: number; // amount to actually charge (after coupon, floor 0)
  couponApplied: string | null;
  couponError: string | null;
};

export async function getActivePlans(): Promise<PricingPlan[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("active", true);
  return (data as PricingPlan[]) ?? [];
}

export async function getPlan(key: string): Promise<PricingPlan | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("key", key)
    .eq("active", true)
    .maybeSingle();
  return (data as PricingPlan) ?? null;
}

function isFreeNow(plan: PricingPlan): boolean {
  return !!plan.free_until && new Date(plan.free_until).getTime() > Date.now();
}

// Validates a coupon against a plan and returns the discounted price.
// Server-side only — never trust a client-computed discount.
export async function resolvePrice(
  planKey: string,
  couponCode?: string | null
): Promise<ResolvedPrice | null> {
  const plan = await getPlan(planKey);
  if (!plan) return null;

  const free = isFreeNow(plan);
  if (free) {
    return {
      plan,
      isFree: true,
      originalCents: plan.amount_cents,
      finalCents: 0,
      couponApplied: null,
      couponError: null,
    };
  }

  let finalCents = plan.amount_cents;
  let couponApplied: string | null = null;
  let couponError: string | null = null;

  const code = couponCode?.trim().toUpperCase();
  if (code) {
    const supabase = createServiceClient();
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();

    if (!coupon) {
      couponError = "Coupon not found or inactive.";
    } else if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      couponError = "This coupon has expired.";
    } else if (
      coupon.max_redemptions !== null &&
      coupon.redemption_count >= coupon.max_redemptions
    ) {
      couponError = "This coupon has reached its redemption limit.";
    } else if (
      coupon.applies_to &&
      Array.isArray(coupon.applies_to) &&
      coupon.applies_to.length > 0 &&
      !coupon.applies_to.includes(planKey)
    ) {
      couponError = "This coupon doesn't apply to this plan.";
    } else {
      couponApplied = coupon.code;
      if (coupon.discount_type === "percent") {
        finalCents = Math.round(plan.amount_cents * (1 - coupon.discount_value / 100));
      } else {
        finalCents = Math.round(plan.amount_cents - coupon.discount_value * 100);
      }
      finalCents = Math.max(0, finalCents);
    }
  }

  return {
    plan,
    isFree: finalCents === 0,
    originalCents: plan.amount_cents,
    finalCents,
    couponApplied,
    couponError,
  };
}

// Called only after a PayPal capture succeeds — increments the coupon's use count.
export async function recordCouponRedemption(code: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("coupons")
    .select("redemption_count")
    .eq("code", code)
    .maybeSingle();
  if (!data) return;
  await supabase
    .from("coupons")
    .update({ redemption_count: data.redemption_count + 1 })
    .eq("code", code);
}
