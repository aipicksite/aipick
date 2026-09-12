import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Toggles the current user's like on a public list and returns the fresh
// state. Mirrors the RemoveFromListButton/DeleteListButton pattern in this
// repo: no server action, plain fetch from a client component.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("list_likes")
    .select("id")
    .eq("list_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("list_likes").delete().eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // RLS also enforces "list must be public" — this insert simply fails
    // (and surfaces as a 500 here) if someone tries to like a private list.
    const { error } = await supabase
      .from("list_likes")
      .insert({ list_id: params.id, user_id: user.id });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data: list } = await supabase
    .from("custom_lists")
    .select("likes_count")
    .eq("id", params.id)
    .maybeSingle();

  return NextResponse.json({ liked: !existing, count: list?.likes_count ?? 0 });
}
