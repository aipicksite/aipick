import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// No login required — this powers the floating "Recommend this tool?"
// widget. A visitor is identified only by a random id the browser makes
// up and stores in localStorage (see FloatingRecommendWidget), not by an
// account, so this is separate from the existing /api/vote + `votes`
// table.
export async function POST(request: Request) {
  const supabase = createClient();

  const { toolId, sessionId, voteType } = await request.json();
  if (
    !toolId ||
    typeof sessionId !== "string" ||
    sessionId.length < 8 ||
    !["up", "down"].includes(voteType)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await supabase
    .from("tool_recommend_votes")
    .upsert(
      { tool_id: toolId, session_id: sessionId, vote_type: voteType },
      { onConflict: "tool_id,session_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = await getCounts(toolId);
  return NextResponse.json({ status: "ok", ...counts });
}

async function getCounts(toolId: string) {
  const supabase = createClient();
  const [{ count: up }, { count: down }] = await Promise.all([
    supabase
      .from("tool_recommend_votes")
      .select("*", { count: "exact", head: true })
      .eq("tool_id", toolId)
      .eq("vote_type", "up"),
    supabase
      .from("tool_recommend_votes")
      .select("*", { count: "exact", head: true })
      .eq("tool_id", toolId)
      .eq("vote_type", "down"),
  ]);
  return { up: up ?? 0, down: down ?? 0 };
}
