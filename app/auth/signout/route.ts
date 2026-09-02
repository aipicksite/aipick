import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();

  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";
  return NextResponse.redirect(`${origin}${next}`);
}
