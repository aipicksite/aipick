import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { toolId } = await request.json();
  if (!toolId) {
    return NextResponse.json({ error: "toolId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("list_items")
    .insert({ list_id: params.id, tool_id: toolId });

  // RLS blocks inserts into lists the user doesn't own — that error is expected
  // to surface here if someone tries to tamper with another user's list.
  if (error && error.code !== "23505") {
    // 23505 = unique_violation (tool already in this list) — treat as success/no-op
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "added" });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { toolId } = await request.json();
  if (!toolId) {
    return NextResponse.json({ error: "toolId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("list_id", params.id)
    .eq("tool_id", toolId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "removed" });
}
