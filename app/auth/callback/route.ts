import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Most common cause: the link was opened in a different browser than
      // the one that requested it (e.g. an email app's in-app browser), or
      // an email security scanner already "clicked" it once, consuming the
      // one-time code before the real click.
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          "That sign-in link didn't work — it may have expired, been used already, or been opened in a different browser than the one you started in. Try the 6-digit code instead."
        )}`
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
