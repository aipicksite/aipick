import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ToolAvatar from "@/components/ToolAvatar";
import StarRating from "@/components/StarRating";

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `@${params.username} | AIPick` };
}

export default async function PublicProfilePage({ params }: Props) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, tools(name, slug, logo_url, website_url)")
    .eq("user_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const reviewList = (reviews as any[]) ?? [];

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center gap-4">
        <ToolAvatar name={profile.username} size={56} />
        <div>
          <h1 className="font-display font-bold text-2xl">@{profile.username}</h1>
          <p className="text-sm text-ink/50 mt-0.5">
            {reviewList.length} review{reviewList.length === 1 ? "" : "s"} · member since{" "}
            {new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {reviewList.map((r) => (
          <Link
            key={r.id}
            href={`/tool/${r.tools?.slug}`}
            className="block bg-surface border border-line rounded-lg p-5 hover:border-plum transition-colors"
          >
            <div className="flex items-center gap-3">
              <ToolAvatar name={r.tools?.name ?? "?"} logoUrl={r.tools?.logo_url} websiteUrl={r.tools?.website_url} size={32} />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{r.tools?.name ?? "Unknown tool"}</h3>
                <StarRating value={r.rating} readOnly size={13} />
              </div>
            </div>
            {r.body && <p className="text-sm text-ink/60 mt-3 leading-relaxed">{r.body}</p>}
          </Link>
        ))}
        {reviewList.length === 0 && (
          <p className="text-sm text-ink/55 py-10">No public reviews yet.</p>
        )}
      </div>
    </main>
  );
}
