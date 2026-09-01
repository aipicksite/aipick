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

  const { toolId, rating, easeOfUse, valueForMoney, wouldRecommend, body } =
    await request.json();

  if (!toolId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      tool_id: toolId,
      user_id: user.id,
      rating,
      ease_of_use: easeOfUse ?? null,
      value_for_money: valueForMoney ?? null,
      would_recommend: wouldRecommend ?? null,
      body: body?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tool_id,user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "saved" });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { toolId } = await request.json();
  if (!toolId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await supabase
    .from("reviews")
    .delete()
    .eq("tool_id", toolId)
    .eq("user_id", user.id);

  return NextResponse.json({ status: "removed" });
}
