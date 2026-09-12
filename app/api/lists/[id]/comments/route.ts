import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS already restricts this to public lists (or the owner viewing a
  // private one) — the query is the same either way.
  const { data, error } = await supabase
    .from("list_comments")
    .select("id, body, created_at, user_id, profiles(username)")
    .eq("list_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comments = (data ?? []).map((c: any) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    userId: c.user_id,
    authorLabel: c.profiles?.username ?? "AIPick user",
    isMine: user?.id === c.user_id,
  }));

  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { body } = await request.json();
  const trimmed = typeof body === "string" ? body.trim() : "";
  if (!trimmed) {
    return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });
  }
  if (trimmed.length > 1000) {
    return NextResponse.json({ error: "Comment is too long" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("list_comments")
    .insert({ list_id: params.id, user_id: user.id, body: trimmed })
    .select("id, body, created_at, user_id")
    .single();

  // RLS blocks inserting onto a private list you don't own — surfaces here
  // as a generic error, same as the list_items insert route above.
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    comment: {
      id: data.id,
      body: data.body,
      createdAt: data.created_at,
      userId: data.user_id,
      authorLabel: profile?.username ?? "AIPick user",
      isMine: true,
    },
  });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { commentId } = await request.json();
  if (!commentId) {
    return NextResponse.json({ error: "commentId is required" }, { status: 400 });
  }

  // RLS allows this for either the comment's own author or the list owner.
  const { error } = await supabase
    .from("list_comments")
    .delete()
    .eq("id", commentId)
    .eq("list_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "deleted" });
}
