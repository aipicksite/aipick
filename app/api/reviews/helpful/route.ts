import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

// No login required — a visitor is identified only by the same
// localStorage id used by the floating recommend widget
// (aipick_visitor_id), not an account.
export async function POST(request: Request) {
  const supabase = createClient();

  const { reviewId, sessionId, voteType } = await request.json();
  if (
    !reviewId ||
    typeof sessionId !== "string" ||
    sessionId.length < 8 ||
    !["helpful", "not_helpful"].includes(voteType)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error: voteError } = await supabase
    .from("review_helpful_votes")
    .upsert(
      { review_id: reviewId, session_id: sessionId, vote_type: voteType },
      { onConflict: "review_id,session_id" }
    );

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  const [{ count: helpful }, { count: notHelpful }] = await Promise.all([
    supabase
      .from("review_helpful_votes")
      .select("*", { count: "exact", head: true })
      .eq("review_id", reviewId)
      .eq("vote_type", "helpful"),
    supabase
      .from("review_helpful_votes")
      .select("*", { count: "exact", head: true })
      .eq("review_id", reviewId)
      .eq("vote_type", "not_helpful"),
  ]);

  // Keep reviews.helpful_count / not_helpful_count in sync so other
  // queries (e.g. admin, sorting) don't need to join review_helpful_votes.
  // Uses the service client — reviews' RLS only lets an author update
  // their own review, and this write is by an anonymous visitor, so a
  // normal anon-scoped update here would silently no-op under RLS.
  const admin = createServiceClient();
  await admin
    .from("reviews")
    .update({ helpful_count: helpful ?? 0, not_helpful_count: notHelpful ?? 0 })
    .eq("id", reviewId);

  return NextResponse.json({ helpful: helpful ?? 0, notHelpful: notHelpful ?? 0 });
}
