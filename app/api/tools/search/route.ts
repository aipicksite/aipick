import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ tools: [] });

  const supabase = createClient();
  const { data } = await supabase
    .from("tools")
    .select("id, name, slug, logo_url")
    .ilike("name", `%${q}%`)
    .eq("status", "active")
    .order("name")
    .limit(8);

  return NextResponse.json({ tools: data ?? [] });
}
