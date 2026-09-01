import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { toolId, voteType } = await request.json();
  if (!toolId || !["up", "down"].includes(voteType)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Check for an existing vote from this user on this tool
  const { data: existing } = await supabase
    .from("votes")
    .select("id, vote_type")
    .eq("user_id", user.id)
    .eq("tool_id", toolId)
    .maybeSingle();

  if (existing && existing.vote_type === voteType) {
    // Same button clicked again — remove the vote (toggle off)
    await supabase.from("votes").delete().eq("id", existing.id);
    return NextResponse.json({ status: "removed" });
  }

  if (existing) {
    // Switching from up to down or vice versa
    await supabase
      .from("votes")
      .update({ vote_type: voteType })
      .eq("id", existing.id);
    return NextResponse.json({ status: "updated" });
  }

  await supabase
    .from("votes")
    .insert({ user_id: user.id, tool_id: toolId, vote_type: voteType });
  return NextResponse.json({ status: "created" });
}
