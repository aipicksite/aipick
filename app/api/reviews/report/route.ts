import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

// No login required. review_reports has no public RLS policies at all
// (like `coupons`), so this always goes through the service client —
// there's no anon-permitted path to this table by design, which is what
// keeps a visitor from reading who reported what.
export async function POST(request: Request) {
  const { reviewId, sessionId, reason } = await request.json();
  if (!reviewId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createServiceClient();
  const { error } = await admin.from("review_reports").insert({
    review_id: reviewId,
    session_id: typeof sessionId === "string" ? sessionId.slice(0, 100) : null,
    reason: typeof reason === "string" ? reason.trim().slice(0, 500) || null : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
