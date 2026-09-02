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

  const { toolId } = await request.json();
  if (!toolId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("saved_tools")
    .select("tool_id")
    .eq("user_id", user.id)
    .eq("tool_id", toolId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("saved_tools")
      .delete()
      .eq("user_id", user.id)
      .eq("tool_id", toolId);
    return NextResponse.json({ status: "removed" });
  }

  await supabase.from("saved_tools").insert({ user_id: user.id, tool_id: toolId });
  return NextResponse.json({ status: "saved" });
}
